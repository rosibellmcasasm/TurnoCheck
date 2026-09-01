"use client";

import { useEffect, useState } from "react";
import { Info, FileDown, Sheet, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  listEmployees,
  listTimeEntriesInRange,
  listTimeEntriesCompletas,
  listWorkSites,
  type Company,
  type Employee,
  type PeriodoPago,
  type TimeEntry,
  type WorkSite,
} from "@/lib/supabase/queries";
import { agruparPorSemana, liquidarSemana, type LiquidacionSemana, type Marcacion } from "@/lib/nomina";

async function descargarPdfSemana(
  nombreNegocio: string,
  rangoTexto: string,
  totalSemana: number,
  porEmpleado: { emp: Employee; liq: LiquidacionSemana }[],
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  const cop = (n: number) => `$${Math.round(n).toLocaleString("es-CO")}`;

  doc.setFontSize(16);
  doc.text(nombreNegocio, 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Reporte de nómina — semana ${rangoTexto}`, 14, 26);
  doc.text(`Total de la semana: ${cop(totalSemana)}`, 14, 33);

  autoTable(doc, {
    startY: 40,
    head: [["Empleado", "Ordinarias", "Nocturnas", "Extra diurna", "Extra nocturna", "Dom/Festivo", "Total"]],
    body: porEmpleado.map(({ emp, liq }) => [
      emp.nombre,
      `${liq.horasOrdinariasDiurnas.toFixed(1)}h`,
      liq.horasOrdinariasNocturnas > 0 ? `${liq.horasOrdinariasNocturnas.toFixed(1)}h` : "—",
      liq.horasExtraDiurnas > 0 ? `${liq.horasExtraDiurnas.toFixed(1)}h` : "—",
      liq.horasExtraNocturnas > 0 ? `${liq.horasExtraNocturnas.toFixed(1)}h` : "—",
      liq.horasDominicalFestivo > 0 ? `${liq.horasDominicalFestivo.toFixed(1)}h` : "—",
      cop(liq.total),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 84, 199] }, // --primary de la app
  });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    "Cálculo según la Ley 2101 de 2021 (jornada 42h, divisor 210) — valida con tu contador antes de pagar.",
    14,
    doc.internal.pageSize.getHeight() - 10,
  );

  doc.save(`nomina-${rangoTexto.replace(/\s/g, "-")}.pdf`);
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
  porEmpleado: { emp: Employee; liq: LiquidacionSemana }[],
) {
  const cop = (n: number) => Math.round(n);
  const filas = [
    [nombreNegocio],
    [`Reporte de nómina — semana ${rangoTexto}`],
    [`Total de la semana: $${cop(totalSemana).toLocaleString("es-CO")}`],
    [],
    ["Empleado", "Ordinarias (h)", "Nocturnas (h)", "Extra diurna (h)", "Extra nocturna (h)", "Dom/Festivo (h)", "Total"],
    ...porEmpleado.map(({ emp, liq }) => [
      emp.nombre,
      liq.horasOrdinariasDiurnas.toFixed(1),
      liq.horasOrdinariasNocturnas.toFixed(1),
      liq.horasExtraDiurnas.toFixed(1),
      liq.horasExtraNocturnas.toFixed(1),
      liq.horasDominicalFestivo.toFixed(1),
      cop(liq.total),
    ]),
  ];

  // BOM al inicio para que Excel detecte UTF-8 y muestre bien las tildes/ñ.
  const csv = "﻿" + filas.map((fila) => fila.map(celdaCsv).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nomina-${rangoTexto.replace(/\s/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface ResumenProyecto {
  sitio: WorkSite;
  horasInvertidas: number;
  empleadosInvolucrados: number;
}

/** Horas trabajadas de una marcación completa (cruza medianoche sin problema). */
function horasDeMarcacion(t: TimeEntry): number {
  if (!t.hora_salida) return 0;
  const [he, mine] = t.hora_entrada.slice(0, 5).split(":").map(Number);
  const [hs, mins] = t.hora_salida.slice(0, 5).split(":").map(Number);
  let minutos = hs * 60 + mins - (he * 60 + mine);
  if (minutos < 0) minutos += 24 * 60;
  return minutos / 60;
}

function resumenPorProyecto(sitios: WorkSite[], entradas: TimeEntry[]): ResumenProyecto[] {
  return sitios
    .map((sitio) => {
      const propias = entradas.filter((e) => e.work_site_id === sitio.id);
      const horasInvertidas = propias.reduce((s, e) => s + horasDeMarcacion(e), 0);
      const empleadosInvolucrados = new Set(propias.map((e) => e.employee_id)).size;
      return { sitio, horasInvertidas, empleadosInvolucrados };
    })
    .filter((r) => r.horasInvertidas > 0);
}

function descargarPdfProyecto(nombreNegocio: string, resumen: ResumenProyecto) {
  return (async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Informe de avance — ${resumen.sitio.nombre}`, 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(nombreNegocio, 14, 26);
    if (resumen.sitio.cliente_final) doc.text(`Cliente: ${resumen.sitio.cliente_final}`, 14, 33);

    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text(`Avance del proyecto: ${resumen.sitio.avance_porcentaje}%`, 14, 46);
    doc.text(`Horas invertidas: ${resumen.horasInvertidas.toFixed(1)}h`, 14, 54);
    doc.text(`Personas trabajando en el proyecto: ${resumen.empleadosInvolucrados}`, 14, 62);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generado el ${new Date().toLocaleDateString("es-CO")} — horas acumuladas desde el inicio del proyecto.`,
      14,
      doc.internal.pageSize.getHeight() - 10,
    );

    doc.save(`avance-${resumen.sitio.nombre.replace(/\s/g, "-")}.pdf`);
  })();
}

function descargarExcelProyecto(nombreNegocio: string, resumen: ResumenProyecto) {
  const filas = [
    [nombreNegocio],
    [`Informe de avance — ${resumen.sitio.nombre}`],
    resumen.sitio.cliente_final ? [`Cliente: ${resumen.sitio.cliente_final}`] : [],
    [],
    ["Avance del proyecto", "Horas invertidas", "Personas involucradas"],
    [`${resumen.sitio.avance_porcentaje}%`, resumen.horasInvertidas.toFixed(1), resumen.empleadosInvolucrados],
  ];
  const csv = "﻿" + filas.map((fila) => fila.map(celdaCsv).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `avance-${resumen.sitio.nombre.replace(/\s/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function aMarcacion(t: TimeEntry): Marcacion {
  return {
    id: t.id,
    empleadoId: t.employee_id,
    fecha: t.fecha,
    horaEntrada: t.hora_entrada.slice(0, 5),
    horaSalida: t.hora_salida ? t.hora_salida.slice(0, 5) : null,
    esFestivo: t.es_festivo,
  };
}

function formatearSemana(lunesISO: string) {
  const [y, m, d] = lunesISO.split("-").map(Number);
  const lunes = new Date(y, m - 1, d);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const fmt = (dt: Date) => dt.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  return `${fmt(lunes)} – ${fmt(domingo)}`;
}

/** A qué período de pago pertenece una semana (identificada por su lunes) — se decide por
 *  la fecha del lunes. Es una aproximación de primera versión: una semana que cruza el límite
 *  de dos períodos queda completa en el período de su lunes (igual que el cálculo de nómina,
 *  no es concepto legal — se documenta en nomina.ts). */
function claveDePeriodo(lunesISO: string, periodo: PeriodoPago): string {
  const [y, m, d] = lunesISO.split("-").map(Number);
  if (periodo === "semanal") return lunesISO;
  const yyyymm = `${y}-${String(m).padStart(2, "0")}`;
  if (periodo === "mensual") return yyyymm;
  return `${yyyymm}-${d <= 15 ? "Q1" : "Q2"}`;
}

function formatearPeriodo(clave: string, periodo: PeriodoPago) {
  if (periodo === "semanal") return formatearSemana(clave);
  const fmt = (dt: Date) => dt.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  if (periodo === "mensual") {
    const [y, m] = clave.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  }
  const [y, m, q] = clave.split("-");
  const anio = Number(y);
  const mes = Number(m);
  const inicio = new Date(anio, mes - 1, q === "Q1" ? 1 : 16);
  const fin = q === "Q1" ? new Date(anio, mes - 1, 15) : new Date(anio, mes, 0);
  return `${fmt(inicio)} – ${fmt(fin)}`;
}

function sumarLiquidaciones(liqs: LiquidacionSemana[]): LiquidacionSemana {
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

export default function ReportesPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [empleados, setEmpleados] = useState<Employee[]>([]);
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([]);
  const [sitios, setSitios] = useState<WorkSite[]>([]);
  const [entradasCompletas, setEntradasCompletas] = useState<TimeEntry[]>([]);
  const [cargando, setCargando] = useState(true);
  const [generandoPdf, setGenerandoPdf] = useState<string | null>(null);
  const [vista, setVista] = useState<"nomina" | "proyectos">("nomina");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const empresa = await ensureCompany(supabase, user.id);
      const hoy = new Date();
      const hace60 = new Date(hoy);
      hace60.setDate(hoy.getDate() - 60);
      const [emps, entradas, sitiosData, completas] = await Promise.all([
        listEmployees(supabase, empresa.id),
        listTimeEntriesInRange(
          supabase,
          empresa.id,
          hace60.toISOString().slice(0, 10),
          hoy.toISOString().slice(0, 10),
        ),
        listWorkSites(supabase, empresa.id),
        listTimeEntriesCompletas(supabase, empresa.id),
      ]);
      setCompany(empresa);
      setEmpleados(emps);
      setMarcaciones(entradas.map(aMarcacion));
      setSitios(sitiosData);
      setEntradasCompletas(completas);
      setCargando(false);
    })();
  }, []);

  if (cargando) {
    return (
      <div className="space-y-3 px-5 pt-6">
        <div className="h-7 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-16 animate-pulse rounded-xl bg-secondary" />
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  const periodoPago = company?.periodo_pago ?? "semanal";
  const semanas = agruparPorSemana(marcaciones);

  // 1) Liquida CADA semana por separado (las horas extra se calculan por semana, no se
  //    pueden repartir distinto solo porque el negocio pague quincenal o mensual).
  const semanasLiquidadas = Object.keys(semanas)
    .map((semanaKey) => {
      const marcacionesSemana = semanas[semanaKey].filter((m) => m.horaSalida);
      if (marcacionesSemana.length === 0) return null;
      const porEmpleado = empleados
        .map((emp) => {
          const propias = marcacionesSemana.filter((m) => m.empleadoId === emp.id);
          if (propias.length === 0) return null;
          return { emp, liq: liquidarSemana(propias, emp.salario_mensual) };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);
      if (porEmpleado.length === 0) return null;
      return { semanaKey, porEmpleado };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // 2) Agrupa esas semanas ya liquidadas según el período de pago del negocio, sumando los
  //    totales de cada empleado entre las semanas que caen en el mismo período.
  const periodos = new Map<string, { emp: Employee; liq: LiquidacionSemana }[]>();
  for (const { semanaKey, porEmpleado } of semanasLiquidadas) {
    const clave = claveDePeriodo(semanaKey, periodoPago);
    const acumulado = periodos.get(clave) ?? [];
    for (const { emp, liq } of porEmpleado) {
      const existente = acumulado.find((x) => x.emp.id === emp.id);
      if (existente) {
        existente.liq = sumarLiquidaciones([existente.liq, liq]);
      } else {
        acumulado.push({ emp, liq });
      }
    }
    periodos.set(clave, acumulado);
  }
  const periodosOrdenados = Array.from(periodos.keys()).sort().reverse();
  const proyectos = resumenPorProyecto(sitios, entradasCompletas);

  return (
    <div className="px-5 pt-6">
      <h1 className="font-display text-xl font-extrabold text-foreground">Reportes</h1>

      <div className="mt-4 flex gap-1 rounded-xl bg-secondary p-1">
        <button
          onClick={() => setVista("nomina")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            vista === "nomina" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Nómina
        </button>
        <button
          onClick={() => setVista("proyectos")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            vista === "proyectos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Proyectos
        </button>
      </div>

      {vista === "nomina" && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent p-3.5 text-accent-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-snug">
            Cálculo basado en la Ley 2101 de 2021 (jornada de 42h, divisor 210). Te
            recomendamos validar tus primeros reportes con tu contador antes de pagar.
          </p>
        </div>
      )}

      {vista === "proyectos" ? (
        proyectos.length === 0 ? (
          <div className="mt-6 flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
            <Briefcase className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Todavía no hay horas registradas en ningún sitio de trabajo. Configura tus
              proyectos en Ajustes y las marcaciones se irán sumando aquí.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {proyectos.map((resumen) => (
              <div key={resumen.sitio.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{resumen.sitio.nombre}</p>
                    {resumen.sitio.cliente_final && (
                      <p className="truncate text-xs text-muted-foreground">
                        Cliente: {resumen.sitio.cliente_final}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      onClick={() => descargarExcelProyecto(company?.name ?? "", resumen)}
                      className="flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      <Sheet className="h-3.5 w-3.5" />
                      Excel
                    </button>
                    <button
                      onClick={async () => {
                        setGenerandoPdf(resumen.sitio.id);
                        try {
                          await descargarPdfProyecto(company?.name ?? "", resumen);
                        } finally {
                          setGenerandoPdf(null);
                        }
                      }}
                      disabled={generandoPdf === resumen.sitio.id}
                      className="flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-50"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      {generandoPdf === resumen.sitio.id ? "Generando..." : "PDF"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${resumen.sitio.avance_porcentaje}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{resumen.sitio.avance_porcentaje}% completado</span>
                  <span>
                    {resumen.horasInvertidas.toFixed(1)}h invertidas · {resumen.empleadosInvolucrados}{" "}
                    {resumen.empleadosInvolucrados === 1 ? "persona" : "personas"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : periodosOrdenados.length === 0 ? (
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
                      onClick={() => {
                        if (!company) return;
                        descargarExcelSemana(company.name, rangoTexto, totalPeriodo, porEmpleado);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      <Sheet className="h-3.5 w-3.5" />
                      Excel
                    </button>
                    <button
                      onClick={async () => {
                        if (!company) return;
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
                  ${Math.round(totalPeriodo).toLocaleString("es-CO")}
                </p>

                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  {porEmpleado.map(({ emp, liq }) => (
                    <div key={emp.id} className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-foreground">{emp.nombre}</span>
                        <span className="tabular font-semibold text-foreground">
                          ${Math.round(liq.total).toLocaleString("es-CO")}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span>Ordinarias: {liq.horasOrdinariasDiurnas.toFixed(1)}h</span>
                        {liq.horasOrdinariasNocturnas > 0 && (
                          <span>Nocturnas: {liq.horasOrdinariasNocturnas.toFixed(1)}h</span>
                        )}
                        {liq.horasExtraDiurnas > 0 && (
                          <span>Extra diurna: {liq.horasExtraDiurnas.toFixed(1)}h</span>
                        )}
                        {liq.horasExtraNocturnas > 0 && (
                          <span>Extra nocturna: {liq.horasExtraNocturnas.toFixed(1)}h</span>
                        )}
                        {liq.horasDominicalFestivo > 0 && (
                          <span>Dominical/festivo: {liq.horasDominicalFestivo.toFixed(1)}h</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
