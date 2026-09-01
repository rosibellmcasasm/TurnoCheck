import {
  agruparPorSemana,
  liquidarSemana,
  sumarLiquidaciones,
  desglosarMarcacion,
  DIVISOR_MENSUAL,
  type Marcacion,
  type LiquidacionSemana,
} from "@/lib/nomina";
import type { Employee, TimeEntry } from "@/lib/supabase/queries";

export type TipoReporteAsistencia = "resumen" | "hojas" | "entradas";
export type PeriodoReporteAsistencia = "dia" | "semana" | "mes" | "personalizado";

export interface FiltrosAsistencia {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
  empleadoIds: string[]; // vacío = todos
  disponibilidad: "todos" | "fijo" | "flexible";
}

function aMarcacion(t: TimeEntry, empleado?: Employee): Marcacion {
  return {
    id: t.id,
    empleadoId: t.employee_id,
    fecha: t.fecha,
    horaEntrada: t.hora_entrada.slice(0, 5),
    horaSalida: t.hora_salida ? t.hora_salida.slice(0, 5) : null,
    esFestivo: t.es_festivo,
    descansoInicio: empleado?.descanso_inicio,
    descansoFin: empleado?.descanso_fin,
  };
}

/** Empleados que pasan los filtros de empleado/disponibilidad (la fecha se filtra aparte,
 *  sobre las marcaciones, porque ya vienen pedidas a la base de datos en ese rango). */
export function empleadosFiltrados(empleados: Employee[], filtros: FiltrosAsistencia): Employee[] {
  return empleados
    .filter((e) => filtros.empleadoIds.length === 0 || filtros.empleadoIds.includes(e.id))
    .filter((e) => filtros.disponibilidad === "todos" || e.disponibilidad === filtros.disponibilidad);
}

export interface ResumenEmpleado {
  emp: Employee;
  semanas: { rango: string; liq: LiquidacionSemana }[];
  total: LiquidacionSemana;
}

/** Tipo 1: resumen por empleado (una hoja por empleado) — liquida semana por semana (así lo
 *  exige la ley para las horas extra) y suma el total del período seleccionado. */
export function construirResumenPorEmpleado(entradas: TimeEntry[], empleados: Employee[]): ResumenEmpleado[] {
  const empleadosPorId = new Map(empleados.map((e) => [e.id, e]));
  const marcaciones = entradas
    .filter((t) => t.hora_salida)
    .map((t) => aMarcacion(t, empleadosPorId.get(t.employee_id)));
  const semanas = agruparPorSemana(marcaciones);
  const semanasKeys = Object.keys(semanas).sort();

  const resultado: ResumenEmpleado[] = [];
  for (const emp of empleados) {
    const semanasEmp: { rango: string; liq: LiquidacionSemana }[] = [];
    for (const semanaKey of semanasKeys) {
      const propias = semanas[semanaKey].filter((m) => m.empleadoId === emp.id);
      if (propias.length === 0) continue;
      semanasEmp.push({ rango: semanaKey, liq: liquidarSemana(propias, emp.salario_mensual) });
    }
    if (semanasEmp.length === 0) continue;
    resultado.push({ emp, semanas: semanasEmp, total: sumarLiquidaciones(semanasEmp.map((s) => s.liq)) });
  }
  return resultado;
}

export interface FilaDiaAsistencia {
  emp: Employee;
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  horas: number;
  monto: number;
  esFestivo: boolean;
  fueraDeRango: boolean;
}

/** Tipos 2 y 3 (hojas de horas / entradas de tiempo) comparten la misma fila — una por
 *  marcación completa. El $ aquí es una base simple (horas × valor hora, SIN recargos de
 *  nocturno/extra/dominical) porque esos recargos se calculan por semana completa, no se
 *  pueden repartir de forma exacta por día — el total correcto con recargos está en el
 *  Resumen por empleado. */
export function construirFilasDiarias(entradas: TimeEntry[], empleados: Employee[]): FilaDiaAsistencia[] {
  const empleadosPorId = new Map(empleados.map((e) => [e.id, e]));
  return entradas
    .filter((t) => t.hora_salida)
    .map((t) => {
      const emp = empleadosPorId.get(t.employee_id);
      if (!emp) return null;
      const desglose = desglosarMarcacion(aMarcacion(t, emp));
      if (!desglose) return null;
      const valorHora = emp.salario_mensual / DIVISOR_MENSUAL;
      return {
        emp,
        fecha: t.fecha,
        horaEntrada: t.hora_entrada.slice(0, 5),
        horaSalida: t.hora_salida!.slice(0, 5),
        horas: desglose.horasTotal,
        monto: desglose.horasTotal * valorHora,
        esFestivo: t.es_festivo,
        fueraDeRango: t.fuera_de_rango,
      };
    })
    .filter((f): f is FilaDiaAsistencia => f !== null)
    .sort((a, b) => a.emp.nombre.localeCompare(b.emp.nombre) || a.fecha.localeCompare(b.fecha));
}
