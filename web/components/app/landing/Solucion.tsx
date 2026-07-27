import { Camera, Calculator, FileCheck2 } from "lucide-react";
import { Reveal } from "./Reveal";

const PASOS = [
  {
    icon: Camera,
    titulo: "Tu empleado marca con foto",
    texto: "Un toque desde su celular. El GPS confirma que está en el negocio.",
  },
  {
    icon: Calculator,
    titulo: "El Cierre a Prueba de Demandas calcula",
    texto: "Horas ordinarias, extras, recargos nocturnos, dominicales y festivos — con la ley colombiana ya integrada.",
  },
  {
    icon: FileCheck2,
    titulo: "Tu reporte queda listo",
    texto: "Al final de la quincena, con un respaldo de foto + GPS + hora que te blinda ante cualquier reclamo.",
  },
];

export function Solucion() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            No es que seas mal administrador.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Es que nadie puede calcular a mano los recargos nocturnos,
            dominicales y festivos de la ley colombiana sin equivocarse, ni
            sin regalar sus noches. <span className="font-semibold text-foreground">El Cierre a Prueba de Demandas</span> lo
            hace por ti.
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {PASOS.map((p, i) => (
          <Reveal key={p.titulo} delay={i * 0.08}>
            <div className="flex h-full flex-col items-start rounded-2xl border border-border bg-card p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </div>
              <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-foreground">{p.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.texto}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <div className="mt-10 grid gap-4 rounded-2xl border border-border bg-secondary/60 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Antes</p>
            <p className="mt-1 text-sm text-foreground">
              2-3 horas cada quincena con cuaderno y calculadora, sin ninguna
              prueba real si te demandan.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Con TurnoCheck</p>
            <p className="mt-1 text-sm text-foreground">
              60 segundos, cálculo exacto según la ley colombiana, y un
              respaldo con foto + GPS de cada turno.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
