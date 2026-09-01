"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { Camera, ShieldCheck, ChevronRight, MapPinOff, X, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AnimatedNumber } from "@/components/app/shell/AnimatedNumber";
import {
  ensureCompany,
  listEmployees,
  listTimeEntriesForDate,
  listTimeEntriesInRange,
  listTimeEntriesCompletas,
  listWorkSites,
  hasAnyMarcacion,
  getFotoMarcacionUrl,
  cerrarTurnosVencidos,
  type Company,
  type Employee,
  type TimeEntry,
  type WorkSite,
} from "@/lib/supabase/queries";
import { desglosarMarcacion, type Marcacion } from "@/lib/nomina";
import { hoyISO } from "@/lib/app-storage";
import { calcularPuntualidad } from "@/lib/puntualidad";
import { OnboardingChecklist, type PasoGuia } from "@/components/app/dashboard/OnboardingChecklist";
import { HorasSemanaChart, type BarraHoras } from "@/components/app/dashboard/HorasSemanaChart";
import { HorasPorProyectoChart, type ProyectoHoras } from "@/components/app/dashboard/HorasPorProyectoChart";
import { ProximosFestivos } from "@/components/app/dashboard/ProximosFestivos";
import type { PuntoEnVivo } from "@/components/app/mapa/LiveMap";

const LiveMap = dynamic(() => import("@/components/app/mapa/LiveMap").then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-secondary" />,
});

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

/** "2h 15m" desde que marcó entrada hasta ahora — para el panel en vivo. */
function tiempoTranscurrido(fecha: string, horaEntrada: string, ahora: number) {
  const [y, m, d] = fecha.split("-").map(Number);
  const [h, min] = horaEntrada.split(":").map(Number);
  const inicio = new Date(y, m - 1, d, h, min).getTime();
  const minutos = Math.max(0, Math.round((ahora - inicio) / 60000));
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return horas > 0 ? `${horas}h ${resto}m` : `${resto}m`;
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

function lunesDeSemana(d: Date): Date {
  const copia = new Date(d);
  const diaSemana = (copia.getDay() + 6) % 7; // lunes = 0
  copia.setDate(copia.getDate() - diaSemana);
  return copia;
}

const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

export default function HoyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [empleados, setEmpleados] = useState<Employee[]>([]);
  const [entradas, setEntradas] = useState<TimeEntry[]>([]);
  const [sitios, setSitios] = useState<WorkSite[]>([]);
  const [entradasSemana, setEntradasSemana] = useState<TimeEntry[]>([]);
  const [entradasCompletas, setEntradasCompletas] = useState<TimeEntry[]>([]);
  const [huboMarcacionAlgunaVez, setHuboMarcacionAlgunaVez] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [verMarcacion, setVerMarcacion] = useState<{ emp: Employee; entry: TimeEntry } | null>(null);
  const [fotoEntradaUrl, setFotoEntradaUrl] = useState<string | null>(null);
  const [fotoSalidaUrl, setFotoSalidaUrl] = useState<string | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());
  const [periodoVista, setPeriodoVista] = useState<"dia" | "semana" | "mes">("semana");

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  async function abrirMarcacion(emp: Employee, entry: TimeEntry) {
    setVerMarcacion({ emp, entry });
    setFotoEntradaUrl(null);
    setFotoSalidaUrl(null);
    if (!entry.foto_url && !entry.foto_salida_url) return;
    setCargandoFoto(true);
    try {
      const supabase = createClient();
      const [entradaUrl, salidaUrl] = await Promise.all([
        entry.foto_url ? getFotoMarcacionUrl(supabase, entry.foto_url).catch(() => null) : null,
        entry.foto_salida_url ? getFotoMarcacionUrl(supabase, entry.foto_salida_url).catch(() => null) : null,
      ]);
      setFotoEntradaUrl(entradaUrl);
      setFotoSalidaUrl(salidaUrl);
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
      await cerrarTurnosVencidos(supabase, empresa);
      const lunes = lunesDeSemana(new Date());
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      const [emps, hoy, sitiosData, marcoAlgunaVez, semana, completas] = await Promise.all([
        listEmployees(supabase, empresa.id),
        listTimeEntriesForDate(supabase, empresa.id, hoyISO()),
        listWorkSites(supabase, empresa.id),
        hasAnyMarcacion(supabase, empresa.id),
        listTimeEntriesInRange(
          supabase,
          empresa.id,
          lunes.toISOString().slice(0, 10),
          domingo.toISOString().slice(0, 10),
        ),
        listTimeEntriesCompletas(supabase, empresa.id),
      ]);
      setCompany(empresa);
      setEmpleados(emps);
      setEntradas(hoy);
      setSitios(sitiosData);
      setHuboMarcacionAlgunaVez(marcoAlgunaVez);
      setEntradasSemana(semana);
      setEntradasCompletas(completas);
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
  const completaronHoy = empleadosActivos.filter(
    (e) => estadoDeHoy(e.id, entradas).estado === "completo",
  ).length;

  const pasosGuia: PasoGuia[] = [
    { id: "empleado", titulo: "Agrega tu primer empleado", href: "/app/empleados", hecho: empleados.length > 0 },
    { id: "sitio", titulo: "Configura un sitio de trabajo", href: "/app/ajustes", hecho: sitios.length > 0 },
    {
      id: "horario",
      titulo: "Define un horario esperado",
      href: "/app/empleados",
      hecho: empleados.some((e) => e.hora_entrada_esperada),
    },
    { id: "marcacion", titulo: "Haz tu primera marcación", href: "/app/empleados", hecho: huboMarcacionAlgunaVez },
  ];

  const trabajandoAhora = empleadosActivos
    .map((emp) => {
      const propias = entradas.filter((e) => e.employee_id === emp.id);
      const abierta = propias.find((e) => !e.hora_salida);
      return abierta ? { emp, entry: abierta } : null;
    })
    .filter((x): x is { emp: Employee; entry: TimeEntry } => x !== null);

  const nominaHoy = entradas.reduce((acc, m) => {
    const empleado = empleados.find((e) => e.id === m.employee_id);
    const desglose = desglosarMarcacion(aMarcacion(m));
    if (!empleado || !desglose) return acc;
    const valorHora = empleado.salario_mensual / 210;
    return acc + desglose.horasTotal * valorHora;
  }, 0);

  const horasChart: BarraHoras[] = (() => {
    if (periodoVista === "dia") {
      return empleadosActivos
        .map((emp) => ({
          etiqueta: emp.nombre.split(" ")[0],
          horas: entradas
            .filter((e) => e.employee_id === emp.id)
            .reduce((s, e) => s + horasDeMarcacion(e), 0),
        }))
        .filter((d) => d.horas > 0);
    }
    if (periodoVista === "mes") {
      const hoyDate = new Date();
      const finMes = new Date(hoyDate.getFullYear(), hoyDate.getMonth() + 1, 0).getDate();
      const semanas = Math.ceil(finMes / 7);
      const porSemana = new Array(semanas).fill(0);
      entradasCompletas.forEach((e) => {
        const [y, m, d] = e.fecha.split("-").map(Number);
        if (y !== hoyDate.getFullYear() || m - 1 !== hoyDate.getMonth()) return;
        const indice = Math.ceil(d / 7) - 1;
        porSemana[indice] += horasDeMarcacion(e);
      });
      return porSemana.map((horas, i) => ({ etiqueta: `Sem ${i + 1}`, horas }));
    }
    // semana (por defecto)
    const lunes = lunesDeSemana(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(lunes);
      dia.setDate(lunes.getDate() + i);
      const fechaISO = dia.toISOString().slice(0, 10);
      const horas = entradasSemana
        .filter((e) => e.fecha === fechaISO)
        .reduce((s, e) => s + horasDeMarcacion(e), 0);
      return { etiqueta: DIAS_SEMANA[i], horas };
    });
  })();

  const puntosEnVivo: PuntoEnVivo[] = trabajandoAhora
    .filter(({ entry }) => entry.lat != null && entry.lng != null)
    .map(({ emp, entry }) => ({
      id: entry.id,
      nombre: emp.nombre,
      lat: entry.lat as number,
      lng: entry.lng as number,
      tiempoTexto: `Trabajando hace ${tiempoTranscurrido(entry.fecha, entry.hora_entrada.slice(0, 5), ahora)}`,
      fueraDeRango: entry.fuera_de_rango,
    }));

  const horasPorProyecto: ProyectoHoras[] = sitios
    .map((sitio) => ({
      nombre: sitio.nombre,
      horas: entradasCompletas
        .filter((e) => e.work_site_id === sitio.id)
        .reduce((s, e) => s + horasDeMarcacion(e), 0),
    }))
    .filter((p) => p.horas > 0)
    .sort((a, b) => b.horas - a.horas);

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

      <div className="mt-4 md:grid md:grid-cols-2 md:items-start md:gap-4">
        <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-md shadow-primary/20">
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

        {empleadosActivos.length > 0 && (
          <div className="mt-4 rounded-2xl border border-success/30 bg-success-soft p-4 md:mt-0">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <h2 className="text-xs font-bold uppercase tracking-wide text-success">
                Asistencia en vivo
              </h2>
            </div>

            <div className="mt-2.5 grid grid-cols-3 divide-x divide-success/20 text-center">
              <div>
                <p className="tabular text-xl font-extrabold text-foreground">{trabajandoAhora.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Trabajando</p>
              </div>
              <div>
                <p className="tabular text-xl font-extrabold text-foreground">{completaronHoy}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Completaron</p>
              </div>
              <div>
                <p className="tabular text-xl font-extrabold text-foreground">{empleadosActivos.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
              </div>
            </div>

            {trabajandoAhora.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-success/20 pt-2.5">
                {trabajandoAhora.map(({ emp, entry }) => (
                  <div key={emp.id} className="flex items-center justify-between text-sm">
                    <span className="min-w-0 truncate font-medium text-foreground">{emp.nombre}</span>
                    <span className="tabular shrink-0 text-xs text-muted-foreground">
                      {tiempoTranscurrido(entry.fecha, entry.hora_entrada.slice(0, 5), ahora)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <OnboardingChecklist pasos={pasosGuia} />

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Horas trabajadas
            </h2>
            <div className="flex gap-0.5 rounded-lg bg-secondary p-0.5">
              {(["dia", "semana", "mes"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodoVista(p)}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold capitalize transition-colors ${
                    periodoVista === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2">
            {horasChart.every((d) => d.horas === 0) ? (
              <div className="flex h-36 items-center justify-center text-xs text-muted-foreground">
                Sin horas registradas en este período.
              </div>
            ) : (
              <HorasSemanaChart datos={horasChart} />
            )}
          </div>
        </div>

        <ProximosFestivos />

        {puntosEnVivo.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm md:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Ubicaciones en vivo
              </h2>
              <Link href="/app/mapa" className="text-xs font-medium text-primary">
                Ver mapa completo
              </Link>
            </div>
            <div className="mt-3 h-48 overflow-hidden rounded-xl">
              <LiveMap sitios={sitios} puntos={puntosEnVivo} />
            </div>
          </div>
        )}

        {horasPorProyecto.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm md:col-span-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Horas por proyecto
            </h2>
            <div className="mt-3">
              <HorasPorProyectoChart datos={horasPorProyecto} />
            </div>
          </div>
        )}
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

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: "Entrada", url: fotoEntradaUrl, hayFoto: !!verMarcacion.entry.foto_url },
                  { label: "Salida", url: fotoSalidaUrl, hayFoto: !!verMarcacion.entry.foto_salida_url },
                ].map(({ label, url, hayFoto }) => (
                  <div key={label}>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-secondary">
                      {cargandoFoto && hayFoto && (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          Cargando...
                        </div>
                      )}
                      {!cargandoFoto && url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={`Foto de ${label.toLowerCase()} de ${verMarcacion.emp.nombre}`}
                          className="h-full w-full object-cover"
                        />
                      )}
                      {!cargandoFoto && !url && (
                        <div className="flex h-full flex-col items-center justify-center gap-1 p-3 text-center">
                          <Camera className="h-5 w-5 text-muted-foreground" />
                          <p className="text-[11px] text-muted-foreground">
                            {hayFoto ? "No se pudo cargar" : "Sin foto"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
                      {verMarcacion.entry.cierre_automatico && " (automática)"}
                    </span>
                  </div>
                )}
              </div>

              {verMarcacion.entry.cierre_automatico && (
                <p className="mt-2 text-xs text-warning">
                  El empleado no marcó su salida — la app cerró el turno sola a la hora
                  configurada en Ajustes.
                </p>
              )}

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
