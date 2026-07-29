import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Encuentra (o crea) la cuenta y la empresa del comprador a partir de su
 * correo de Hotmart. Dos casos:
 *  (a) YA existe (hizo onboarding/login antes de pagar, Modelo 2A) → se
 *      reutiliza su empresa, no se duplica nada.
 *  (b) NUNCA entró a la app (pagó directo desde el paywall sin loguearse
 *      antes) → se crea la cuenta de auth (passwordless, email_confirm) y
 *      una empresa mínima, para que su magic link de siempre la encuentre.
 * Ambas ramas son SEGURAS ante reintentos de Hotmart: primero se busca, solo
 * se crea si de verdad no existe (nunca un insert ciego).
 */
export async function resolveOrCreateCompany(
  admin: SupabaseClient,
  email: string,
  name: string,
): Promise<{ companyId: string; isNewAccount: boolean }> {
  // Supabase JS v2 no tiene getUserByEmail directo — se lista y se filtra,
  // igual que ya hace lib/supabase/admin-queries.ts para el panel de admin.
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  let user = usersData?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  let isNewAccount = false;

  if (!user) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name, source: "hotmart" },
    });
    if (error || !created.user) throw error ?? new Error("No se pudo crear el usuario de Hotmart");
    user = created.user;
    isNewAccount = true;
  }

  const { data: existente } = await admin
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existente) return { companyId: existente.id, isNewAccount };

  const { data: nueva, error: companyError } = await admin
    .from("companies")
    .insert({ owner_id: user.id, name: name || "Mi negocio" })
    .select("id")
    .single();
  if (companyError || !nueva) throw companyError ?? new Error("No se pudo crear la empresa");

  return { companyId: nueva.id, isNewAccount: true };
}
