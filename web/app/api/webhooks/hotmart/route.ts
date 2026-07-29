import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyHotmart } from "@/lib/hotmart-verify";
import { statusForEvent, planForOfferCode } from "@/lib/hotmart-fsm";
import { resolveOrCreateCompany } from "@/lib/hotmart-account";

export const runtime = "nodejs"; // necesitamos node:crypto y el raw body — no Edge

const REPLAY_WINDOW_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  const admin = createAdminClient();

  // Fail-secure: sin el secreto, no se procesa NADA (nunca un default de
  // juguete). No se hace al cargar el módulo (rompería el resto del deploy
  // si falta) — se comprueba en cada request, así el resto de la app sigue
  // funcionando aunque el webhook todavía no esté configurado.
  if (!process.env.HOTMART_HOTTOK) {
    console.error("HOTMART_HOTTOK no configurado — el webhook no puede operar de forma segura");
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  // 1. RAW body — se lee ANTES de parsear (necesario si algún día se verifica
  //    una firma documentada por Hotmart sobre los bytes exactos).
  const rawBody = await req.text();

  // 2. Autenticidad — hottok en tiempo constante, sobre HTTPS.
  const hottok = req.headers.get("x-hotmart-hottok") ?? undefined;
  if (!verifyHotmart(hottok)) {
    await admin.from("webhook_log").insert({ result: "unauthorized" });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 3. Parsear SOLO después de verificar. El shape real de Hotmart varía
  //    entre eventos — se accede todo con optional chaining abajo, nunca
  //    asumiendo que un campo existe.
  interface HotmartPayload {
    event: string;
    id?: string;
    event_id?: string;
    email?: string;
    creation_date?: number;
    data?: {
      buyer?: { email?: string; name?: string };
      purchase?: {
        transaction?: string;
        approved_date?: number;
        price?: { value?: number };
        offer?: { code?: string };
      };
      subscription?: { status?: string; subscriber?: { code?: string } };
    };
  }
  let payload: HotmartPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // 4. Frescura (anti-replay).
  const ts = payload.creation_date ?? payload.data?.purchase?.approved_date;
  if (ts && Date.now() - Number(ts) > REPLAY_WINDOW_MS) {
    return NextResponse.json({ error: "stale" }, { status: 400 });
  }

  // 5. Datos del evento.
  const event: string = payload.event;
  const eventId: string =
    payload.id ?? payload.event_id ?? payload.data?.purchase?.transaction ?? `${event}:${payload.data?.buyer?.email}:${ts ?? ""}`;
  const email: string | undefined = payload.data?.buyer?.email ?? payload.email;
  const name: string = payload.data?.buyer?.name ?? "";
  const subscriberCode: string | undefined = payload.data?.subscription?.subscriber?.code;
  const offerCode: string | undefined = payload.data?.purchase?.offer?.code;
  const priceValue: number | undefined = payload.data?.purchase?.price?.value;
  const subscriptionStatus: string | undefined = payload.data?.subscription?.status?.toLowerCase();

  const newStatus = statusForEvent(event, { priceValue, subscriptionStatus });
  if (!newStatus) {
    return NextResponse.json({ received: true, ignored: event }); // evento que no nos interesa
  }
  if (!email) {
    await admin.from("webhook_log").insert({ event_id: eventId, type: event, result: "error" });
    return NextResponse.json({ error: "missing buyer email" }, { status: 400 });
  }

  const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex");
  const plan = planForOfferCode(offerCode);

  try {
    // 6. Resolver (o crear) la cuenta y la empresa del comprador — fuera de
    //    la transacción SQL a propósito (usa la Admin Auth API, no es SQL),
    //    pero es segura ante reintentos: primero busca, solo crea si falta.
    const { companyId } = await resolveOrCreateCompany(admin, email, name);

    // 7. Idempotencia + transición legal + upsert, todo atómico en la RPC.
    const { data, error } = await admin.rpc("apply_hotmart_event", {
      p_event_id: eventId,
      p_event_type: event,
      p_payload_hash: payloadHash,
      p_company_id: companyId,
      p_plan: plan,
      p_new_status: newStatus,
      p_subscriber_code: subscriberCode ?? null,
    });

    if (error) {
      console.error("webhook hotmart error", { event, code: error.code }); // sin PII
      await admin.from("webhook_log").insert({ event_id: eventId, type: event, result: "error" });
      return NextResponse.json({ error: "processing failed" }, { status: 500 }); // 5xx → Hotmart reintenta
    }

    const result: "applied" | "duplicate" | "illegal" =
      data?.status === "applied" ? "applied" : data?.status === "duplicate" ? "duplicate" : "illegal";
    await admin.from("webhook_log").insert({ event_id: eventId, type: event, result });

    // TODO futuro (no bloquea hoy): enviar el email de bienvenida con Resend
    // cuando RESEND_API_KEY exista — ver docs/sistema/18-VENTA-HOTMART.md
    // "EMAILS CON RESEND". Sin Resend configurado, el usuario entra igual
    // por /login con el mismo correo (el acceso ya quedó activo arriba).

    return NextResponse.json({ received: true, result });
  } catch (err) {
    console.error("webhook hotmart account error", err instanceof Error ? err.message : err);
    await admin.from("webhook_log").insert({ event_id: eventId, type: event, result: "error" });
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
