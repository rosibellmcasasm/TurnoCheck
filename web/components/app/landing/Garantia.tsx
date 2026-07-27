import { ShieldCheck } from "lucide-react";
import { Reveal } from "./Reveal";

export function Garantia() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <Reveal>
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center sm:p-10">
          <span className="sello-verificado flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h2 className="mt-5 font-display text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            La Garantía del Primer Cierre
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Si en tus primeros 7 días no logras hacer el cierre completo de tu
            nómina con TurnoCheck, te devolvemos tu dinero. Un correo, sin
            preguntas, sin formularios.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Respaldado por la garantía de reembolso de Hotmart (7 días).
          </p>
        </div>
      </Reveal>
    </section>
  );
}
