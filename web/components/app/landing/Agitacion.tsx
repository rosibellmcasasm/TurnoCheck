import { TrendingDown, History, FileWarning } from "lucide-react";
import { Reveal } from "./Reveal";

const PUNTOS = [
  {
    icon: TrendingDown,
    texto: "$200.000 a $300.000 pesos al mes en horas mal contadas.",
  },
  {
    icon: History,
    texto: "En 6 meses vas a seguir en el mismo punto — pero con 6 meses menos de sueño.",
  },
  {
    icon: FileWarning,
    texto: "El cuaderno se moja, el Excel se daña. Ninguno sirve como prueba si te demandan.",
  },
];

export function Agitacion() {
  return (
    <section className="bg-secondary/60 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal>
          <h2 className="text-center font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Cada quincena que sigues sumando a mano, tu negocio pierde plata.
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mx-auto mt-8 max-w-xs rounded-2xl border border-primary/20 bg-card p-6 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Al año, eso es
            </p>
            <p className="tabular mt-1 font-display text-4xl font-extrabold text-primary">
              $3.000.000+
            </p>
            <p className="mt-1 text-xs text-muted-foreground">regalados en fugas de nómina</p>
          </div>
        </Reveal>

        <div className="mt-8 space-y-3">
          {PUNTOS.map((p, i) => (
            <Reveal key={p.texto} delay={0.12 + i * 0.06}>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning">
                  <p.icon className="h-4.5 w-4.5" />
                </div>
                <p className="text-[15px] leading-snug text-foreground">{p.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
