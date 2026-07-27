"use client";

import { ArrowRight, Camera, MapPin, ShieldCheck, Lock } from "lucide-react";
import { calcularTurnoDemo, type OnboardingData } from "@/lib/onboarding-storage";

export function StepResultado({ data, onNext }: { data: OnboardingData; onNext: () => void }) {
  const calc = calcularTurnoDemo(data.jornadas);
  const nombre = data.nombreEmpleado || "tu empleado";
  const negocio = data.nombreNegocio || "tu negocio";

  const labelRecargo =
    calc.tipoRecargo === "dominical"
      ? "Recargo dominical"
      : calc.tipoRecargo === "nocturno"
        ? "Recargo nocturno"
        : null;

  return (
    <div>
      <h1 className="font-display text-xl font-extrabold text-foreground sm:text-2xl">
        Este es el turno de {nombre.split(" ")[0]}, calculado
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Así se ve para cada empleado de {negocio}, todos los días.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3 rounded-xl bg-background p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Camera className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">Foto de entrada</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> Ubicación verificada
            </p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
        </div>

        <p className="mt-2.5 flex items-start gap-1.5 px-1 text-xs leading-snug text-muted-foreground">
          <Lock className="mt-0.5 h-3 w-3 shrink-0" />
          Esta foto y ubicación solo se usan para respaldarte a ti ante cualquier
          reclamo — nadie más las ve.
        </p>

        <div className="mt-4 rounded-xl bg-primary p-4 text-primary-foreground">
          <p className="text-[11px] uppercase tracking-wide opacity-80">Total del turno</p>
          <p className="tabular mt-1 text-3xl font-extrabold">
            ${calc.total.toLocaleString("es-CO")}
          </p>
          <p className="mt-1 text-xs opacity-85">
            {calc.horaEntrada} – {calc.horaSalida}
            {labelRecargo ? ` · incluye ${labelRecargo.toLowerCase()}` : ""}
          </p>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {calc.totalOrdinario > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Horas ordinarias</span>
              <span className="tabular font-medium text-foreground">
                ${calc.totalOrdinario.toLocaleString("es-CO")}
              </span>
            </div>
          )}
          {labelRecargo && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{labelRecargo}</span>
              <span className="tabular font-medium text-foreground">
                ${calc.totalRecargo.toLocaleString("es-CO")}
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Esto es 1 turno. Multiplícalo por cada empleado: negocios como el tuyo
        se ahorran hasta 6 horas de cálculos manuales cada quincena.
      </p>

      <button
        onClick={onNext}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground"
      >
        Ver mi plan <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
