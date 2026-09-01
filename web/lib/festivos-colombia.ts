/** Calculador de festivos colombianos — funciona para CUALQUIER año (no una
 *  tabla que hay que actualizar cada diciembre). Sigue la Ley 51 de 1983
 *  ("Ley Emiliani"): la mayoría de los festivos que caen entre semana se
 *  trasladan al lunes siguiente; los de Semana Santa y los de fecha fija
 *  patria no se trasladan. */

export interface Festivo {
  fecha: Date;
  nombre: string;
}

function fecha(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function alSiguienteLunes(d: Date): Date {
  const dia = d.getUTCDay(); // 0=domingo, 1=lunes, ...
  if (dia === 1) return d;
  const diasHastaLunes = dia === 0 ? 1 : 8 - dia;
  const resultado = new Date(d);
  resultado.setUTCDate(d.getUTCDate() + diasHastaLunes);
  return resultado;
}

/** Domingo de Pascua del año dado (algoritmo de Gauss/Meeus, calendario gregoriano). */
function domingoDePascua(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return fecha(year, mes, dia);
}

function sumarDias(d: Date, dias: number): Date {
  const resultado = new Date(d);
  resultado.setUTCDate(d.getUTCDate() + dias);
  return resultado;
}

function mismaFecha(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Todos los festivos de Colombia para un año dado, con su nombre. */
export function festivosColombia(year: number): Festivo[] {
  const pascua = domingoDePascua(year);

  const fijos: Festivo[] = [
    { fecha: fecha(year, 1, 1), nombre: "Año Nuevo" },
    { fecha: fecha(year, 5, 1), nombre: "Día del Trabajo" },
    { fecha: fecha(year, 7, 20), nombre: "Día de la Independencia" },
    { fecha: fecha(year, 8, 7), nombre: "Batalla de Boyacá" },
    { fecha: fecha(year, 12, 8), nombre: "Inmaculada Concepción" },
    { fecha: fecha(year, 12, 25), nombre: "Navidad" },
    { fecha: sumarDias(pascua, -3), nombre: "Jueves Santo" },
    { fecha: sumarDias(pascua, -2), nombre: "Viernes Santo" },
  ];

  const trasladables: Festivo[] = [
    { fecha: fecha(year, 1, 6), nombre: "Reyes Magos" },
    { fecha: fecha(year, 3, 19), nombre: "San José" },
    { fecha: sumarDias(pascua, 39), nombre: "Ascensión del Señor" },
    { fecha: sumarDias(pascua, 60), nombre: "Corpus Christi" },
    { fecha: sumarDias(pascua, 68), nombre: "Sagrado Corazón" },
    { fecha: fecha(year, 6, 29), nombre: "San Pedro y San Pablo" },
    { fecha: fecha(year, 8, 15), nombre: "Asunción de la Virgen" },
    { fecha: fecha(year, 10, 12), nombre: "Día de la Raza" },
    { fecha: fecha(year, 11, 1), nombre: "Todos los Santos" },
    { fecha: fecha(year, 11, 11), nombre: "Independencia de Cartagena" },
  ].map((f) => ({ fecha: alSiguienteLunes(f.fecha), nombre: f.nombre }));

  return [...fijos, ...trasladables];
}

/** Los próximos N festivos desde una fecha (incluye el año siguiente si hace
 *  falta, para que funcione bien en diciembre). */
export function proximosFestivos(desde: Date, cantidad: number): Festivo[] {
  const inicioHoy = fecha(desde.getUTCFullYear(), desde.getUTCMonth() + 1, desde.getUTCDate());
  const candidatos = [...festivosColombia(desde.getUTCFullYear()), ...festivosColombia(desde.getUTCFullYear() + 1)]
    .filter((f) => f.fecha.getTime() >= inicioHoy.getTime())
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  return candidatos.slice(0, cantidad);
}

/** ¿Es festivo en Colombia esta fecha? (el domingo NO se incluye aquí a
 *  propósito — lib/nomina.ts ya lo autodetecta aparte con su propia función
 *  `esDomingo`, y las dos se combinan con OR al liquidar; esta función es
 *  solo la lista oficial de festivos). */
export function esFestivoColombia(d: Date): boolean {
  return festivosColombia(d.getUTCFullYear()).some((f) => mismaFecha(f.fecha, d));
}
