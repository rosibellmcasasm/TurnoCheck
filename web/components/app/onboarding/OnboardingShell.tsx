"use client";

import { motion, AnimatePresence } from "motion/react";
import type { ReactNode } from "react";
import Image from "next/image";
import { ProgressBar } from "./ProgressBar";

export function OnboardingShell({
  step,
  total,
  children,
}: {
  step: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex items-center justify-center gap-2 pt-6">
        <Image src="/brand/turnocheck-logo-raster.png" alt="TurnoCheck" width={28} height={26} className="h-7 w-auto" />
        <span className="font-display text-base font-extrabold text-foreground">TurnoCheck</span>
      </div>
      <ProgressBar step={step} total={total} />
      <div className="flex flex-1 items-start justify-center px-6 py-8 sm:items-center">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
