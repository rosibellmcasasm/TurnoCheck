"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  listEmployees,
  listTimeEntriesInRange,
  type Company,
  type Employee,
  type TimeEntry,
} from "@/lib/supabase/queries";
import { type Marcacion } from "@/lib/nomina";
import { PanelAsistencia } from "@/components/app/reportes/PanelAsistencia";
import { PanelNominaColombia } from "@/components/app/reportes/PanelNominaColombia";
import { PanelNominaUS } from "@/components/app/reportes/PanelNominaUS";

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

export default function ReportesPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [empleados, setEmpleados] = useState<Employee[]>([]);
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<"nomina" | "asistencia">("nomina");

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
      const empleadosPorId = new Map(emps.map((e) => [e.id, e]));
      setCompany(empresa);
      setEmpleados(emps);
      setMarcaciones(entradas.map((t) => aMarcacion(t, empleadosPorId.get(t.employee_id))));
      setCargando(false);
    })();
  }, []);

  if (cargando || !company) {
    return (
      <div className="space-y-3 px-5 pt-6">
        <div className="h-7 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-16 animate-pulse rounded-xl bg-secondary" />
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="font-display text-xl font-extrabold text-foreground">Reportes</h1>

      <div className="mt-3 flex gap-2 rounded-lg bg-secondary p-1">
        {(["nomina", "asistencia"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPestana(p)}
            className={`h-9 flex-1 rounded-md text-sm font-semibold capitalize ${
              pestana === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {p === "nomina" ? "Nómina" : "Asistencia"}
          </button>
        ))}
      </div>

      {pestana === "asistencia" ? (
        <PanelAsistencia company={company} empleados={empleados} />
      ) : company.pais === "us_colorado" ? (
        <PanelNominaUS company={company} empleados={empleados} marcaciones={marcaciones} />
      ) : (
        <PanelNominaColombia company={company} empleados={empleados} marcaciones={marcaciones} />
      )}
    </div>
  );
}
