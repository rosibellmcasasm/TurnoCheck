"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useTransform, animate, motion, useReducedMotion } from "motion/react";

/** Cuenta de 0 (o del valor anterior) hasta `value` — la animación baseline
 *  no-negociable para toda cifra héroe (CLAUDE.md, regla de oro 2). */
export function AnimatedNumber({
  value,
  formatter = (n) => Math.round(n).toLocaleString("es-CO"),
  className,
}: {
  value: number;
  formatter?: (n: number) => string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => formatter(v));
  const previous = useRef(0);

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => motionValue.set(v),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, motionValue, reduceMotion]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
