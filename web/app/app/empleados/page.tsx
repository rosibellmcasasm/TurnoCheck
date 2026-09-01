"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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
  type Disponibilidad,
} from "@/lib/supabase/queries";
import { DIAS_SEMANA, type DiaSemana, type HorarioDia, type HorarioSemanal } from "@/lib/horario-semanal";

const HORARIO_VACIO: HorarioDia = { activo: false, entrada: null, salida: null };

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
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad>("fijo");
  const [horarioSemanal, setHorarioSemanal] = useState<HorarioSemanal>({});
  const [descansoInicio, setDescansoInicio] = useState("");
  const [descansoFin, setDescansoFin] = useState("");

  function limpiarFormulario() {
    setNombre("");
    setCargo("");
    setSalario("");
    setEmail("");
    setTelefono("");
    setDisponibilidad("fijo");
    setHorarioSemanal({});
    setDescansoInicio("");
    setDescansoFin("");
  }

  function actualizarDia(dia: DiaSemana, cambios: Partial<HorarioDia>) {
    setHorarioSemanal((prev) => ({
      ...prev,
      [dia]: { ...HORARIO_VACIO, ...prev[dia], ...cambios },
    }));
  }

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
    cargar();
  }, []);

  const activos = empleados.filter((e) => e.activo).length;
  const enLimite = company ? !puedeAgregarEmpleado(company, activos) : false;

  async function guardar() {
    if (!company || !userId || nombre.trim().length < 2) return;
    const supabase = createClient();

    const algunDiaActivo = Object.values(horarioSemanal).some((d) => d?.activo);

    await createEmployee(supabase, userId, company.id, {
      nombre: nombre.trim(),
      cargo: cargo.trim() || "Sin cargo",
      salario_mensual: Number(salario) || 1_423_500,
      email: email.trim() || null,
      telefono: telefono.trim() || null,
      disponibilidad,
      horario_semanal: algunDiaActivo ? horarioSemanal : null,
      descanso_inicio: descansoInicio || null,
      descanso_fin: descansoFin || null,
    });
    limpiarFormulario();
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
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
          onClick={() => (enLimite ? router.push("/paywall") : setAbierto(true))}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
        >
          <UserPlus className="h-4 w-4" /> Agregar
        </motion.button>
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
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{emp.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {emp.cargo} · ${emp.salario_mensual.toLocaleString("es-CO")}/mes ·{" "}
                  {emp.disponibilidad === "flexible" ? "Flexible" : "Fijo"}
                  {emp.telefono && ` · ${emp.telefono}`}
                </p>
                {(emp.descanso_inicio || emp.horario_semanal) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {emp.horario_semanal && "Horario por día definido"}
                    {emp.descanso_inicio &&
                      emp.descanso_fin &&
                      `${emp.horario_semanal ? " · " : ""}Descanso ${emp.descanso_inicio.slice(0, 5)}-${emp.descanso_fin.slice(0, 5)}`}
                  </p>
                )}
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

      <AnimatePresence>
        {abierto && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="max-h-[88vh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-foreground">Nuevo empleado</h2>
                <button onClick={() => setAbierto(false)} aria-label="Cerrar">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <label className="mt-4 block text-sm font-medium text-foreground">
                Nombre y apellido
                <input
                  autoFocus
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Laura Pérez"
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-[15px] text-foreground outline-none focus:border-primary"
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-foreground">
                Rol
                <input
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ej: Cajera, Maestro de obra"
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-[15px] text-foreground outline-none focus:border-primary"
                />
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block text-sm font-medium text-foreground">
                  Correo (opcional)
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ej.com"
                    className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground outline-none focus:border-primary"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Teléfono (opcional)
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="300 123 4567"
                    className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground outline-none focus:border-primary"
                  />
                </label>
              </div>

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

              <div className="mt-4 border-t border-border pt-3.5">
                <p className="text-sm font-medium text-foreground">Disponibilidad</p>
                <div className="mt-1.5 flex gap-2">
                  {(["fijo", "flexible"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDisponibilidad(d)}
                      className={`h-9 flex-1 rounded-lg text-xs font-semibold capitalize ${
                        disponibilidad === d
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-3.5">
                <p className="text-sm font-medium text-foreground">Horario por día (opcional)</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Marca los días que trabaja y su hora de entrada/salida ese día. Si lo dejas
                  vacío, no calificamos si llegó a tiempo.
                </p>
                <div className="mt-2.5 space-y-2">
                  {DIAS_SEMANA.map(({ valor, etiqueta }) => {
                    const dia = horarioSemanal[valor] ?? HORARIO_VACIO;
                    return (
                      <div key={valor} className="rounded-lg border border-border p-2.5">
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={dia.activo}
                            onChange={(e) => actualizarDia(valor, { activo: e.target.checked })}
                            className="h-4 w-4 accent-primary"
                          />
                          {etiqueta}
                        </label>
                        {dia.activo && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <input
                              type="time"
                              value={dia.entrada ?? ""}
                              onChange={(e) => actualizarDia(valor, { entrada: e.target.value || null })}
                              className="h-10 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-primary"
                            />
                            <input
                              type="time"
                              value={dia.salida ?? ""}
                              onChange={(e) => actualizarDia(valor, { salida: e.target.value || null })}
                              className="h-10 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-primary"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-3.5">
                <p className="text-sm font-medium text-foreground">Descanso (hora de comer, opcional)</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ese tiempo se resta de las horas pagadas en Reportes.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={descansoInicio}
                    onChange={(e) => setDescansoInicio(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <input
                    type="time"
                    value={descansoFin}
                    onChange={(e) => setDescansoFin(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12 }}
                onClick={guardar}
                disabled={nombre.trim().length < 2}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-40"
              >
                Guardar empleado
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
