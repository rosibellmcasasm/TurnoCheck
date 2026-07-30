import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "TurnoCheck <hola@turnocheck.app>";

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null; // Resend no configurado todavía — el caller decide cómo degradar
  return new Resend(key);
}

const BOTON = (href: string, texto: string) => `
  <p style="margin:24px 0;">
    <a href="${href}" style="background:#2554C7;color:#fff;padding:14px 28px;
       border-radius:14px;text-decoration:none;font-weight:600;display:inline-block;
       font-family:sans-serif;">${texto}</a>
  </p>`;

const PIE = `
  <p style="margin-top:32px;color:#6b7280;font-size:13px;font-family:sans-serif;">
    ¿Dudas? Responde a este correo y te ayudamos.
  </p>`;

/** Correo de bienvenida — se manda SOLO cuando el webhook de Hotmart crea una
 *  cuenta nueva (nunca en renovaciones/recompras del mismo comprador). Incluye
 *  el magic link real para que entre sin fricción desde el primer momento. */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://turnocheck.app"}/auth/callback?next=/app` },
  });
  const accessLink = data?.properties?.action_link ?? "https://turnocheck.app/login";

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "¡Bienvenido a TurnoCheck! Tu acceso ya está listo",
    html: `
      <div style="font-family:sans-serif;color:#1f2430;max-width:480px;">
        <h1 style="font-size:20px;">¡Hola${name ? " " + name.split(" ")[0] : ""}! 👋</h1>
        <p>Tu compra se confirmó y tu cuenta de TurnoCheck ya está activa — desde hoy tienes
        respaldo con foto y ubicación en cada marcación, y el cálculo de nómina se hace solo.</p>
        ${BOTON(accessLink, "Entrar a TurnoCheck →")}
        <p style="color:#6b7280;font-size:13px;">Este link te deja entrar sin contraseña. Si ya
        caducó, entra a <a href="https://turnocheck.app/login">turnocheck.app/login</a> con este
        mismo correo y te mandamos uno nuevo.</p>
        ${PIE}
      </div>`,
  });
  return !error;
}

/** Pago fallido (dunning) — periodo de gracia, tono tranquilo, sin cortar el
 *  acceso todavía (el webhook ya deja el plan activo durante past_due). */
export async function sendPaymentFailedEmail(email: string, name: string): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "No pudimos procesar tu pago — actualiza tu método",
    html: `
      <div style="font-family:sans-serif;color:#1f2430;max-width:480px;">
        <h1 style="font-size:20px;">Hola${name ? " " + name.split(" ")[0] : ""},</h1>
        <p>Intentamos cobrar tu suscripción de TurnoCheck y no se pudo procesar — puede ser una
        tarjeta vencida o un fondo insuficiente. Tu acceso sigue activo por unos días mientras lo
        resuelves, sin que pierdas nada de tu información.</p>
        ${BOTON("https://turnocheck.app/login", "Actualizar mi método de pago →")}
        <p style="color:#6b7280;font-size:13px;">Si no lo resuelves, tu acceso se pausará (no se
        borra nada) hasta que actualices el pago.</p>
        ${PIE}
      </div>`,
  });
  return !error;
}

/** Cancelación — tono empático, sin culpar, puerta abierta a volver. */
export async function sendCancellationEmail(email: string, name: string): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;
  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Tu suscripción a TurnoCheck fue cancelada",
    html: `
      <div style="font-family:sans-serif;color:#1f2430;max-width:480px;">
        <h1 style="font-size:20px;">Hola${name ? " " + name.split(" ")[0] : ""},</h1>
        <p>Confirmamos la cancelación de tu suscripción — mantienes el acceso hasta el final del
        ciclo que ya pagaste, y tu información queda guardada por si decides volver.</p>
        <p>Si cancelaste por algo puntual que podamos resolver, respóndenos este correo — con
        gusto te ayudamos.</p>
        ${PIE}
      </div>`,
  });
  return !error;
}
