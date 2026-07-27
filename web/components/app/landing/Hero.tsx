"use client";

import { motion } from "motion/react";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { CTA_HREF } from "./config";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Cierra tu quincena en 60 segundos, blindado.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Marcación con foto y GPS + cálculo automático de horas extras,
            recargos y dominicales, según la ley colombiana.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={CTA_HREF}
              className="inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
              style={{ height: 52 }}
            >
              Calcular mi primera nómina gratis
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" />
              Hecho para Pymes colombianas
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" />
              Sin tarjeta para empezar
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-md"
        >
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/10">
            <video
              className="aspect-video w-full object-cover"
              src="/video/turnocheck-demo.mp4"
              poster="/video/turnocheck-demo-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Video demostrativo de TurnoCheck"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
