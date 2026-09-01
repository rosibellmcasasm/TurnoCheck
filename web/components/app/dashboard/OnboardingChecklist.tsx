"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";

const OCULTO_KEY = "turnocheck_guia_inicio_oculta";

export interface PasoGuia {
  id: string;
  titulo: string;
  href: string;
  hecho: boolean;
}

export function OnboardingChecklist({ pasos }: { pasos: PasoGuia[] }) {
  const [oculto, setOculto] = useState(true); // arranca oculto hasta leer localStorage (evita parpadeo)

  useEffect(() => {
    try {
      setOculto(window.localStorage.getItem(OCULTO_KEY) === "1");
    } catch {
      setOculto(false);
    }
  }, []);

  const completados = pasos.filter((p) => p.hecho).length;
  const todoListo = completados === pasos.length;

  if (oculto || todoListo) return null;

  function cerrar() {
    try {
      window.localStorage.setItem(OCULTO_KEY, "1");
    } catch {
      /* localStorage puede fallar en modo privado — no es crítico, solo se ve otra vez */
    }
    setOculto(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-sm font-bold text-foreground">Guía de inicio</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completados} de {pasos.length} completados
          </p>
        </div>
        <button onClick={cerrar} aria-label="Ocultar guía de inicio" className="text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(completados / pasos.length) * 100}%` }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className="mt-3 space-y-1">
        {pasos.map((paso) => (
          <Link
            key={paso.id}
            href={paso.href}
            className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm hover:bg-secondary"
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                paso.hecho ? "border-success bg-success text-white" : "border-border"
              }`}
            >
              {paso.hecho && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span className={paso.hecho ? "text-muted-foreground line-through" : "text-foreground"}>
              {paso.titulo}
            </span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
