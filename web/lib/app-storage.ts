import type { Marcacion } from "./nomina";
import { readOnboarding } from "./onboarding-storage";

export interface Empleado {
  id: string;
  nombre: string;
  cargo: string;
  salarioMensual: number;
  activo: boolean;
}

export interface AppData {
  empresa: { nombre: string };
  empleados: Empleado[];
  marcaciones: Marcacion[];
}

const APP_KEY = "turnocheck_app";
const SALARIO_MINIMO_DEMO = 1_423_500; // salario mínimo legal vigente aproximado, editable por el dueño

function seedDesdeOnboarding(): AppData {
  const onboarding = readOnboarding();
  const empleados: Empleado[] = onboarding.nombreEmpleado
    ? [
        {
          id: crypto.randomUUID(),
          nombre: onboarding.nombreEmpleado,
          cargo: onboarding.cargoEmpleado || "Sin cargo",
          salarioMensual: SALARIO_MINIMO_DEMO,
          activo: true,
        },
      ]
    : [];
  return {
    empresa: { nombre: onboarding.nombreNegocio || "Mi negocio" },
    empleados,
    marcaciones: [],
  };
}

export function readAppData(): AppData {
  if (typeof window === "undefined") return seedDesdeOnboarding();
  try {
    const raw = window.localStorage.getItem(APP_KEY);
    if (!raw) {
      // Primera vez: generamos la semilla desde el onboarding y la persistimos YA,
      // para que el ID del empleado no cambie en cada lectura (ej. al navegar a /app/marcar).
      const seed = seedDesdeOnboarding();
      writeAppData(seed);
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return seedDesdeOnboarding();
  }
}

export function writeAppData(data: AppData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_KEY, JSON.stringify(data));
}

export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function horaAhora(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
