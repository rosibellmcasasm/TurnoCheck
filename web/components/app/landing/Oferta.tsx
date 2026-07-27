"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Reveal } from "./Reveal";
import { CTA_HREF } from "./config";

const PLANES = [
  {
    id: "micro",
    nombre: "Plan Micro",
    hasta: "Hasta 5 empleados",
    mensual: 9.99,
    anual: 7.99,
    recomendado: false,
    features: [
      "Marcación con foto + GPS",
      "Cálculo automático de ley colombiana",
      "Reporte mensual en PDF/Excel",
    ],
  },
  {
    id: "pyme",
    nombre: "Plan Pyme",
    hasta: "Hasta 15 empleados",
    mensual: 19.99,
    anual: 15.99,
    recomendado: true,
    features: [
      "Todo lo del Plan Micro",
      "Reporte por WhatsApp en 1 clic",
      "Respaldo legal con foto + GPS ilimitado",
      "Soporte prioritario",
    ],
  },
];

export function Oferta() {
  const [anual, setAnual] = useState(true);

  return (
    <section id="precios" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Se paga sola desde el primer mes
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            7 días de prueba al activar tu cuenta. Cancela cuando quieras.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="mx-auto mt-8 flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1">
          <button
            onClick={() => setAnual(false)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !anual ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setAnual(true)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              anual ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Anual · 2 meses gratis
          </button>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {PLANES.map((plan, i) => {
          const precio = anual ? plan.anual : plan.mensual;
          return (
            <Reveal key={plan.id} delay={i * 0.08}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-6 ${
                  plan.recomendado
                    ? "border-primary bg-card shadow-lg shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {plan.recomendado && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Mejor valor
                  </span>
                )}
                <h3 className="font-display text-lg font-bold text-foreground">{plan.nombre}</h3>
                <p className="text-sm text-muted-foreground">{plan.hasta}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="tabular font-display text-3xl font-extrabold text-foreground">
                    ${precio.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mes</span>
                </div>
                {anual && (
                  <p className="tabular mt-1 text-xs text-muted-foreground">
                    Facturado ${(precio * 12).toFixed(2)}/año
                  </p>
                )}

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={CTA_HREF}
                  className={`mt-6 inline-flex h-12 items-center justify-center rounded-lg text-[15px] font-semibold transition-transform hover:-translate-y-0.5 ${
                    plan.recomendado
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  Crear mi cuenta gratis
                </a>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={0.15}>
        <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-dashed border-border bg-secondary/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Lo que incluye el Plan Pyme
          </p>
          <ul className="mt-3 space-y-2 text-sm text-foreground">
            <li className="flex justify-between">
              <span>El Cierre Blindado (cálculo automático de nómina)</span>
              <span className="tabular text-muted-foreground">$39/mes</span>
            </li>
            <li className="flex justify-between">
              <span>Reporte por WhatsApp para tu contador</span>
              <span className="tabular text-muted-foreground">$15/mes</span>
            </li>
            <li className="flex justify-between">
              <span>Respaldo legal con foto + GPS</span>
              <span className="tabular text-muted-foreground">$25/mes</span>
            </li>
          </ul>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground line-through">Valor total $79/mes</span>
            <span className="font-semibold text-primary">Hoy $19.99/mes</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
