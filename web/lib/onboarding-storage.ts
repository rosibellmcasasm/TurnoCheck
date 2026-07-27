export type TipoNegocio = "restaurante" | "tienda" | "taller" | "otro";
export type TamanoEquipo = "1-5" | "6-15" | "+15";
export type Jornada = "dia" | "noche" | "dominical";

export interface OnboardingData {
  nombreNegocio: string;
  tipoNegocio: TipoNegocio | null;
  jornadas: Jornada[];
  tamanoEquipo: TamanoEquipo | null;
  nombreEmpleado: string;
  cargoEmpleado: string;
}

export const ONBOARDING_KEY = "turnocheck_onboarding";

export const ONBOARDING_DEFAULT: OnboardingData = {
  nombreNegocio: "",
  tipoNegocio: null,
  jornadas: [],
  tamanoEquipo: null,
  nombreEmpleado: "",
  cargoEmpleado: "",
};

export function readOnboarding(): OnboardingData {
  if (typeof window === "undefined") return ONBOARDING_DEFAULT;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return ONBOARDING_DEFAULT;
    return { ...ONBOARDING_DEFAULT, ...JSON.parse(raw) };
  } catch {
    return ONBOARDING_DEFAULT;
  }
}

export function writeOnboarding(data: OnboardingData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
}

/** Plan recomendado según el tamaño de equipo que el dueño declaró. */
export function planRecomendado(tamano: TamanoEquipo | null): "micro" | "pyme" {
  return tamano === "1-5" ? "micro" : "pyme";
}

const RECARGO_NOCTURNO_POR_HORA = 2100; // pesos ilustrativos para la demo del onboarding
const RECARGO_DOMINICAL_POR_HORA = 3850;
const HORA_ORDINARIA = 5500;

export const JORNADA_LABEL: Record<Jornada, string> = {
  dia: "diurno",
  noche: "nocturno",
  dominical: "dominical/festivo",
};

/** Cálculo de demostración para la "primera victoria" del onboarding — NO es el motor legal real
 *  (ese se construye en la Sesión 5 con la tabla completa de recargos/festivos de Colombia).
 *  Se adapta a las jornadas que el dueño declaró, para que el ejemplo se sienta "de su negocio"
 *  y no un caso genérico (si maneja nocturno/dominical, ESE es el recargo que se destaca). */
export function calcularTurnoDemo(jornadas: Jornada[]) {
  const horasOrdinarias = 8;
  const totalOrdinario = horasOrdinarias * HORA_ORDINARIA;

  const incluyeNoche = jornadas.includes("noche");
  const incluyeDominical = jornadas.includes("dominical");

  if (incluyeDominical) {
    const horasRecargo = 8;
    const totalRecargo = horasRecargo * (HORA_ORDINARIA + RECARGO_DOMINICAL_POR_HORA);
    return {
      horaEntrada: "7:00 AM",
      horaSalida: "3:00 PM",
      tipoRecargo: "dominical" as const,
      totalOrdinario: 0,
      totalRecargo,
      total: totalRecargo,
    };
  }

  if (incluyeNoche) {
    const horasNocturnas = 1;
    const totalRecargo = horasNocturnas * (HORA_ORDINARIA + RECARGO_NOCTURNO_POR_HORA);
    return {
      horaEntrada: "6:58 AM",
      horaSalida: "11:00 PM",
      tipoRecargo: "nocturno" as const,
      totalOrdinario,
      totalRecargo,
      total: totalOrdinario + totalRecargo,
    };
  }

  return {
    horaEntrada: "8:00 AM",
    horaSalida: "5:00 PM",
    tipoRecargo: "ninguno" as const,
    totalOrdinario,
    totalRecargo: 0,
    total: totalOrdinario,
  };
}
