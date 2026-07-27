"use client";

import { useEffect, useState } from "react";
import { UserPlus, Trash2, X } from "lucide-react";
import { readAppData, writeAppData, type AppData, type Empleado } from "@/lib/app-storage";

export default function EmpleadosPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [salario, setSalario] = useState("");

  useEffect(() => {
    setData(readAppData());
  }, []);

  function guardar() {
    if (!data || nombre.trim().length < 2) return;
    const nuevo: Empleado = {
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      cargo: cargo.trim() || "Sin cargo",
      salarioMensual: Number(salario) || 1_423_500,
      activo: true,
    };
    const next = { ...data, empleados: [...data.empleados, nuevo] };
    writeAppData(next);
    setData(next);
    setNombre("");
    setCargo("");
    setSalario("");
    setAbierto(false);
  }

  function eliminar(id: string) {
    if (!data) return;
    const next = { ...data, empleados: data.empleados.filter((e) => e.id !== id) };
    writeAppData(next);
    setData(next);
  }

  if (!data) return null;

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-extrabold text-foreground">Empleados</h1>
        <button
          onClick={() => setAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          <UserPlus className="h-4 w-4" /> Agregar
        </button>
      </div>

      {data.empleados.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no tienes empleados. Agrega el primero para empezar a marcar turnos.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {data.empleados.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{emp.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {emp.cargo} · ${emp.salarioMensual.toLocaleString("es-CO")}/mes
                </p>
              </div>
              <button
                onClick={() => eliminar(emp.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive"
                aria-label={`Eliminar a ${emp.nombre}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {abierto && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-card p-5 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Nuevo empleado</h2>
              <button onClick={() => setAbierto(false)} aria-label="Cerrar">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <label className="mt-4 block text-sm font-medium text-foreground">
              Nombre
              <input
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Laura Pérez"
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-[15px] text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="mt-3 block text-sm font-medium text-foreground">
              Cargo
              <input
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ej: Caja"
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-[15px] text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="mt-3 block text-sm font-medium text-foreground">
              Salario mensual (COP)
              <input
                inputMode="numeric"
                value={salario}
                onChange={(e) => setSalario(e.target.value.replace(/\D/g, ""))}
                placeholder="1.423.500"
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-[15px] text-foreground outline-none focus:border-primary"
              />
            </label>

            <button
              onClick={guardar}
              disabled={nombre.trim().length < 2}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-40"
            >
              Guardar empleado
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
