"use client";

import { Users, ArrowLeft } from "lucide-react";
import { ChipOption } from "./ChipOption";
import type { OnboardingData, TamanoEquipo } from "@/lib/onboarding-storage";

const TAMANOS: { id: TamanoEquipo; label: string; sub: string }[] = [
  { id: "1-5", label: "1 a 5 empleados", sub: "Plan Micro te queda perfecto" },
  { id: "6-15", label: "6 a 15 empleados", sub: "Plan Pyme te queda perfecto" },
  { id: "+15", label: "Más de 15 empleados", sub: "Te ayudamos igual con el Plan Pyme" },
];

export function StepEquipo({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Atrás
      </button>
      <h1 className="font-display text-xl font-extrabold text-foreground sm:text-2xl">
        ¿Cuántos empleados tienes?
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Así te recomendamos el plan que más te conviene.
      </p>

      <div className="mt-6 space-y-2">
        {TAMANOS.map((t) => (
          <ChipOption
            key={t.id}
            label={t.label}
            sublabel={t.sub}
            icon={Users}
            selected={data.tamanoEquipo === t.id}
            onClick={() => {
              onChange({ tamanoEquipo: t.id });
              onNext();
            }}
          />
        ))}
      </div>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        <button onClick={onNext} className="underline hover:text-foreground">
          Prefiero no decirlo ahora
        </button>
      </p>
    </div>
  );
}
