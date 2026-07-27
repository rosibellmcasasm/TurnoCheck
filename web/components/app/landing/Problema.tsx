import { Fingerprint, Clock3, CalendarClock, ShieldAlert } from "lucide-react";
import { Reveal } from "./Reveal";

const DOLORES = [
  {
    icon: Fingerprint,
    texto: "¿Sientes que tus empleados te meten los dedos en la boca firmando horas que no trabajaron?",
  },
  {
    icon: Clock3,
    texto: "¿Pasas horas con la calculadora en vez de estar con tu familia o atendiendo tu negocio?",
  },
  {
    icon: CalendarClock,
    texto: "¿Te trasnochas cada quincena tratando de descifrar cómo se paga un turno que cruza la medianoche?",
  },
  {
    icon: ShieldAlert,
    texto: "¿Vives con el miedo de que un ex-empleado te demande y no tengas cómo probar sus horarios?",
  },
];

export function Problema() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <h2 className="mx-auto max-w-2xl text-center font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Si administras un negocio con empleados por turnos, esto te suena.
        </h2>
      </Reveal>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {DOLORES.map((d, i) => (
          <Reveal key={d.texto} delay={i * 0.06}>
            <div className="flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <d.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <p className="text-[15px] leading-snug text-foreground">{d.texto}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
