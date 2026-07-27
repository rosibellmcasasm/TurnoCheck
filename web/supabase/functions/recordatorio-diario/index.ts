// Edge Function: recordatorio-diario
// El "gatillo" real del loop de retención (ver ESTADO.md → Loop de retención).
// Se ejecuta 1 vez al día (programada con pg_cron, ver migración 0005) y le
// avisa por correo al dueño si sus empleados activos todavía no han marcado
// entrada hoy — es el recordatorio que hace que la app se sienta "viva" y
// no se olvide a los 3 días.
//
// Requiere (secretos de la Edge Function, NO del .env.local de Next.js):
//   RESEND_API_KEY   — se configura con: supabase secrets set RESEND_API_KEY=...
//   EMAIL_FROM       — remitente verificado en Resend (ej. avisos@turnocheck.com)
// Sin esos dos secretos, la función corre pero no envía nada (falla en silencio
// registrado en logs) — activarlos es un pendiente del usuario, no de código.

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM");

  const supabase = createClient(supabaseUrl, serviceKey);
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, owner_id, employees(id, activo)");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let avisos = 0;

  for (const company of companies ?? []) {
    const activos = (company.employees ?? []).filter((e: { activo: boolean }) => e.activo);
    if (activos.length === 0) continue;

    const { data: marcaronHoy } = await supabase
      .from("time_entries")
      .select("employee_id")
      .eq("company_id", company.id)
      .eq("fecha", hoy);

    const idsQueMarcaron = new Set((marcaronHoy ?? []).map((m: { employee_id: string }) => m.employee_id));
    const faltantes = activos.filter((e: { id: string }) => !idsQueMarcaron.has(e.id));
    if (faltantes.length === 0) continue;

    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(company.owner_id);
    const email = user?.email;
    if (!email) continue;

    if (resendKey && emailFrom) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: email,
          subject: `${faltantes.length} de tus empleados no han marcado hoy`,
          html: `<p>Hola, en <strong>${company.name}</strong> todavía no marcan entrada: ${faltantes
            .map((e: { id: string }) => e.id)
            .join(", ")}.</p><p>Entra a TurnoCheck para revisar.</p>`,
        }),
      });
    }
    avisos++;
  }

  return new Response(JSON.stringify({ ok: true, avisosEnviados: avisos }), {
    headers: { "Content-Type": "application/json" },
  });
});
