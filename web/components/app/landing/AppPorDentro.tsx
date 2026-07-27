"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneMock } from "./PhoneMock";
import { Reveal } from "./Reveal";
import { ScreenHoy, ScreenReporte, ScreenWhatsapp } from "./AppScreens";

const PANTALLAS = [
  { label: "Hoy: quién llegó y quién no", Screen: ScreenHoy },
  { label: "Cierre de quincena en 1 clic", Screen: ScreenReporte },
  { label: "Reporte para tu contador por WhatsApp", Screen: ScreenWhatsapp },
];

export function AppPorDentro() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reduceMotion.current) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % PANTALLAS.length);
    }, 2800);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <h2 className="mx-auto max-w-xl text-center font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Así se ve TurnoCheck por dentro
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
          Así se ve tu día a día en TurnoCheck.
        </p>
      </Reveal>

      <div
        className="mt-10 flex justify-center"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
      >
        <PhoneMock>
          {(() => {
            const { Screen } = PANTALLAS[index];
            return <Screen />;
          })()}
        </PhoneMock>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {PANTALLAS.map((p, i) => (
          <button
            key={p.label}
            aria-label={`Ver ${p.label}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-primary" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
