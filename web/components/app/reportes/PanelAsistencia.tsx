"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { listTimeEntriesInRange, type Company, type Employee } from "@/lib/supabase/queries";
import {
  empleadosFiltrados,
  construirResumenPorEmpleado,
  construirFilasDiarias,
  type TipoReporteAsistencia,
  type PeriodoReporteAsistencia,
} from "@/lib/reporte-asistencia";
import { generarExcelAsistencia } from "@/lib/excel-asistencia";

const TIPOS: { valor: TipoReporteAsistencia; etiqueta: string; ayuda: string }[] = [
  { valor: "resumen", etiqueta: "Resumen por empleado", ayuda: "Una hoja de Excel por cada empleado, con el total liquidado." },
  { valor: "hojas", etiqueta: "Hojas de horas", ayuda: "Una sola hoja con todos los empleados, fila por día trabajado." },
  { valor: "entradas", etiqueta: "Entradas de tiempo", ayuda: "Igual que hojas de horas, con más detalle (festivo, fuera de rango)." },
];

const PERIODOS: { valor: PeriodoReporteAsistencia; etiqueta: string }[] = [
  { valor: "dia", etiqueta: "Diario" },
  { valor: "semana", etiqueta: "Semanal" },
  { valor: "mes", etiqueta: "Mensual" },
  { valor: "personalizado", etiqueta: "Personalizado" },
];

function lunesDeSemana(d: Date): Date {
  const copia = new Date(d);
  const diaSemana = (copia.getDay() + 6) % 7;
  copia.setDate(copia.getDate() - diaSemana);
  return copia;
}

function aISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function calcularRango(
  periodo: PeriodoReporteAsistencia,
  desdePersonalizado: string,
  hastaPersonalizado: string,
): { desde: string; hasta: string; texto: string } {
  const hoy = new Date();
  const fmt = (dt: Date) => dt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

  if (periodo === "dia") {
    return { desde: aISO(hoy), hasta: aISO(hoy), texto: fmt(hoy) };
  }
  if (periodo === "semana") {
    const lunes = lunesDeSemana(hoy);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    return { desde: aISO(lunes), hasta: aISO(domingo), texto: `${fmt(lunes)} – ${fmt(domingo)}` };
  }
  if (periodo === "mes") {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    return {
      desde: aISO(inicio),
      hasta: aISO(fin),
      texto: hoy.toLocaleDateString("es-CO", { month: "long", year: "numeric" }),
    };
  }
  const desde = desdePersonalizado || aISO(hoy);
  const hasta = hastaPersonalizado || aISO(hoy);
  return { desde, hasta, texto: `${desde} – ${hasta}` };
}

export function PanelAsistencia({ company, empleados }: { company: Company; empleados: Employee[] }) {
  const [tipos, setTipos] = useState<TipoReporteAsistencia[]>(["resumen"]);
  const [periodo, setPeriodo] = useState<PeriodoReporteAsistencia>("semana");
  const [desdePersonalizado, setDesdePersonalizado] = useState("");
  const [hastaPersonalizado, setHastaPersonalizado] = useState("");
  const [empleadoIds, setEmpleadoIds] = useState<string[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<"todos" | "fijo" | "flexible">("todos");
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function alternarEmpleado(id: string) {
    setEmpleadoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function alternarTipo(t: TipoReporteAsistencia) {
    setTipos((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  const rango = calcularRango(periodo, desdePersonalizado, hastaPersonalizado);

  async function descargar() {
    setError(null);
    if (tipos.length === 0) {
      setError("Elige al menos un tipo de reporte.");
      return;
    }
    if (periodo === "personalizado" && (!desdePersonalizado || !hastaPersonalizado)) {
      setError("Elige la fecha de inicio y fin.");
      return;
    }
    setGenerando(true);
    try {
      const supabase = createClient();
      const entradas = await listTimeEntriesInRange(supabase, company.id, rango.desde, rango.hasta);
      const empleadosOk = empleadosFiltrados(empleados, {
        desde: rango.desde,
        hasta: rango.hasta,
        empleadoIds,
        disponibilidad,
      });
      const idsOk = new Set(empleadosOk.map((e) => e.id));
      const entradasOk = entradas.filter((t) => idsOk.has(t.employee_id));

      const resumen = tipos.includes("resumen") ? construirResumenPorEmpleado(entradasOk, empleadosOk) : undefined;
      const filas =
        tipos.includes("hojas") || tipos.includes("entradas") ? construirFilasDiarias(entradasOk, empleadosOk) : undefined;

      await generarExcelAsistencia({ tipos, nombreNegocio: company.name, rangoTexto: rango.texto, resumen, filas });
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tipo de reporte</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Puedes marcar más de uno — salen todos en el mismo Excel.</p>
      <div className="mt-2 space-y-2">
        {TIPOS.map((t) => (
          <label
            key={t.valor}
            className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 ${
              tipos.includes(t.valor) ? "border-primary bg-accent" : "border-border"
            }`}
          >
            <input
              type="checkbox"
              checked={tipos.includes(t.valor)}
              onChange={() => alternarTipo(t.valor)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium text-foreground">{t.etiqueta}</span>
              <span className="block text-xs text-muted-foreground">{t.ayuda}</span>
            </span>
          </label>
        ))}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Período</p>
      <div className="mt-2 flex gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.valor}
            onClick={() => setPeriodo(p.valor)}
            className={`h-9 flex-1 rounded-lg text-xs font-semibold ${
              periodo === p.valor ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>
      {periodo === "personalizado" ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            type="date"
            value={desdePersonalizado}
            onChange={(e) => setDesdePersonalizado(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <input
            type="date"
            value={hastaPersonalizado}
            onChange={(e) => setHastaPersonalizado(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
      ) : (
        <p className="mt-1.5 text-xs text-muted-foreground">{rango.texto}</p>
      )}

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Filtrar por empleado</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Ninguno marcado = todos los empleados.</p>
      <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
        {empleados.map((emp) => (
          <label key={emp.id} className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={empleadoIds.includes(emp.id)}
              onChange={() => alternarEmpleado(emp.id)}
              className="h-4 w-4 accent-primary"
            />
            {emp.nombre}
          </label>
        ))}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Disponibilidad</p>
      <div className="mt-2 flex gap-2">
        {(["todos", "fijo", "flexible"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDisponibilidad(d)}
            className={`h-9 flex-1 rounded-lg text-xs font-semibold capitalize ${
              disponibilidad === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      <button
        onClick={descargar}
        disabled={generando}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {generando ? "Generando..." : "Descargar Excel"}
      </button>
    </div>
  );
}
