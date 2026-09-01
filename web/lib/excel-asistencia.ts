import type { TipoReporteAsistencia, ResumenEmpleado, FilaDiaAsistencia } from "@/lib/reporte-asistencia";

const cop = (n: number) => Math.round(n);

function nombreHoja(nombre: string, usados: Set<string>): string {
  // Excel: máx 31 caracteres, prohibido \ / ? * [ ] : — y nombres repetidos.
  let base = nombre.replace(/[\\/?*[\]:]/g, "").slice(0, 28) || "Empleado";
  let candidato = base;
  let i = 2;
  while (usados.has(candidato.toLowerCase())) {
    candidato = `${base} (${i})`.slice(0, 31);
    i++;
  }
  usados.add(candidato.toLowerCase());
  return candidato;
}

/** Cada tipo de reporte se agrega como sus propias hojas dentro del MISMO archivo — se pueden
 *  elegir varios tipos a la vez (ej. las 3) y salen todas juntas en un solo Excel. */
export async function generarExcelAsistencia(opts: {
  tipos: TipoReporteAsistencia[];
  nombreNegocio: string;
  rangoTexto: string;
  resumen?: ResumenEmpleado[];
  filas?: FilaDiaAsistencia[];
}) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "TurnoCheck";
  const usadas = new Set<string>();

  if (opts.tipos.includes("resumen")) {
    for (const r of opts.resumen ?? []) {
      const ws = wb.addWorksheet(nombreHoja(r.emp.nombre, usadas));
      ws.addRow([opts.nombreNegocio]);
      ws.addRow([`Resumen de asistencia — ${r.emp.nombre}`]);
      ws.addRow([`Período: ${opts.rangoTexto}`]);
      ws.addRow([]);
      ws.addRow([
        "Semana (lunes)",
        "Ordinarias (h)",
        "Nocturnas (h)",
        "Extra diurna (h)",
        "Extra nocturna (h)",
        "Dom/Festivo (h)",
        "Total $",
      ]).font = { bold: true };
      for (const s of r.semanas) {
        ws.addRow([
          s.rango,
          s.liq.horasOrdinariasDiurnas.toFixed(1),
          s.liq.horasOrdinariasNocturnas.toFixed(1),
          s.liq.horasExtraDiurnas.toFixed(1),
          s.liq.horasExtraNocturnas.toFixed(1),
          s.liq.horasDominicalFestivo.toFixed(1),
          cop(s.liq.total),
        ]);
      }
      const filaTotal = ws.addRow([
        "TOTAL",
        r.total.horasOrdinariasDiurnas.toFixed(1),
        r.total.horasOrdinariasNocturnas.toFixed(1),
        r.total.horasExtraDiurnas.toFixed(1),
        r.total.horasExtraNocturnas.toFixed(1),
        r.total.horasDominicalFestivo.toFixed(1),
        cop(r.total.total),
      ]);
      filaTotal.font = { bold: true };
      ws.columns.forEach((c) => (c.width = 16));
    }
    if ((opts.resumen ?? []).length === 0) {
      wb.addWorksheet(nombreHoja("Resumen", usadas)).addRow(["Sin marcaciones completas en este período."]);
    }
  }

  for (const tipo of ["hojas", "entradas"] as const) {
    if (!opts.tipos.includes(tipo)) continue;
    const esHojas = tipo === "hojas";
    const ws = wb.addWorksheet(nombreHoja(esHojas ? "Hojas de horas" : "Entradas de tiempo", usadas));
    ws.addRow([opts.nombreNegocio]);
    ws.addRow([esHojas ? "Hojas de horas" : "Entradas de tiempo", `Período: ${opts.rangoTexto}`]);
    ws.addRow([]);

    if (esHojas) {
      ws.addRow(["Empleado", "Fecha", "Entrada", "Salida", "Horas", "$ (base, sin recargos)"]).font = {
        bold: true,
      };
      for (const f of opts.filas ?? []) {
        ws.addRow([f.emp.nombre, f.fecha, f.horaEntrada, f.horaSalida, f.horas.toFixed(1), cop(f.monto)]);
      }
    } else {
      ws.addRow([
        "Empleado",
        "Fecha",
        "Entrada",
        "Salida",
        "Horas",
        "Festivo",
        "Fuera de rango",
        "$ (base, sin recargos)",
      ]).font = { bold: true };
      for (const f of opts.filas ?? []) {
        ws.addRow([
          f.emp.nombre,
          f.fecha,
          f.horaEntrada,
          f.horaSalida,
          f.horas.toFixed(1),
          f.esFestivo ? "Sí" : "No",
          f.fueraDeRango ? "Sí" : "No",
          cop(f.monto),
        ]);
      }
    }
    ws.addRow([]);
    ws.addRow([
      "El $ de esta hoja es una base (horas × valor hora) sin recargos de nocturno/extra/" +
        "dominical — el total exacto con recargos está en el reporte 'Resumen por empleado'.",
    ]);
    ws.columns.forEach((c) => (c.width = 14));

    if ((opts.filas ?? []).length === 0) {
      ws.addRow(["Sin marcaciones completas en este período."]);
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asistencia-${opts.rangoTexto.replace(/\s/g, "-")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
