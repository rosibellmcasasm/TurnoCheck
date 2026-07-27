"use client";

import { useEffect, useState } from "react";
import { Info, FileDown } from "lucide-react";
import { readAppData, type AppData } from "@/lib/app-storage";
import { agruparPorSemana, liquidarSemana } from "@/lib/nomina";

function formatearSemana(lunesISO: string) {
  const [y, m, d] = lunesISO.split("-").map(Number);
  const lunes = new Date(y, m - 1, d);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const fmt = (dt: Date) => dt.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  return `${fmt(lunes)} – ${fmt(domingo)}`;
}

export default function ReportesPage() {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    setData(readAppData());
  }, []);

  if (!data) return null;

  const semanas = agruparPorSemana(data.marcaciones);
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
        <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
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

            const porEmpleado = data.empleados
              .map((emp) => {
                const propias = marcacionesSemana.filter((m) => m.empleadoId === emp.id);
                if (propias.length === 0) return null;
                return { emp, liq: liquidarSemana(propias, emp.salarioMensual) };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null);

            if (porEmpleado.length === 0) return null;
            const totalSemana = porEmpleado.reduce((s, x) => s + x.liq.total, 0);

            return (
              <div key={semanaKey} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">
                    Semana {formatearSemana(semanaKey)}
                  </p>
                  <button className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <FileDown className="h-3.5 w-3.5" /> PDF
                  </button>
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
