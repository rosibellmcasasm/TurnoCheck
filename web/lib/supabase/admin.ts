import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Cliente ADMIN — usa la clave secreta y SALTA RLS por completo.
 *  SOLO se importa desde código de servidor de confianza (webhooks, jobs
 *  internos). JAMÁS importar este archivo desde un componente de cliente
 *  ni desde código que un usuario pueda influenciar sin control de acceso. */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() no puede correr en el navegador");
  }
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
