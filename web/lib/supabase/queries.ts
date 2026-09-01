import type { SupabaseClient } from "@supabase/supabase-js";
import { readOnboarding, ONBOARDING_KEY, planRecomendado } from "@/lib/onboarding-storage";

export type PeriodoPago = "semanal" | "quincenal" | "mensual";

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  tipo_negocio: string | null;
  jornadas: string[];
  plan: "micro" | "pyme";
  plan_empleados_limite: number;
  periodo_pago: PeriodoPago;
  hora_cierre_automatico: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  owner_id: string;
  company_id: string;
  nombre: string;
  cargo: string | null;
  salario_mensual: number;
  hora_entrada_esperada: string | null;
  hora_salida_esperada: string | null;
  activo: boolean;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  owner_id: string;
  company_id: string;
  employee_id: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string | null;
  es_festivo: boolean;
  foto_url: string | null;
  foto_salida_url: string | null;
  lat: number | null;
  lng: number | null;
  fuera_de_rango: boolean;
  cierre_automatico: boolean;
  work_site_id: string | null;
  created_at: string;
}

export interface WorkSite {
  id: string;
  owner_id: string;
  company_id: string;
  nombre: string;
  lat: number;
  lng: number;
  activo: boolean;
  cliente_final: string | null;
  avance_porcentaje: number;
  radio_metros: number;
  created_at: string;
}

const LIMITE_POR_PLAN: Record<"micro" | "pyme", number> = { micro: 5, pyme: 15 };

/** Trae la empresa del usuario logueado. Si es la primera vez que entra
 *  (recién hizo login tras el onboarding anónimo), la crea a partir de lo
 *  que respondió en el onboarding (localStorage) — y solo entonces se borra
 *  ese localStorage, porque ya quedó guardado de verdad en la base de datos. */
export async function ensureCompany(supabase: SupabaseClient, userId: string): Promise<Company> {
  const { data: existente } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (existente) return existente as Company;

  const onboarding = readOnboarding();
  const plan = planRecomendado(onboarding.tamanoEquipo);

  const { data: nueva, error } = await supabase
    .from("companies")
    .insert({
      owner_id: userId,
      name: onboarding.nombreNegocio || "Mi negocio",
      tipo_negocio: onboarding.tipoNegocio,
      jornadas: onboarding.jornadas,
      plan,
      plan_empleados_limite: LIMITE_POR_PLAN[plan],
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("subscriptions").insert({
    owner_id: userId,
    company_id: nueva.id,
    plan,
    status: "trialing",
    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // El primer empleado que agregó en el onboarding (si escribió uno) se
  // trae también, para que no sienta que "empezó de cero" tras crear su cuenta.
  if (onboarding.nombreEmpleado) {
    await supabase.from("employees").insert({
      owner_id: userId,
      company_id: nueva.id,
      nombre: onboarding.nombreEmpleado,
      cargo: onboarding.cargoEmpleado || null,
    });
  }

  if (typeof window !== "undefined") window.localStorage.removeItem(ONBOARDING_KEY);

  return nueva as Company;
}

export async function listEmployees(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Employee[];
}

/** true = se puede agregar; false = ya llegó al límite del plan (mostrar paywall, no un error). */
export function puedeAgregarEmpleado(company: Company, empleadosActivos: number) {
  return empleadosActivos < company.plan_empleados_limite;
}

export async function createEmployee(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  input: {
    nombre: string;
    cargo: string;
    salario_mensual: number;
    hora_entrada_esperada?: string | null;
    hora_salida_esperada?: string | null;
  },
) {
  const { data, error } = await supabase
    .from("employees")
    .insert({ owner_id: userId, company_id: companyId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data as Employee;
}

export async function deleteEmployee(supabase: SupabaseClient, employeeId: string) {
  const { error } = await supabase.from("employees").delete().eq("id", employeeId);
  if (error) throw error;
}

/** true si la empresa ya tiene AL MENOS una marcación registrada alguna vez
 *  (no solo hoy) — para la guía de inicio. */
export async function hasAnyMarcacion(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("time_entries")
    .select("id")
    .eq("company_id", companyId)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function listTimeEntriesForDate(supabase: SupabaseClient, companyId: string, fecha: string) {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("company_id", companyId)
    .eq("fecha", fecha);
  if (error) throw error;
  return data as TimeEntry[];
}

export async function listTimeEntriesInRange(
  supabase: SupabaseClient,
  companyId: string,
  desde: string,
  hasta: string,
) {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("company_id", companyId)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .not("hora_salida", "is", null);
  if (error) throw error;
  return data as TimeEntry[];
}

/** Turnos abiertos ahora mismo (sin hora de salida), de cualquier fecha — para el
 *  panel "quién está trabajando ahora" y el mapa en vivo. */
export async function listMarcacionesAbiertas(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("company_id", companyId)
    .is("hora_salida", null);
  if (error) throw error;
  return data as TimeEntry[];
}

export async function updateCompanyHoraCierre(
  supabase: SupabaseClient,
  companyId: string,
  horaCierre: string | null,
) {
  const { error } = await supabase
    .from("companies")
    .update({ hora_cierre_automatico: horaCierre })
    .eq("id", companyId);
  if (error) throw error;
}

/** Cierra solos los turnos que quedaron abiertos de DÍAS ANTERIORES (nunca el de
 *  hoy, que puede seguir en curso de verdad) usando la hora de cierre configurada.
 *  Es una limpieza de "primera versión": corre cuando alguien abre la app, no un
 *  cron en segundo plano — así que el cierre aparece un poco después de esa hora,
 *  no exactamente a esa hora. */
export async function cerrarTurnosVencidos(supabase: SupabaseClient, company: Company) {
  if (!company.hora_cierre_automatico) return;
  const hoy = new Date().toISOString().slice(0, 10);
  const { data: abiertos, error } = await supabase
    .from("time_entries")
    .select("id, fecha")
    .eq("company_id", company.id)
    .is("hora_salida", null)
    .lt("fecha", hoy);
  if (error) throw error;
  if (!abiertos || abiertos.length === 0) return;

  await Promise.all(
    abiertos.map((t) =>
      supabase
        .from("time_entries")
        .update({ hora_salida: company.hora_cierre_automatico, cierre_automatico: true })
        .eq("id", t.id),
    ),
  );
}

/** Todas las marcaciones completas de la empresa, sin límite de fecha — para
 *  sumar horas invertidas por proyecto desde que arrancó cada obra. */
export async function listTimeEntriesCompletas(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("company_id", companyId)
    .not("hora_salida", "is", null);
  if (error) throw error;
  return data as TimeEntry[];
}

export async function crearMarcacionEntrada(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  input: {
    employee_id: string;
    fecha: string;
    hora_entrada: string;
    es_festivo: boolean;
    foto_url?: string;
    lat?: number;
    lng?: number;
    fuera_de_rango?: boolean;
    work_site_id?: string | null;
  },
) {
  const { data, error } = await supabase
    .from("time_entries")
    .insert({ owner_id: userId, company_id: companyId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data as TimeEntry;
}

export async function marcarSalida(
  supabase: SupabaseClient,
  timeEntryId: string,
  horaSalida: string,
  fotoSalidaUrl?: string,
) {
  const { error } = await supabase
    .from("time_entries")
    .update({ hora_salida: horaSalida, foto_salida_url: fotoSalidaUrl ?? null })
    .eq("id", timeEntryId);
  if (error) throw error;
}

/** El bucket "marcaciones" es privado — para mostrar la foto hay que pedir
 *  una URL firmada de corta duración, nunca exponer el bucket como público. */
export async function getFotoMarcacionUrl(supabase: SupabaseClient, path: string) {
  const { data, error } = await supabase.storage.from("marcaciones").createSignedUrl(path, 120);
  if (error) throw error;
  return data.signedUrl;
}

export async function updateCompanyName(supabase: SupabaseClient, companyId: string, name: string) {
  const { error } = await supabase.from("companies").update({ name }).eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyPeriodoPago(
  supabase: SupabaseClient,
  companyId: string,
  periodoPago: PeriodoPago,
) {
  const { error } = await supabase.from("companies").update({ periodo_pago: periodoPago }).eq("id", companyId);
  if (error) throw error;
}

export async function listWorkSites(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("work_sites")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as WorkSite[];
}

export async function createWorkSite(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  input: { nombre: string; lat: number; lng: number; radio_metros?: number },
) {
  const { data, error } = await supabase
    .from("work_sites")
    .insert({ owner_id: userId, company_id: companyId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data as WorkSite;
}

export async function toggleWorkSiteActivo(supabase: SupabaseClient, siteId: string, activo: boolean) {
  const { error } = await supabase.from("work_sites").update({ activo }).eq("id", siteId);
  if (error) throw error;
}

/** Datos del proyecto que se le muestra al cliente final (para cobrar) —
 *  separado de los datos de la geocerca (nombre/ubicación). */
export async function updateWorkSiteProyecto(
  supabase: SupabaseClient,
  siteId: string,
  input: { cliente_final: string | null; avance_porcentaje: number },
) {
  const { error } = await supabase.from("work_sites").update(input).eq("id", siteId);
  if (error) throw error;
}

export async function deleteWorkSite(supabase: SupabaseClient, siteId: string) {
  const { error } = await supabase.from("work_sites").delete().eq("id", siteId);
  if (error) throw error;
}
