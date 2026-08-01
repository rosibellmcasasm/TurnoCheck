"use client";

import { useEffect, useState } from "react";
import { Info, FileDown, Sheet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  listEmployees,
  listTimeEntriesInRange,
  type Company,
  type Employee,
  type TimeEntry,
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

export default function ReportesPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [empleados, setEmpleados] = useState<Employee[]>([]);
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [generandoPdf, setGenerandoPdf] = useState<string | null>(null);

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
      const [emps, entradas] = await Promise.all([
        listEmployees(supabase, empresa.id),
        listTimeEntriesInRange(
          supabase,
          empresa.id,
          hace60.toISOString().slice(0, 10),
          hoy.toISOString().slice(0, 10),
        ),
      ]);
      setCompany(empresa);
      setEmpleados(emps);
      setMarcaciones(entradas.map(aMarcacion));
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

  const semanas = agruparPorSemana(marcaciones);
  const semanasOrdenadas = Object.keys(semanas).sort().reverse();

  return (
    <div className="px-5 pt-6">
      <h1 className="font-display text-xl font-extrabold text-foreground">Reportes</h1>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent p-3.5 text-accent-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs leading-snug">
          Cálculo basado en la Ley 2101 de 2021 (jornada de 42h, divisor 210). Te
          recomendamos validar tus primeros reportes con tu contador antes de pagar.
        </p>
      </div>

      {semanasOrdenadas.length === 0 ? (
        <div className="mt-6 flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no hay marcaciones completas para liquidar. Marca la salida de un
            turno en &quot;Hoy&quot; para ver tu primer reporte.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {semanasOrdenadas.map((semanaKey) => {
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
            const totalSemana = porEmpleado.reduce((s, x) => s + x.liq.total, 0);

            return (
              <div key={semanaKey} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">
                    Semana {formatearSemana(semanaKey)}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (!company) return;
                        descargarExcelSemana(company.name, formatearSemana(semanaKey), totalSemana, porEmpleado);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      <Sheet className="h-3.5 w-3.5" />
                      Excel
                    </button>
                    <button
                      onClick={async () => {
                        if (!company) return;
                        setGenerandoPdf(semanaKey);
                        try {
                          await descargarPdfSemana(
                            company.name,
                            formatearSemana(semanaKey),
                            totalSemana,
                            porEmpleado,
                          );
                        } finally {
                          setGenerandoPdf(null);
                        }
                      }}
                      disabled={generandoPdf === semanaKey}
                      className="flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-50"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      {generandoPdf === semanaKey ? "Generando..." : "PDF"}
                    </button>
                  </div>
                </div>
                <p className="tabular mt-1 text-2xl font-extrabold text-foreground">
                  ${Math.round(totalSemana).toLocaleString("es-CO")}
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
