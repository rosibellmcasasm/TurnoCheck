/**
 * MOTOR DE NÓMINA — Colorado, EE.UU. (COMPS Order #39)
 *
 * SUPUESTOS DOCUMENTADOS:
 * - El pago es POR HORA (tarifa_hora del empleado), no salario mensual fijo.
 * - Horas extra: Colorado exige el MAYOR de estos dos cálculos (no se suman):
 *   (a) horas por encima de 40 en la semana, o
 *   (b) horas por encima de 12 en un solo día.
 *   Recargo de horas extra: 1.5× la tarifa normal.
 * - A diferencia de Colombia, la ley de EE.UU./Colorado NO exige recargo por
 *   trabajar de noche, domingo o festivo — por eso "es_festivo"/domingo no
 *   afecta el pago aquí (queda solo como dato informativo, si se usa).
 * - No se valida contra el salario mínimo de Colorado ni de la ciudad
 *   (varía por condado/ciudad — ej. Denver tiene su propio mínimo, más alto
 *   que el estatal).
 *
 * ⚠️ ESTE MOTOR ES UNA PRIMERA VERSIÓN TÉCNICA, NO UN CONCEPTO LEGAL. Antes
 * de usarlo para pagar nómina real, un abogado laboral o contador con
 * licencia en Colorado debe validar estos supuestos contra el caso concreto
 * (tipo de contrato, convenios, excepciones de la COMPS Order, etc.).
 */

import type { Marcacion } from "@/lib/nomina";

export const LIMITE_SEMANAL_HORAS = 40;
export const LIMITE_DIARIO_HORAS = 12;
export const RECARGO_EXTRA = 0.5; // 1.5× la tarifa normal

function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function horasDeMarcacion(m: Marcacion): number {
  if (!m.horaSalida) return 0;
  const inicio = horaAMinutos(m.horaEntrada);
  let fin = horaAMinutos(m.horaSalida);
  if (fin < inicio) fin += 24 * 60;
  let minutos = fin - inicio;
  if (m.descansoInicio && m.descansoFin) {
    const inicioDescanso = horaAMinutos(m.descansoInicio);
    const finDescanso = horaAMinutos(m.descansoFin);
    if (finDescanso > inicioDescanso) {
      const solapeInicio = Math.max(inicio, inicioDescanso);
      const solapeFin = Math.min(fin, finDescanso);
      if (solapeFin > solapeInicio) minutos -= solapeFin - solapeInicio;
    }
  }
  return Math.max(0, minutos) / 60;
}

export interface LiquidacionSemanaUS {
  horasOrdinarias: number;
  horasExtra: number;
  pagoOrdinario: number;
  pagoExtra: number;
  total: number;
  tarifaHora: number;
}

/** Liquida una semana para UN empleado con su tarifa por hora — el mayor entre el método
 *  semanal (>40h) y el diario (>12h en un solo día), sin duplicar horas contadas. */
export function liquidarSemanaUS(marcaciones: Marcacion[], tarifaHora: number): LiquidacionSemanaUS {
  const horasPorDia = new Map<string, number>();
  for (const m of marcaciones) {
    horasPorDia.set(m.fecha, (horasPorDia.get(m.fecha) ?? 0) + horasDeMarcacion(m));
  }

  const totalHoras = Array.from(horasPorDia.values()).reduce((s, h) => s + h, 0);
  const extraPorSemana = Math.max(0, totalHoras - LIMITE_SEMANAL_HORAS);
  const extraPorDia = Array.from(horasPorDia.values()).reduce(
    (s, h) => s + Math.max(0, h - LIMITE_DIARIO_HORAS),
    0,
  );

  const horasExtra = Math.max(extraPorSemana, extraPorDia);
  const horasOrdinarias = totalHoras - horasExtra;

  const pagoOrdinario = horasOrdinarias * tarifaHora;
  const pagoExtra = horasExtra * tarifaHora * (1 + RECARGO_EXTRA);

  return {
    horasOrdinarias,
    horasExtra,
    pagoOrdinario,
    pagoExtra,
    total: pagoOrdinario + pagoExtra,
    tarifaHora,
  };
}

export function sumarLiquidacionesUS(liqs: LiquidacionSemanaUS[]): LiquidacionSemanaUS {
  const suma = (campo: keyof LiquidacionSemanaUS) => liqs.reduce((s, l) => s + l[campo], 0);
  return {
    horasOrdinarias: suma("horasOrdinarias"),
    horasExtra: suma("horasExtra"),
    pagoOrdinario: suma("pagoOrdinario"),
    pagoExtra: suma("pagoExtra"),
    total: suma("total"),
    tarifaHora: liqs.length > 0 ? liqs[0].tarifaHora : 0,
  };
}
