"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, ShieldCheck, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  listEmployees,
  listTimeEntriesForDate,
  type Company,
  type Employee,
  type TimeEntry,
} from "@/lib/supabase/queries";
import { desglosarMarcacion, type Marcacion } from "@/lib/nomina";
import { hoyISO } from "@/lib/app-storage";

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

function estadoDeHoy(empleadoId: string, entradas: TimeEntry[]) {
  const propias = entradas.filter((e) => e.employee_id === empleadoId);
  const abierta = propias.find((e) => !e.hora_salida);
  if (abierta) return { estado: "activo" as const, hora: abierta.hora_entrada.slice(0, 5) };
  const completa = propias[propias.length - 1];
  if (completa) return { estado: "completo" as const, hora: completa.hora_entrada.slice(0, 5) };
  return { estado: "pendiente" as const, hora: null };
}

export default function HoyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [empleados, setEmpleados] = useState<Employee[]>([]);
  const [entradas, setEntradas] = useState<TimeEntry[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const empresa = await ensureCompany(supabase, user.id);
      const [emps, hoy] = await Promise.all([
        listEmployees(supabase, empresa.id),
        listTimeEntriesForDate(supabase, empresa.id, hoyISO()),
      ]);
      setCompany(empresa);
      setEmpleados(emps);
      setEntradas(hoy);
      setCargando(false);
    })();
  }, []);

  if (cargando || !company) {
    return (
      <div className="space-y-3 px-5 pt-6">
        <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-7 w-48 animate-pulse rounded bg-secondary" />
        <div className="mt-4 h-32 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-16 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  const empleadosActivos = empleados.filter((e) => e.activo);
  const yaMarcaron = empleadosActivos.filter(
    (e) => estadoDeHoy(e.id, entradas).estado !== "pendiente",
  ).length;

  const nominaHoy = entradas.reduce((acc, m) => {
    const empleado = empleados.find((e) => e.id === m.employee_id);
    const desglose = desglosarMarcacion(aMarcacion(m));
    if (!empleado || !desglose) return acc;
    const valorHora = empleado.salario_mensual / 210;
    return acc + desglose.horasTotal * valorHora;
  }, 0);

  return (
    <div className="px-5 pt-6">
      <p className="text-sm text-muted-foreground">
        {new Date().toLocaleDateString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>
      <h1 className="font-display text-xl font-extrabold text-foreground">
        Hola, {company.name}
      </h1>

      <div className="mt-4 rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-[11px] uppercase tracking-wide opacity-80">
          Nómina de hoy en vivo
        </p>
        <p className="tabular mt-1 text-3xl font-extrabold">
          ${Math.round(nominaHoy).toLocaleString("es-CO")}
        </p>
        <p className="mt-1 text-xs opacity-85">
          {yaMarcaron} de {empleadosActivos.length} empleados ya marcaron
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Asistencia de hoy
        </h2>
        <Link href="/app/empleados" className="text-xs font-medium text-primary">
          Ver empleados
        </Link>
      </div>

      {empleadosActivos.length === 0 ? (
        <div className="mt-3 flex min-h-[45vh] flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center">
          <ShieldCheck className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Todavía no tienes empleados activos.
          </p>
          <Link
            href="/app/empleados"
            className="mt-2 inline-block text-sm font-semibold text-primary"
          >
            Agregar el primero →
          </Link>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {empleadosActivos.map((emp) => {
            const { estado, hora } = estadoDeHoy(emp.id, entradas);
            return (
              <Link
                key={emp.id}
                href={`/app/marcar?empleado=${emp.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {emp.nombre}
                  </span>
                  <span className="block text-xs text-muted-foreground">{emp.cargo}</span>
                </span>
                {estado === "pendiente" && (
                  <span className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
                    <Camera className="h-3.5 w-3.5" /> Marcar
                  </span>
                )}
                {estado === "activo" && (
                  <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">
                    Entró {hora}
                  </span>
                )}
                {estado === "completo" && (
                  <span className="flex items-center gap-0.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                    Completo <ChevronRight className="h-3 w-3" />
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
