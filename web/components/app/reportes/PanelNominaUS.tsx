"use client";

import { useState } from "react";
import { Info, FileDown, Sheet } from "lucide-react";
import { agruparPorSemana, type Marcacion } from "@/lib/nomina";
import { liquidarSemanaUS, sumarLiquidacionesUS, type LiquidacionSemanaUS } from "@/lib/nomina-us-co";
import type { Company, Employee, PeriodoPago } from "@/lib/supabase/queries";

async function descargarPdfSemana(
  nombreNegocio: string,
  rangoTexto: string,
  totalSemana: number,
  porEmpleado: { emp: Employee; liq: LiquidacionSemanaUS }[],
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  const usd = (n: number) => `US$${Math.round(n).toLocaleString("en-US")}`;

  doc.setFontSize(16);
  doc.text(nombreNegocio, 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Payroll report — week ${rangoTexto}`, 14, 26);
  doc.text(`Total for this period: ${usd(totalSemana)}`, 14, 33);

  autoTable(doc, {
    startY: 40,
    head: [["Employee", "Regular hours", "Overtime (1.5x)", "Total"]],
    body: porEmpleado.map(({ emp, liq }) => [
      emp.nombre,
      `${liq.horasOrdinarias.toFixed(1)}h`,
      liq.horasExtra > 0 ? `${liq.horasExtra.toFixed(1)}h` : "—",
      usd(liq.total),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 84, 199] },
  });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    "Colorado overtime (greater of >40h/week or >12h/day) — verify with your accountant or labor attorney before paying.",
    14,
    doc.internal.pageSize.getHeight() - 10,
  );

  doc.save(`payroll-${rangoTexto.replace(/\s/g, "-")}.pdf`);
}

function celdaCsv(valor: string | number) {
  const texto = String(valor);
  if (/[";\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

function descargarExcelSemana(
  nombreNegocio: string,
  rangoTexto: string,
  totalSemana: number,
  porEmpleado: { emp: Employee; liq: LiquidacionSemanaUS }[],
) {
  const usd = (n: number) => Math.round(n);
  const filas = [
    [nombreNegocio],
    [`Payroll report — ${rangoTexto}`],
    [`Total: US$${usd(totalSemana).toLocaleString("en-US")}`],
    [],
    ["Employee", "Regular (h)", "Overtime (h)", "Total"],
    ...porEmpleado.map(({ emp, liq }) => [
      emp.nombre,
      liq.horasOrdinarias.toFixed(1),
      liq.horasExtra.toFixed(1),
      usd(liq.total),
    ]),
  ];

  const csv = "﻿" + filas.map((fila) => fila.map(celdaCsv).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payroll-${rangoTexto.replace(/\s/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatearSemana(lunesISO: string) {
  const [y, m, d] = lunesISO.split("-").map(Number);
  const lunes = new Date(y, m - 1, d);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const fmt = (dt: Date) => dt.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  return `${fmt(lunes)} – ${fmt(domingo)}`;
}

function claveDePeriodo(lunesISO: string, periodo: PeriodoPago): string {
  const [y, m, d] = lunesISO.split("-").map(Number);
  if (periodo === "semanal") return lunesISO;
  const yyyymm = `${y}-${String(m).padStart(2, "0")}`;
  if (periodo === "mensual") return yyyymm;
  return `${yyyymm}-${d <= 15 ? "Q1" : "Q2"}`;
}

function formatearPeriodo(clave: string, periodo: PeriodoPago) {
  if (periodo === "semanal") return formatearSemana(clave);
  const fmt = (dt: Date) => dt.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  if (periodo === "mensual") {
    const [y, m] = clave.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  const [y, m, q] = clave.split("-");
  const anio = Number(y);
  const mes = Number(m);
  const inicio = new Date(anio, mes - 1, q === "Q1" ? 1 : 16);
  const fin = q === "Q1" ? new Date(anio, mes - 1, 15) : new Date(anio, mes, 0);
  return `${fmt(inicio)} – ${fmt(fin)}`;
}

/** Panel de nómina para negocios en Colorado, EE.UU. — motor separado del de
 *  Colombia (lib/nomina-us-co.ts): horas extra = el mayor entre >40h/semana
 *  o >12h/día, sin recargo nocturno/dominical (no es obligatorio por ley
 *  en EE.UU., a diferencia de Colombia). */
export function PanelNominaUS({
  company,
  empleados,
  marcaciones,
}: {
  company: Company;
  empleados: Employee[];
  marcaciones: Marcacion[];
}) {
  const [generandoPdf, setGenerandoPdf] = useState<string | null>(null);

  const periodoPago = company.periodo_pago;
  const semanas = agruparPorSemana(marcaciones);

  const semanasLiquidadas = Object.keys(semanas)
    .map((semanaKey) => {
      const marcacionesSemana = semanas[semanaKey].filter((m) => m.horaSalida);
      if (marcacionesSemana.length === 0) return null;
      const porEmpleado = empleados
        .map((emp) => {
          if (emp.tarifa_hora == null) return null;
          const propias = marcacionesSemana.filter((m) => m.empleadoId === emp.id);
          if (propias.length === 0) return null;
          return { emp, liq: liquidarSemanaUS(propias, emp.tarifa_hora) };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      if (porEmpleado.length === 0) return null;
      return { semanaKey, porEmpleado };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const periodos = new Map<string, { emp: Employee; liq: LiquidacionSemanaUS }[]>();
  for (const { semanaKey, porEmpleado } of semanasLiquidadas) {
    const clave = claveDePeriodo(semanaKey, periodoPago);
    const acumulado = periodos.get(clave) ?? [];
    for (const { emp, liq } of porEmpleado) {
      const existente = acumulado.find((x) => x.emp.id === emp.id);
      if (existente) {
        existente.liq = sumarLiquidacionesUS([existente.liq, liq]);
      } else {
        acumulado.push({ emp, liq });
      }
    }
    periodos.set(clave, acumulado);
  }
  const periodosOrdenados = Array.from(periodos.keys()).sort().reverse();

  const sinTarifa = empleados.filter((e) => e.activo && e.tarifa_hora == null);

  return (
    <>
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent p-3.5 text-accent-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs leading-snug">
          Horas extra de Colorado: el mayor entre más de 40h/semana o más de 12h en un solo
          día. Sin recargo por festivo/domingo (no es obligatorio en EE.UU.). Valida con tu
          contador o abogado laboral antes de pagar.
        </p>
      </div>

      {sinTarifa.length > 0 && (
        <p className="mt-2 text-xs text-warning">
          {sinTarifa.map((e) => e.nombre).join(", ")} no {sinTarifa.length === 1 ? "tiene" : "tienen"} tarifa
          por hora configurada — no {sinTarifa.length === 1 ? "aparece" : "aparecen"} en este reporte.
        </p>
      )}

      {periodosOrdenados.length === 0 ? (
        <div className="mt-6 flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no hay marcaciones completas para liquidar. Marca la salida de un
            turno en &quot;Hoy&quot; para ver tu primer reporte.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {periodosOrdenados.map((periodoClave) => {
            const porEmpleado = periodos.get(periodoClave)!;
            const rangoTexto = formatearPeriodo(periodoClave, periodoPago);
            const totalPeriodo = porEmpleado.reduce((s, x) => s + x.liq.total, 0);
            const etiqueta =
              periodoPago === "semanal" ? "Semana" : periodoPago === "quincenal" ? "Quincena" : "Mes";

            return (
              <div key={periodoClave} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">
                    {etiqueta} {rangoTexto}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => descargarExcelSemana(company.name, rangoTexto, totalPeriodo, porEmpleado)}
                      className="flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      <Sheet className="h-3.5 w-3.5" />
                      Excel
                    </button>
                    <button
                      onClick={async () => {
                        setGenerandoPdf(periodoClave);
                        try {
                          await descargarPdfSemana(company.name, rangoTexto, totalPeriodo, porEmpleado);
                        } finally {
                          setGenerandoPdf(null);
                        }
                      }}
                      disabled={generandoPdf === periodoClave}
                      className="flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-50"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      {generandoPdf === periodoClave ? "Generando..." : "PDF"}
                    </button>
                  </div>
                </div>
                <p className="tabular mt-1 text-2xl font-extrabold text-foreground">
                  US${Math.round(totalPeriodo).toLocaleString("en-US")}
                </p>

                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  {porEmpleado.map(({ emp, liq }) => (
                    <div key={emp.id} className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-foreground">{emp.nombre}</span>
                        <span className="tabular font-semibold text-foreground">
                          US${Math.round(liq.total).toLocaleString("en-US")}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span>Ordinarias: {liq.horasOrdinarias.toFixed(1)}h</span>
                        {liq.horasExtra > 0 && <span>Extra (1.5x): {liq.horasExtra.toFixed(1)}h</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
