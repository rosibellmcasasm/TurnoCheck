/** Calculador de festivos colombianos — funciona para CUALQUIER año (no una
 *  tabla que hay que actualizar cada diciembre). Sigue la Ley 51 de 1983
 *  ("Ley Emiliani"): la mayoría de los festivos que caen entre semana se
 *  trasladan al lunes siguiente; los de Semana Santa y los de fecha fija
 *  patria no se trasladan. */

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

/** Todos los festivos de Colombia para un año dado. */
export function festivosColombia(year: number): Date[] {
  const pascua = domingoDePascua(year);

  const fijos = [
    fecha(year, 1, 1), // Año Nuevo
    fecha(year, 5, 1), // Día del Trabajo
    fecha(year, 7, 20), // Independencia
    fecha(year, 8, 7), // Batalla de Boyacá
    fecha(year, 12, 8), // Inmaculada Concepción
    fecha(year, 12, 25), // Navidad
    sumarDias(pascua, -3), // Jueves Santo
    sumarDias(pascua, -2), // Viernes Santo
  ];

  const trasladables = [
    fecha(year, 1, 6), // Reyes Magos
    fecha(year, 3, 19), // San José
    sumarDias(pascua, 39), // Ascensión del Señor
    sumarDias(pascua, 60), // Corpus Christi
    sumarDias(pascua, 68), // Sagrado Corazón
    fecha(year, 6, 29), // San Pedro y San Pablo
    fecha(year, 8, 15), // Asunción de la Virgen
    fecha(year, 10, 12), // Día de la Raza
    fecha(year, 11, 1), // Todos los Santos
    fecha(year, 11, 11), // Independencia de Cartagena
  ].map(alSiguienteLunes);

  return [...fijos, ...trasladables];
}

/** ¿Es festivo en Colombia esta fecha? (el domingo NO se incluye aquí a
 *  propósito — lib/nomina.ts ya lo autodetecta aparte con su propia función
 *  `esDomingo`, y las dos se combinan con OR al liquidar; esta función es
 *  solo la lista oficial de festivos). */
export function esFestivoColombia(d: Date): boolean {
  return festivosColombia(d.getUTCFullYear()).some((f) => mismaFecha(f, d));
}
