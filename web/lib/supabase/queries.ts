import type { SupabaseClient } from "@supabase/supabase-js";
import { readOnboarding, ONBOARDING_KEY, planRecomendado } from "@/lib/onboarding-storage";

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  tipo_negocio: string | null;
  jornadas: string[];
  plan: "micro" | "pyme";
  plan_empleados_limite: number;
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
  lat: number | null;
  lng: number | null;
  fuera_de_rango: boolean;
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
  input: { nombre: string; cargo: string; salario_mensual: number; hora_entrada_esperada?: string | null },
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

export async function marcarSalida(supabase: SupabaseClient, timeEntryId: string, horaSalida: string) {
  const { error } = await supabase
    .from("time_entries")
    .update({ hora_salida: horaSalida })
    .eq("id", timeEntryId);
  if (error) throw error;
}

export async function updateCompanyName(supabase: SupabaseClient, companyId: string, name: string) {
  const { error } = await supabase.from("companies").update({ name }).eq("id", companyId);
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
  input: { nombre: string; lat: number; lng: number },
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

export async function deleteWorkSite(supabase: SupabaseClient, siteId: string) {
  const { error } = await supabase.from("work_sites").delete().eq("id", siteId);
  if (error) throw error;
}
