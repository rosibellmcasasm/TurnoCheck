"use client";

import { Sun, Moon, CalendarDays, ArrowRight, ArrowLeft, Check } from "lucide-react";
import type { Jornada, OnboardingData } from "@/lib/onboarding-storage";

const OPCIONES: { id: Jornada; label: string; sub: string; icon: typeof Sun }[] = [
  { id: "dia", label: "Horario de día", sub: "Comercio, oficina, tienda", icon: Sun },
  { id: "noche", label: "Turnos nocturnos", sub: "Restaurantes, bares, vigilancia", icon: Moon },
  { id: "dominical", label: "Dominicales y festivos", sub: "Trabajas fines de semana", icon: CalendarDays },
];

export function StepJornada({
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
  function toggle(id: Jornada) {
    const activas = data.jornadas.includes(id)
      ? data.jornadas.filter((j) => j !== id)
      : [...data.jornadas, id];
    onChange({ jornadas: activas });
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Atrás
      </button>
      <h1 className="font-display text-xl font-extrabold text-foreground sm:text-2xl">
        ¿Qué tipo de jornadas manejas?
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Elige todas las que apliquen — configuramos tus recargos según la ley colombiana.
      </p>

      <div className="mt-6 space-y-2">
        {OPCIONES.map((o) => {
          const selected = data.jornadas.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                selected ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                <o.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-foreground">{o.label}</span>
                <span className="block text-xs text-muted-foreground">{o.sub}</span>
              </span>
              {selected && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={data.jornadas.length === 0}
        className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continuar <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
