"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Camera, ShieldCheck, ChevronRight, MapPinOff, X, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AnimatedNumber } from "@/components/app/shell/AnimatedNumber";
import {
  ensureCompany,
  listEmployees,
  listTimeEntriesForDate,
  getFotoMarcacionUrl,
  type Company,
  type Employee,
  type TimeEntry,
} from "@/lib/supabase/queries";
import { desglosarMarcacion, type Marcacion } from "@/lib/nomina";
import { hoyISO } from "@/lib/app-storage";
import { calcularPuntualidad } from "@/lib/puntualidad";

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
  const fueraDeRango = propias.some((e) => e.fuera_de_rango);
  const abierta = propias.find((e) => !e.hora_salida);
  if (abierta) {
    return {
      estado: "activo" as const,
      hora: abierta.hora_entrada.slice(0, 5),
      horaSalida: null,
      fueraDeRango,
      entry: null,
    };
  }
  const completa = propias[propias.length - 1];
  if (completa) {
    return {
      estado: "completo" as const,
      hora: completa.hora_entrada.slice(0, 5),
      horaSalida: completa.hora_salida ? completa.hora_salida.slice(0, 5) : null,
      fueraDeRango,
      entry: completa,
    };
  }
  return { estado: "pendiente" as const, hora: null, horaSalida: null, fueraDeRango: false, entry: null };
}

export default function HoyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [empleados, setEmpleados] = useState<Employee[]>([]);
  const [entradas, setEntradas] = useState<TimeEntry[]>([]);
  const [cargando, setCargando] = useState(true);
  const [verMarcacion, setVerMarcacion] = useState<{ emp: Employee; entry: TimeEntry } | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);

  async function abrirMarcacion(emp: Employee, entry: TimeEntry) {
    setVerMarcacion({ emp, entry });
    setFotoUrl(null);
    if (!entry.foto_url) return;
    setCargandoFoto(true);
    try {
      const supabase = createClient();
      const url = await getFotoMarcacionUrl(supabase, entry.foto_url);
      setFotoUrl(url);
    } catch {
      setFotoUrl(null);
    } finally {
      setCargandoFoto(false);
    }
  }

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

      <div className="mt-4 rounded-2xl bg-primary p-5 text-primary-foreground shadow-md shadow-primary/20">
        <p className="text-[11px] uppercase tracking-wide opacity-80">
          Nómina de hoy en vivo
        </p>
        <p className="tabular mt-1 text-3xl font-extrabold">
          $<AnimatedNumber value={nominaHoy} />
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
        <motion.div
          className="mt-3 space-y-2"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.035 } } }}
        >
          {empleadosActivos.map((emp) => {
            const { estado, hora, horaSalida, fueraDeRango, entry } = estadoDeHoy(emp.id, entradas);
            const puntualidad = hora ? calcularPuntualidad(emp.hora_entrada_esperada, hora) : null;
            const puntualidadSalida = horaSalida
              ? calcularPuntualidad(emp.hora_salida_esperada, horaSalida)
              : null;
            return (
              <motion.div
                key={emp.id}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
                }}
                whileTap={{ scale: 0.98 }}
              >
              {(() => {
                const contenido = (
                  <>
                    <span className="sello-verificado flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {emp.nombre}
                      </span>
                      <span className="block text-xs text-muted-foreground">{emp.cargo}</span>
                    </span>
                    {fueraDeRango && (
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning"
                        title="Marcó lejos de toda obra registrada"
                      >
                        <MapPinOff className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {estado === "pendiente" && (
                      <span className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
                        <Camera className="h-3.5 w-3.5" /> Marcar
                      </span>
                    )}
                    {estado === "activo" && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          puntualidad?.estado === "tarde"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning-soft text-warning"
                        }`}
                      >
                        Entró {hora}
                        {puntualidad?.estado === "tarde" && ` · Tarde ${puntualidad.minutos}m`}
                        {puntualidad?.estado === "a_tiempo" && " · A tiempo"}
                        {puntualidad?.estado === "temprano" && " · Temprano"}
                      </span>
                    )}
                    {estado === "completo" && (
                      <span className="flex flex-col items-end gap-1">
                        <span className="flex items-center gap-0.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                          Ver foto <ChevronRight className="h-3 w-3" />
                        </span>
                        {puntualidadSalida && puntualidadSalida.estado !== "a_tiempo" && (
                          <span className="text-[11px] text-muted-foreground">
                            {puntualidadSalida.estado === "temprano"
                              ? `Salió ${puntualidadSalida.minutos}m antes`
                              : `Salió ${puntualidadSalida.minutos}m después`}
                          </span>
                        )}
                      </span>
                    )}
                  </>
                );
                const claseFila = "flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left shadow-sm";
                if (estado === "completo" && entry) {
                  return (
                    <button onClick={() => abrirMarcacion(emp, entry)} className={claseFila}>
                      {contenido}
                    </button>
                  );
                }
                return (
                  <Link href={`/app/marcar?empleado=${emp.id}`} className={claseFila}>
                    {contenido}
                  </Link>
                );
              })()}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {verMarcacion && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setVerMarcacion(null)}
          >
            <motion.div
              className="w-full max-w-sm rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-2xl"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-foreground">
                  {verMarcacion.emp.nombre}
                </h2>
                <button onClick={() => setVerMarcacion(null)} aria-label="Cerrar">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="mt-4 aspect-square w-full overflow-hidden rounded-xl bg-secondary">
                {cargandoFoto && (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Cargando foto...
                  </div>
                )}
                {!cargandoFoto && fotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoUrl} alt={`Foto de marcación de ${verMarcacion.emp.nombre}`} className="h-full w-full object-cover" />
                )}
                {!cargandoFoto && !fotoUrl && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Esta marcación no tiene foto guardada.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrada</span>
                  <span className="tabular font-medium text-foreground">
                    {verMarcacion.entry.hora_entrada.slice(0, 5)}
                  </span>
                </div>
                {verMarcacion.entry.hora_salida && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salida</span>
                    <span className="tabular font-medium text-foreground">
                      {verMarcacion.entry.hora_salida.slice(0, 5)}
                    </span>
                  </div>
                )}
              </div>

              {verMarcacion.entry.lat && verMarcacion.entry.lng && (
                <a
                  href={`https://www.google.com/maps?q=${verMarcacion.entry.lat},${verMarcacion.entry.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-sm font-semibold text-primary"
                >
                  <MapPin className="h-4 w-4" /> Ver ubicación en el mapa
                </a>
              )}
              {verMarcacion.entry.fuera_de_rango && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
                  <MapPinOff className="h-3.5 w-3.5 shrink-0" /> Esta marcación quedó lejos de toda obra registrada.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
