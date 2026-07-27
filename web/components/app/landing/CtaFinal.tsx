import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { CTA_HREF } from "./config";

export function CtaFinal() {
  return (
    <section className="bg-primary py-16 text-primary-foreground sm:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <Reveal>
          <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            Imagina cerrar tu negocio el domingo e irte a descansar con tu
            familia, sin cuadernos ni miedo a la UGPP.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed opacity-90">
            El dueño que por fin tiene el control — no el que corre detrás de
            los turnos. Prueba TurnoCheck 7 días, con la Garantía del Primer
            Cierre.
          </p>
          <a
            href={CTA_HREF}
            className="mt-7 inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-background px-6 text-[15px] font-semibold text-primary shadow-lg transition-transform hover:-translate-y-0.5"
            style={{ height: 52 }}
          >
            Calcular mi primera nómina gratis
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mx-auto mt-8 max-w-md text-left text-xs leading-relaxed opacity-80">
            PS: TurnoCheck liquida tu quincena en 60 segundos con el Cierre
            Blindado. Hoy entras desde $9.99/mes, con 7 días de prueba y la
            Garantía del Primer Cierre. Cancela cuando quieras.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
