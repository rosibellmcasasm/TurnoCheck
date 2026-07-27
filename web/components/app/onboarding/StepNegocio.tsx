"use client";

import { Utensils, Store, Wrench, Building2, ArrowRight } from "lucide-react";
import { ChipOption } from "./ChipOption";
import type { OnboardingData, TipoNegocio } from "@/lib/onboarding-storage";

const TIPOS: { id: TipoNegocio; label: string; icon: typeof Utensils }[] = [
  { id: "restaurante", label: "Restaurante o comida", icon: Utensils },
  { id: "tienda", label: "Tienda o retail", icon: Store },
  { id: "taller", label: "Taller o construcción", icon: Wrench },
  { id: "otro", label: "Otro tipo de negocio", icon: Building2 },
];

export function StepNegocio({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onNext: () => void;
}) {
  const canContinue = data.nombreNegocio.trim().length > 1 && data.tipoNegocio !== null;

  return (
    <div>
      <h1 className="font-display text-xl font-extrabold text-foreground sm:text-2xl">
        Cuéntanos de tu negocio
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Para personalizar tus cálculos desde el primer momento.
      </p>

      <label className="mt-6 block text-sm font-medium text-foreground">
        Nombre de tu negocio
        <input
          autoFocus
          value={data.nombreNegocio}
          onChange={(e) => onChange({ nombreNegocio: e.target.value })}
          placeholder="Ej: Restaurante El Fogón"
          className="mt-1.5 h-12 w-full rounded-lg border border-border bg-card px-4 text-[15px] text-foreground outline-none focus:border-primary"
        />
      </label>

      <p className="mt-6 text-sm font-medium text-foreground">¿Qué tipo de negocio es?</p>
      <div className="mt-3 space-y-2">
        {TIPOS.map((t) => (
          <ChipOption
            key={t.id}
            label={t.label}
            icon={t.icon}
            selected={data.tipoNegocio === t.id}
            onClick={() => onChange({ tipoNegocio: t.id })}
          />
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continuar <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
