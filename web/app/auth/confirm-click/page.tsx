"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { LogIn, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

/** Pantalla intermedia entre el correo y el login real. Existe por un solo
 *  motivo: Hotmail/Outlook "pre-visitan" (Safe Links) cualquier link dentro
 *  de un correo apenas llega, para escanearlo por seguridad — si el correo
 *  trajera el link mágico directo, ese escaneo gastaría el link de un solo
 *  uso antes de que el usuario le diera clic. Al apuntar el correo aquí en
 *  vez de al link real, el escaneo automático solo visita esta pantalla
 *  (sin costo), y el link real se consume recién cuando el usuario hace clic
 *  en el botón — que un escáner automatizado no hace. Sigue siendo "un solo
 *  link para el usuario", solo que con un clic de confirmación de por medio.
 *  El link real llega en la URL como ?confirmation_url=... (ver plantilla
 *  "Magic Link" en el dashboard de Supabase). */
function ConfirmClickContenido() {
  const [destino, setDestino] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const marcador = "confirmation_url=";
    const i = window.location.search.indexOf(marcador);
    // Lectura de window.location tras montar (no existe en el render de
    // servidor) — mismo patrón ya usado en onboarding/paywall.
    if (i === -1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(true);
      return;
    }
    // Se toma todo lo que sigue tal cual (no con URLSearchParams): el link
    // real tiene sus propios "&" internos que romperían un parseo normal
    // de query params, ya que "confirmation_url" es siempre el último.
    // decodeURIComponent es obligatorio: la cadena viene tal como llegó por
    // la URL (con %3A, %2F, etc.) — sin decodificar, el navegador no la
    // reconoce como una URL absoluta y la trata como una ruta relativa
    // rota (bug real detectado: terminaba en /auth/https%3a%2f%2f...).
    const crudo = window.location.search.slice(i + marcador.length);
    try {
      setDestino(decodeURIComponent(crudo));
    } catch {
      setError(true);
    }
  }, []);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertTriangle className="h-6 w-6 text-warning" />
        <p className="max-w-xs text-sm text-muted-foreground">
          Este link no es válido. Vuelve a pedir uno nuevo.
        </p>
        <a href="/login" className="text-sm font-semibold text-primary">
          Volver a intentar
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Image src="/brand/turnocheck-logo-raster.png" alt="TurnoCheck" width={56} height={52} className="h-14 w-auto" />
      <div>
        <h1 className="font-display text-xl font-extrabold text-foreground">Ya casi entras</h1>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          Por tu seguridad, confirma con un toque que fuiste tú quien pidió este acceso.
        </p>
      </div>
      <motion.a
        href={destino ?? "#"}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.12 }}
        aria-disabled={!destino}
        className="mt-2 flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" /> Iniciar sesión
      </motion.a>
    </div>
  );
}

export default function ConfirmClickPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmClickContenido />
    </Suspense>
  );
}
