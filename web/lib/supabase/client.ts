import { createBrowserClient } from "@supabase/ssr";

/** Cliente de Supabase para componentes de cliente ("use client").
 *  Usa la publishable key — segura de exponer, protegida por RLS. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
