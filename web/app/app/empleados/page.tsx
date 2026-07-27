"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, X, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  listEmployees,
  createEmployee,
  deleteEmployee,
  puedeAgregarEmpleado,
  type Company,
  type Employee,
} from "@/lib/supabase/queries";

export default function EmpleadosPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [empleados, setEmpleados] = useState<Employee[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [salario, setSalario] = useState("");

  async function cargar() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const empresa = await ensureCompany(supabase, user.id);
    const emps = await listEmployees(supabase, empresa.id);
    setUserId(user.id);
    setCompany(empresa);
    setEmpleados(emps);
    setCargando(false);
  }

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const empresa = await ensureCompany(supabase, user.id);
      const emps = await listEmployees(supabase, empresa.id);
      setUserId(user.id);
      setCompany(empresa);
      setEmpleados(emps);
      setCargando(false);
    })();
  }, []);

  const activos = empleados.filter((e) => e.activo).length;
  const enLimite = company ? !puedeAgregarEmpleado(company, activos) : false;

  async function guardar() {
    if (!company || !userId || nombre.trim().length < 2) return;
    const supabase = createClient();
    await createEmployee(supabase, userId, company.id, {
      nombre: nombre.trim(),
      cargo: cargo.trim() || "Sin cargo",
      salario_mensual: Number(salario) || 1_423_500,
    });
    setNombre("");
    setCargo("");
    setSalario("");
    setAbierto(false);
    await cargar();
  }

  async function eliminar(id: string) {
    const supabase = createClient();
    await deleteEmployee(supabase, id);
    await cargar();
  }

  if (cargando || !company) {
    return (
      <div className="space-y-2 px-5 pt-6">
        <div className="h-7 w-40 animate-pulse rounded bg-secondary" />
        <div className="mt-4 h-16 animate-pulse rounded-xl bg-secondary" />
        <div className="h-16 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-extrabold text-foreground">Empleados</h1>
        <button
          onClick={() => (enLimite ? router.push("/paywall") : setAbierto(true))}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          <UserPlus className="h-4 w-4" /> Agregar
        </button>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {activos} de {company.plan_empleados_limite} empleados de tu plan {company.plan === "pyme" ? "Pyme" : "Micro"}
      </p>

      {enLimite && (
        <button
          onClick={() => router.push("/paywall")}
          className="mt-3 flex w-full items-center gap-2.5 rounded-xl border border-primary/30 bg-accent p-3.5 text-left"
        >
          <Lock className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm text-accent-foreground">
            Llegaste al límite de tu plan. Mejora tu plan para agregar más empleados.
          </span>
        </button>
      )}

      {empleados.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no tienes empleados. Agrega el primero para empezar a marcar turnos.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {empleados.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{emp.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {emp.cargo} · ${emp.salario_mensual.toLocaleString("es-CO")}/mes
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
