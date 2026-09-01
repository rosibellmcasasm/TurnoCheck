/** Horario esperado de un empleado, definido día por día (no un solo horario
 *  fijo para toda la semana) — pensado para negocios con jornadas distintas
 *  cada día (ej. sábado medio día). */

export type DiaSemana = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";

export const DIAS_SEMANA: { valor: DiaSemana; etiqueta: string }[] = [
  { valor: "lunes", etiqueta: "Lunes" },
  { valor: "martes", etiqueta: "Martes" },
  { valor: "miercoles", etiqueta: "Miércoles" },
  { valor: "jueves", etiqueta: "Jueves" },
  { valor: "viernes", etiqueta: "Viernes" },
  { valor: "sabado", etiqueta: "Sábado" },
  { valor: "domingo", etiqueta: "Domingo" },
];

export interface HorarioDia {
  activo: boolean;
  entrada: string | null; // "HH:MM"
  salida: string | null; // "HH:MM"
}

export type HorarioSemanal = Partial<Record<DiaSemana, HorarioDia>>;

const INDICE_A_DIA: DiaSemana[] = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

/** El día de la semana (en español, minúsculas, sin tilde) de una fecha "YYYY-MM-DD". */
export function diaDeSemana(fechaISO: string): DiaSemana {
  const [y, m, d] = fechaISO.split("-").map(Number);
  return INDICE_A_DIA[new Date(y, m - 1, d).getDay()];
}

/** El horario esperado (si lo hay y está activo) para una fecha dada. */
export function horarioDelDia(horario: HorarioSemanal | null | undefined, fechaISO: string): HorarioDia | null {
  if (!horario) return null;
  const dia = horario[diaDeSemana(fechaISO)];
  if (!dia || !dia.activo) return null;
  return dia;
}
