export type EstadoPuntualidad = "temprano" | "a_tiempo" | "tarde";

/** Tolerancia acordada con el usuario: ±5 minutos cuenta como "a tiempo". */
export const TOLERANCIA_MINUTOS = 5;

function minutosDesdeMedianoche(horaHHMM: string): number {
  const [h, m] = horaHHMM.split(":").map(Number);
  return h * 60 + m;
}

/** Compara la hora real de entrada contra la esperada (ambas "HH:MM").
 *  Devuelve null si no hay hora esperada (no se califica). */
export function calcularPuntualidad(
  horaEsperada: string | null,
  horaReal: string,
): { estado: EstadoPuntualidad; minutos: number } | null {
  if (!horaEsperada) return null;
  const diferencia = minutosDesdeMedianoche(horaReal) - minutosDesdeMedianoche(horaEsperada);
  if (Math.abs(diferencia) <= TOLERANCIA_MINUTOS) return { estado: "a_tiempo", minutos: 0 };
  if (diferencia < 0) return { estado: "temprano", minutos: -diferencia };
  return { estado: "tarde", minutos: diferencia };
}
