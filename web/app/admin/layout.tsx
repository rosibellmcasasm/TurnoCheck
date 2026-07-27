import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Segunda capa de protección de /admin (la primera es proxy.ts): si por lo
 *  que sea llegó hasta acá alguien sin sesión o con otro correo, lo saca sin
 *  mostrar nada del panel. Nunca confiar solo en el proxy para una ruta que
 *  expone datos de TODAS las empresas. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/app");
  }

  return <div className="mx-auto min-h-dvh max-w-2xl px-5 pb-16 pt-6">{children}</div>;
}
