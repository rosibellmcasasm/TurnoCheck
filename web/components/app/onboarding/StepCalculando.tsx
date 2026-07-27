"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { Calculator } from "lucide-react";
import { JORNADA_LABEL, type OnboardingData } from "@/lib/onboarding-storage";

export function StepCalculando({
  data,
  onDone,
}: {
  data: OnboardingData;
  onDone: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onDone, 1900);
    return () => clearTimeout(id);
  }, [onDone]);

  const etiquetas = data.jornadas.map((j) => JORNADA_LABEL[j]).join(", ");

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <motion.div
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
      >
        <Calculator className="h-7 w-7" />
      </motion.div>
      <h1 className="mt-6 font-display text-lg font-extrabold text-foreground">
        Calculando el turno de {data.nombreEmpleado.split(" ")[0] || "tu empleado"}...
      </h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Configurando tus recargos {etiquetas || "legales"} según la ley
        colombiana vigente.
      </p>
      <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.8, ease: "linear" }}
        />
      </div>
    </div>
  );
}
