import { createAdminClient } from "@/lib/supabase/admin";

export interface EmpresaAdmin {
  id: string;
  nombre: string;
  email: string | null;
  plan: "micro" | "pyme";
  estadoSuscripcion: "trialing" | "active" | "past_due" | "canceled";
  trialTerminaEl: string | null;
  empleadosActivos: number;
  creadaEl: string;
}

export interface ResumenAdmin {
  totalEmpresas: number;
  enTrial: number;
  activas: number;
  vencidas: number; // past_due o canceled
  altasUltimos7Dias: number;
  empresas: EmpresaAdmin[];
}

/** Junta companies + subscriptions + conteo de empleados con el cliente admin
 *  (salta RLS a propósito: es la única forma de ver TODAS las empresas, no
 *  solo la propia). Solo se llama desde app/admin/*, que ya verificó en el
 *  servidor que quien pide esto es el correo de ADMIN_EMAIL — nunca desde
 *  código que un usuario común pueda alcanzar. */
export async function getResumenAdmin(): Promise<ResumenAdmin> {
  const admin = createAdminClient();

  const { data: companies, error: errCompanies } = await admin
    .from("companies")
    .select("id, name, plan, created_at, owner_id")
    .order("created_at", { ascending: false });
  if (errCompanies) throw errCompanies;

  const { data: subs, error: errSubs } = await admin
    .from("subscriptions")
    .select("company_id, status, trial_ends_at");
  if (errSubs) throw errSubs;

  const { data: empleados, error: errEmpleados } = await admin
    .from("employees")
    .select("company_id, activo");
  if (errEmpleados) throw errEmpleados;

  const subsPorEmpresa = new Map(subs?.map((s) => [s.company_id, s]));
  const empleadosPorEmpresa = new Map<string, number>();
  for (const e of empleados ?? []) {
    if (!e.activo) continue;
    empleadosPorEmpresa.set(e.company_id, (empleadosPorEmpresa.get(e.company_id) ?? 0) + 1);
  }

  // Los correos de los dueños viven en auth.users (no en una tabla pública) —
  // el cliente admin sí puede leerlos vía la Admin API.
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailPorOwner = new Map(usersData?.users.map((u) => [u.id, u.email ?? null]));

  const haceSieteDias = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const empresas: EmpresaAdmin[] = (companies ?? []).map((c) => {
    const sub = subsPorEmpresa.get(c.id);
    return {
      id: c.id,
      nombre: c.name,
      email: emailPorOwner.get(c.owner_id) ?? null,
      plan: c.plan as "micro" | "pyme",
      estadoSuscripcion: (sub?.status ?? "trialing") as EmpresaAdmin["estadoSuscripcion"],
      trialTerminaEl: sub?.trial_ends_at ?? null,
      empleadosActivos: empleadosPorEmpresa.get(c.id) ?? 0,
      creadaEl: c.created_at,
    };
  });

  return {
    totalEmpresas: empresas.length,
    enTrial: empresas.filter((e) => e.estadoSuscripcion === "trialing").length,
    activas: empresas.filter((e) => e.estadoSuscripcion === "active").length,
    vencidas: empresas.filter((e) => e.estadoSuscripcion === "past_due" || e.estadoSuscripcion === "canceled").length,
    altasUltimos7Dias: empresas.filter((e) => new Date(e.creadaEl).getTime() >= haceSieteDias).length,
    empresas,
  };
}
