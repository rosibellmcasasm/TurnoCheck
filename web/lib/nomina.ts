/**
 * MOTOR DE CÁLCULO DE NÓMINA — Colombia (Ley 2101 de 2021, jornada de 42h vigente desde el 15/jul/2026)
 *
 * SUPUESTOS DOCUMENTADOS (para auditoría — ver ESTADO.md → "Parámetros legales Colombia"):
 * - Divisor mensual: 210 horas → valor hora ordinaria = salario mensual ÷ 210.
 * - Jornada diurna: 6:00 a 19:00 · Jornada nocturna: 19:00 a 6:00.
 * - Umbral de horas extra: 42 horas por semana (no por día) — el exceso semanal se reparte
 *   proporcionalmente entre las horas diurnas/nocturnas trabajadas esa semana.
 * - Recargos: nocturno +35% · extra diurna +25% · extra nocturna +75% · dominical/festivo +80%
 *   (se asume SIN día de descanso compensatorio; si el negocio SÍ lo da, el recargo baja a 75%
 *   — configurable en `RECARGO_DOMINICAL_FESTIVO`).
 * - El recargo dominical/festivo se calcula sobre el valor hora base y se SUMA aparte del
 *   recargo nocturno/extra de esas mismas horas (no se combinan multiplicativamente) — es la
 *   convención más común y conservadora, pero varía según el caso.
 *
 * ⚠️ ESTE MOTOR ES UNA PRIMERA VERSIÓN TÉCNICA, NO UN CONCEPTO LEGAL. Antes de usarlo para
 * pagar nómina real o cobrarle a un cliente, un contador o abogado laboral colombiano debe
 * validar estos supuestos contra su caso concreto (convenios colectivos, tipo de contrato, etc.).
 */

export const DIVISOR_MENSUAL = 210;
export const JORNADA_SEMANAL_MAXIMA = 42;

export const RECARGO_NOCTURNO = 0.35;
export const RECARGO_EXTRA_DIURNA = 0.25;
export const RECARGO_EXTRA_NOCTURNA = 0.75;
export const RECARGO_DOMINICAL_FESTIVO = 0.8;

const HORA_INICIO_DIURNA = 6;
const HORA_INICIO_NOCTURNA = 19;

export interface Marcacion {
  id: string;
  empleadoId: string;
  fecha: string; // YYYY-MM-DD
  horaEntrada: string; // HH:mm
  horaSalida: string | null; // HH:mm, null = turno abierto
  esFestivo: boolean; // el dueño lo marca manualmente (domingo se autodetecta aparte)
  fotoUrl?: string;
  lat?: number;
  lng?: number;
  // Descanso (ej. hora de almuerzo) del empleado — se resta de las horas
  // pagadas. Mismo horario de descanso para todos los días trabajados.
  descansoInicio?: string | null;
  descansoFin?: string | null;
}

function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function esDomingo(fecha: string): boolean {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

/** Divide un turno en minutos diurnos y nocturnos, manejando turnos que cruzan la medianoche.
 *  Los minutos que caen dentro del descanso (si se define) no se cuentan como ninguno de los
 *  dos — quedan fuera del total, igual que exige la ley para el almuerzo no remunerado. */
function dividirDiurnoNocturno(
  horaEntrada: string,
  horaSalida: string,
  descansoInicio?: string | null,
  descansoFin?: string | null,
) {
  const inicio = horaAMinutos(horaEntrada);
  let fin = horaAMinutos(horaSalida);
  if (fin < inicio) fin += 24 * 60; // cruzó la medianoche (fin === inicio = turno de 0 minutos, no 24h)

  const inicioDiurno = HORA_INICIO_DIURNA * 60;
  const inicioNocturno = HORA_INICIO_NOCTURNA * 60;
  const inicioDescanso = descansoInicio ? horaAMinutos(descansoInicio) : null;
  const finDescanso = descansoFin ? horaAMinutos(descansoFin) : null;

  let minutosDiurnos = 0;
  let minutosNocturnos = 0;

  for (let t = inicio; t < fin; t++) {
    const horaDelDia = t % (24 * 60);
    if (inicioDescanso !== null && finDescanso !== null && horaDelDia >= inicioDescanso && horaDelDia < finDescanso) {
      continue; // descanso no remunerado — no cuenta como trabajado
    }
    const esDiurno = horaDelDia >= inicioDiurno && horaDelDia < inicioNocturno;
    if (esDiurno) minutosDiurnos++;
    else minutosNocturnos++;
  }

  return { horasDiurnas: minutosDiurnos / 60, horasNocturnas: minutosNocturnos / 60 };
}

export interface DesgloseMarcacion {
  marcacionId: string;
  horasDiurnas: number;
  horasNocturnas: number;
  horasTotal: number;
  esDominicalOFestivo: boolean;
}

export function desglosarMarcacion(m: Marcacion): DesgloseMarcacion | null {
  if (!m.horaSalida) return null;
  const { horasDiurnas, horasNocturnas } = dividirDiurnoNocturno(
    m.horaEntrada,
    m.horaSalida,
    m.descansoInicio,
    m.descansoFin,
  );
  return {
    marcacionId: m.id,
    horasDiurnas,
    horasNocturnas,
    horasTotal: horasDiurnas + horasNocturnas,
    esDominicalOFestivo: m.esFestivo || esDomingo(m.fecha),
  };
}

export interface LiquidacionSemana {
  horasOrdinariasDiurnas: number;
  horasOrdinariasNocturnas: number;
  horasExtraDiurnas: number;
  horasExtraNocturnas: number;
  horasDominicalFestivo: number;
  pagoOrdinarioDiurno: number;
  pagoOrdinarioNocturno: number;
  pagoExtraDiurno: number;
  pagoExtraNocturno: number;
  pagoRecargoDominicalFestivo: number;
  total: number;
  valorHoraOrdinaria: number;
}

/** Liquida un conjunto de marcaciones (de UNA semana) para UN empleado con su salario mensual. */
export function liquidarSemana(marcaciones: Marcacion[], salarioMensual: number): LiquidacionSemana {
  const valorHoraOrdinaria = salarioMensual / DIVISOR_MENSUAL;
  const desgloses = marcaciones.map(desglosarMarcacion).filter((d): d is DesgloseMarcacion => d !== null);

  const totalDiurnas = desgloses.reduce((s, d) => s + d.horasDiurnas, 0);
  const totalNocturnas = desgloses.reduce((s, d) => s + d.horasNocturnas, 0);
  const totalHoras = totalDiurnas + totalNocturnas;
  const horasDominicalFestivo = desgloses
    .filter((d) => d.esDominicalOFestivo)
    .reduce((s, d) => s + d.horasTotal, 0);

  const horasExtraTotal = Math.max(0, totalHoras - JORNADA_SEMANAL_MAXIMA);
  const horasOrdinariasTotal = totalHoras - horasExtraTotal;

  const proporcionNocturna = totalHoras > 0 ? totalNocturnas / totalHoras : 0;
  const horasExtraNocturnas = horasExtraTotal * proporcionNocturna;
  const horasExtraDiurnas = horasExtraTotal - horasExtraNocturnas;
  const horasOrdinariasNocturnas = totalNocturnas - horasExtraNocturnas;
  const horasOrdinariasDiurnas = horasOrdinariasTotal - horasOrdinariasNocturnas;

  const pagoOrdinarioDiurno = horasOrdinariasDiurnas * valorHoraOrdinaria;
  const pagoOrdinarioNocturno = horasOrdinariasNocturnas * valorHoraOrdinaria * (1 + RECARGO_NOCTURNO);
  const pagoExtraDiurno = horasExtraDiurnas * valorHoraOrdinaria * (1 + RECARGO_EXTRA_DIURNA);
  const pagoExtraNocturno = horasExtraNocturnas * valorHoraOrdinaria * (1 + RECARGO_EXTRA_NOCTURNA);
  const pagoRecargoDominicalFestivo = horasDominicalFestivo * valorHoraOrdinaria * RECARGO_DOMINICAL_FESTIVO;

  const total =
    pagoOrdinarioDiurno +
    pagoOrdinarioNocturno +
    pagoExtraDiurno +
    pagoExtraNocturno +
    pagoRecargoDominicalFestivo;

  return {
    horasOrdinariasDiurnas,
    horasOrdinariasNocturnas,
    horasExtraDiurnas,
    horasExtraNocturnas,
    horasDominicalFestivo,
    pagoOrdinarioDiurno,
    pagoOrdinarioNocturno,
    pagoExtraDiurno,
    pagoExtraNocturno,
    pagoRecargoDominicalFestivo,
    total,
    valorHoraOrdinaria,
  };
}

/** Suma varias liquidaciones de semana (ej. las semanas dentro de un mismo período de pago,
 *  o un rango de fechas de reporte que abarca más de una semana). */
export function sumarLiquidaciones(liqs: LiquidacionSemana[]): LiquidacionSemana {
  const suma = (campo: keyof LiquidacionSemana) => liqs.reduce((s, l) => s + l[campo], 0);
  return {
    horasOrdinariasDiurnas: suma("horasOrdinariasDiurnas"),
    horasOrdinariasNocturnas: suma("horasOrdinariasNocturnas"),
    horasExtraDiurnas: suma("horasExtraDiurnas"),
    horasExtraNocturnas: suma("horasExtraNocturnas"),
    horasDominicalFestivo: suma("horasDominicalFestivo"),
    pagoOrdinarioDiurno: suma("pagoOrdinarioDiurno"),
    pagoOrdinarioNocturno: suma("pagoOrdinarioNocturno"),
    pagoExtraDiurno: suma("pagoExtraDiurno"),
    pagoExtraNocturno: suma("pagoExtraNocturno"),
    pagoRecargoDominicalFestivo: suma("pagoRecargoDominicalFestivo"),
    total: suma("total"),
    valorHoraOrdinaria: liqs.length > 0 ? liqs[0].valorHoraOrdinaria : 0,
  };
}

/** Agrupa marcaciones por semana ISO (lunes a domingo) para poder liquidar semana por semana. */
export function agruparPorSemana(marcaciones: Marcacion[]): Record<string, Marcacion[]> {
  const grupos: Record<string, Marcacion[]> = {};
  for (const m of marcaciones) {
    const [y, mo, d] = m.fecha.split("-").map(Number);
    const fecha = new Date(y, mo - 1, d);
    const diaSemana = (fecha.getDay() + 6) % 7; // lunes = 0
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() - diaSemana);
    const key = lunes.toISOString().slice(0, 10);
    grupos[key] = grupos[key] ? [...grupos[key], m] : [m];
  }
  return grupos;
}
