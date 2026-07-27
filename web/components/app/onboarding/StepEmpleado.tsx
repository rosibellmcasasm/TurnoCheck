"use client";

import { ArrowRight, ArrowLeft, UserPlus } from "lucide-react";
import type { OnboardingData } from "@/lib/onboarding-storage";

export function StepEmpleado({
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
  const canContinue = data.nombreEmpleado.trim().length > 1;

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Atrás
      </button>

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <UserPlus className="h-5 w-5" />
      </div>
      <h1 className="mt-4 font-display text-xl font-extrabold text-foreground sm:text-2xl">
        Agrega tu primer empleado
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Para que veas cómo TurnoCheck calcula un turno real, ahora mismo.
      </p>

      <label className="mt-6 block text-sm font-medium text-foreground">
        Nombre del empleado
        <input
          autoFocus
          value={data.nombreEmpleado}
          onChange={(e) => onChange({ nombreEmpleado: e.target.value })}
          placeholder="Ej: Carlos Ramírez"
          className="mt-1.5 h-12 w-full rounded-lg border border-border bg-card px-4 text-[15px] text-foreground outline-none focus:border-primary"
        />
      </label>

      <label className="mt-4 block text-sm font-medium text-foreground">
        Cargo (opcional)
        <input
          value={data.cargoEmpleado}
          onChange={(e) => onChange({ cargoEmpleado: e.target.value })}
          placeholder="Ej: Cocina, mesero, cajero..."
          className="mt-1.5 h-12 w-full rounded-lg border border-border bg-card px-4 text-[15px] text-foreground outline-none focus:border-primary"
        />
      </label>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        Ver el cálculo en vivo <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
