"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ensureCompany } from "@/lib/supabase/queries";

function CallbackContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function completar() {
      // El cliente de Supabase (@supabase/ssr) usa flujo PKCE: el link mágico
      // llega con "?code=" en la URL y hay que cambiarlo por la sesión real
      // ANTES de pedir el usuario — detectSessionInUrl no alcanza a hacerlo
      // solo con el código de query (sí funcionaba con el fragmento #access_token
      // del flujo implícito viejo, pero este proyecto usa PKCE).
      const code = searchParams.get("code");
      let user = null;

      if (code) {
        // Bug real detectado y corregido: antes se volvía a pedir el usuario
        // con getUser() justo después del exchange, y esa segunda llamada a
        // veces corría antes de que la sesión terminara de propagarse —
        // mostraba "link expirado" aunque el login SÍ había funcionado (el
        // log de Supabase confirmaba un login exitoso). Ahora se usa
        // directo el user que ya devuelve el propio exchange, sin esa
        // segunda llamada innecesaria.
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError || !data.user) {
          setError("El link ya expiró o no es válido. Vuelve a pedir uno nuevo.");
          return;
        }
        user = data.user;
      } else {
        const { data } = await supabase.auth.getUser();
        user = data.user;
      }

      if (!user) {
        setError("El link ya expiró o no es válido. Vuelve a pedir uno nuevo.");
        return;
      }

      try {
        await ensureCompany(supabase, user.id);
      } catch {
        setError("Tu cuenta quedó activa, pero no pudimos guardar tu negocio. Intenta de nuevo.");
        return;
      }

      router.replace(next);
    }

    completar();
  }, [next, router]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertTriangle className="h-6 w-6 text-warning" />
        <p className="max-w-xs text-sm text-muted-foreground">{error}</p>
        <a href="/login" className="text-sm font-semibold text-primary">
          Volver a intentar
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Activando tu cuenta...</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackContenido />
    </Suspense>
  );
}
