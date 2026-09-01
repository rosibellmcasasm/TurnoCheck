"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldCheck, Plus, Trash2, X, Crosshair } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  updateCompanyName,
  updateCompanyPeriodoPago,
  listWorkSites,
  createWorkSite,
  updateWorkSite,
  toggleWorkSiteActivo,
  deleteWorkSite,
  listEmployees,
  type Company,
  type WorkSite,
  type Employee,
  type PeriodoPago,
} from "@/lib/supabase/queries";

const PERIODOS: { valor: PeriodoPago; etiqueta: string }[] = [
  { valor: "semanal", etiqueta: "Semanal" },
  { valor: "quincenal", etiqueta: "Quincenal" },
  { valor: "mensual", etiqueta: "Mensual" },
];

const COLORES_ETIQUETA = [
  { valor: "#2554C7", nombre: "Azul" },
  { valor: "#1E824C", nombre: "Verde" },
  { valor: "#B4790F", nombre: "Ámbar" },
  { valor: "#B42318", nombre: "Rojo" },
  { valor: "#7C3AED", nombre: "Morado" },
  { valor: "#0F766E", nombre: "Verde azulado" },
  { valor: "#DB2777", nombre: "Rosa" },
  { valor: "#57534E", nombre: "Gris" },
];

export default function AjustesPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sitios, setSitios] = useState<WorkSite[]>([]);
  const [empleados, setEmpleados] = useState<Employee[]>([]);

  const [modalSitioAbierto, setModalSitioAbierto] = useState(false);
  const [sitioEditando, setSitioEditando] = useState<WorkSite | null>(null);
  const [nombreSitio, setNombreSitio] = useState("");
  const [codigoProyecto, setCodigoProyecto] = useState("");
  const [clienteSitio, setClienteSitio] = useState("");
  const [descripcionSitio, setDescripcionSitio] = useState("");
  const [colorSitio, setColorSitio] = useState(COLORES_ETIQUETA[0].valor);
  const [asignados, setAsignados] = useState<string[]>([]);
  const [coordsSitio, setCoordsSitio] = useState<{ lat: number; lng: number } | null>(null);
  const [capturando, setCapturando] = useState(false);
  const [errorSitio, setErrorSitio] = useState<string | null>(null);

  async function cargarSitios(supabase: ReturnType<typeof createClient>, companyId: string) {
    setSitios(await listWorkSites(supabase, companyId));
  }

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const empresa = await ensureCompany(supabase, user.id);
      setUserId(user.id);
      setCompany(empresa);
      setNombre(empresa.name);
      await Promise.all([cargarSitios(supabase, empresa.id), listEmployees(supabase, empresa.id).then(setEmpleados)]);
      setCargando(false);
    })();
  }, []);

  async function guardar() {
    if (!company) return;
    const supabase = createClient();
    await updateCompanyName(supabase, company.id, nombre);
  }

  async function cambiarPeriodoPago(periodo: PeriodoPago) {
    if (!company) return;
    setCompany({ ...company, periodo_pago: periodo });
    const supabase = createClient();
    await updateCompanyPeriodoPago(supabase, company.id, periodo);
  }

  function limpiarFormularioSitio() {
    setNombreSitio("");
    setCodigoProyecto("");
    setClienteSitio("");
    setDescripcionSitio("");
    setColorSitio(COLORES_ETIQUETA[0].valor);
    setAsignados([]);
    setCoordsSitio(null);
    setErrorSitio(null);
  }

  function abrirCreacionSitio() {
    setSitioEditando(null);
    limpiarFormularioSitio();
    setModalSitioAbierto(true);
  }

  function abrirEdicionSitio(s: WorkSite) {
    setSitioEditando(s);
    setNombreSitio(s.nombre);
    setCodigoProyecto(s.codigo_proyecto ?? "");
    setClienteSitio(s.cliente ?? "");
    setDescripcionSitio(s.descripcion ?? "");
    setColorSitio(s.color ?? COLORES_ETIQUETA[0].valor);
    setAsignados(s.empleados_asignados ?? []);
    setCoordsSitio({ lat: s.lat, lng: s.lng });
    setErrorSitio(null);
    setModalSitioAbierto(true);
  }

  function capturarUbicacion() {
    setErrorSitio(null);
    setCapturando(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setCoordsSitio({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCapturando(false);
      },
      () => {
        setCapturando(false);
        setErrorSitio("No pudimos obtener tu ubicación. Revisa los permisos del navegador.");
      },
      { timeout: 8000 },
    );
  }

  function alternarAsignado(empleadoId: string) {
    setAsignados((prev) =>
      prev.includes(empleadoId) ? prev.filter((id) => id !== empleadoId) : [...prev, empleadoId],
    );
  }

  async function guardarSitio() {
    if (!company || !userId || nombreSitio.trim().length < 2 || !coordsSitio) {
      if (!coordsSitio) setErrorSitio("Falta capturar la ubicación (GPS).");
      return;
    }
    const supabase = createClient();
    const datos = {
      nombre: nombreSitio.trim(),
      lat: coordsSitio.lat,
      lng: coordsSitio.lng,
      codigo_proyecto: codigoProyecto.trim() || null,
      cliente: clienteSitio.trim() || null,
      descripcion: descripcionSitio.trim() || null,
      color: colorSitio,
      empleados_asignados: asignados,
    };

    if (sitioEditando) {
      await updateWorkSite(supabase, sitioEditando.id, datos);
    } else {
      await createWorkSite(supabase, userId, company.id, datos);
    }
    limpiarFormularioSitio();
    setSitioEditando(null);
    setModalSitioAbierto(false);
    await cargarSitios(supabase, company.id);
  }

  async function cambiarActivo(site: WorkSite) {
    if (!company) return;
    const supabase = createClient();
    await toggleWorkSiteActivo(supabase, site.id, !site.activo);
    await cargarSitios(supabase, company.id);
  }

  async function eliminarSitio(siteId: string) {
    if (!company) return;
    const supabase = createClient();
    await deleteWorkSite(supabase, siteId);
    await cargarSitios(supabase, company.id);
  }

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (cargando || !company) {
    return (
      <div className="space-y-3 px-5 pt-6">
        <div className="h-7 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="font-display text-xl font-extrabold text-foreground">Ajustes</h1>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <label className="block text-sm font-medium text-foreground">
          Nombre del negocio
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={guardar}
            className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-[15px] text-foreground outline-none focus:border-primary"
          />
        </label>
        <p className="mt-3 text-xs text-muted-foreground">
          Plan actual: <span className="font-medium text-foreground">{company.plan === "pyme" ? "Pyme" : "Micro"}</span>{" "}
          · hasta {company.plan_empleados_limite} empleados
        </p>

        <div className="mt-4 border-t border-border pt-3.5">
          <p className="text-sm font-medium text-foreground">¿Cada cuánto pagas?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Reportes va a agrupar los totales según esto. Las horas extra se siguen calculando
            semana a semana, como lo pide la ley.
          </p>
          <div className="mt-2.5 flex gap-2">
            {PERIODOS.map((p) => (
              <button
                key={p.valor}
                onClick={() => cambiarPeriodoPago(p.valor)}
                className={`h-9 flex-1 rounded-lg text-xs font-semibold ${
                  company.periodo_pago === p.valor
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-foreground">Sitios de trabajo</h2>
          <button
            onClick={abrirCreacionSitio}
            className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Útil si tu negocio trabaja por obras o proyectos que cambian de sitio. Cuando alguien
          marca, la app avisa si está lejos de TODOS los sitios activos.
        </p>

        {sitios.length > 0 ? (
          <div className="mt-3 space-y-2">
            {sitios.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color ?? "#94A3B8" }}
                  aria-hidden
                />
                <button onClick={() => abrirEdicionSitio(s)} className="min-w-0 flex-1 text-left">
                  <span className={`block truncate text-sm ${s.activo ? "text-foreground" : "text-muted-foreground line-through"}`}>
                    {s.nombre}
                    {s.codigo_proyecto && ` · ${s.codigo_proyecto}`}
                  </span>
                  {s.cliente && <span className="block truncate text-xs text-muted-foreground">{s.cliente}</span>}
                </button>
                <button
                  onClick={() => cambiarActivo(s)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    s.activo ? "bg-success-soft text-success" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {s.activo ? "Activo" : "Inactivo"}
                </button>
                <button
                  onClick={() => eliminarSitio(s.id)}
                  aria-label={`Eliminar ${s.nombre}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">Todavía no tienes sitios de trabajo.</p>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-snug text-muted-foreground">
          Tus datos y los de tus empleados se guardan de forma segura en la nube,
          protegidos con seguridad a nivel de fila (solo tú puedes verlos).
        </p>
      </div>

      <button
        onClick={salir}
        className="mt-6 flex items-center gap-2 text-sm font-medium text-destructive"
      >
        <LogOut className="h-4 w-4" /> Salir de TurnoCheck
      </button>

      <AnimatePresence>
        {modalSitioAbierto && (
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
                <h2 className="font-display text-base font-bold text-foreground">
                  {sitioEditando ? "Editar sitio" : "Nuevo sitio de trabajo"}
                </h2>
                <button onClick={() => setModalSitioAbierto(false)} aria-label="Cerrar">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <label className="mt-4 block text-sm font-medium text-foreground">
                Nombre
                <input
                  autoFocus
                  value={nombreSitio}
                  onChange={(e) => setNombreSitio(e.target.value)}
                  placeholder="Ej: Obra Calle 80"
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3.5 text-[15px] text-foreground outline-none focus:border-primary"
                />
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block text-sm font-medium text-foreground">
                  Código del proyecto
                  <input
                    value={codigoProyecto}
                    onChange={(e) => setCodigoProyecto(e.target.value)}
                    placeholder="Ej: OB-2026-14"
                    className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground outline-none focus:border-primary"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Cliente
                  <input
                    value={clienteSitio}
                    onChange={(e) => setClienteSitio(e.target.value)}
                    placeholder="Ej: Constructora Andina"
                    className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground outline-none focus:border-primary"
                  />
                </label>
              </div>

              <label className="mt-3 block text-sm font-medium text-foreground">
                Descripción
                <textarea
                  value={descripcionSitio}
                  onChange={(e) => setDescripcionSitio(e.target.value)}
                  placeholder="Ej: Ampliación bodega, 3 pisos"
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </label>

              <div className="mt-4 border-t border-border pt-3.5">
                <p className="text-sm font-medium text-foreground">Localización (GPS)</p>
                {coordsSitio ? (
                  <p className="mt-1 text-xs text-success">
                    Ubicación capturada ({coordsSitio.lat.toFixed(5)}, {coordsSitio.lng.toFixed(5)})
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Sin ubicación todavía.</p>
                )}
                <button
                  onClick={capturarUbicacion}
                  disabled={capturando}
                  className="mt-2 flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-primary disabled:opacity-50"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  {capturando ? "Ubicando..." : coordsSitio ? "Volver a capturar parado aquí" : "Capturar parado aquí"}
                </button>
                {errorSitio && <p className="mt-2 text-xs text-destructive">{errorSitio}</p>}
              </div>

              <div className="mt-4 border-t border-border pt-3.5">
                <p className="text-sm font-medium text-foreground">Etiqueta (color)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COLORES_ETIQUETA.map((c) => (
                    <button
                      key={c.valor}
                      onClick={() => setColorSitio(c.valor)}
                      aria-label={c.nombre}
                      className={`h-8 w-8 rounded-full ${colorSitio === c.valor ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                      style={{ backgroundColor: c.valor }}
                    />
                  ))}
                </div>
              </div>

              {empleados.length > 0 && (
                <div className="mt-4 border-t border-border pt-3.5">
                  <p className="text-sm font-medium text-foreground">Asignados</p>
                  <div className="mt-2 space-y-1.5">
                    {empleados.map((emp) => (
                      <label key={emp.id} className="flex items-center gap-2 text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={asignados.includes(emp.id)}
                          onChange={() => alternarAsignado(emp.id)}
                          className="h-4 w-4 accent-primary"
                        />
                        {emp.nombre}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12 }}
                onClick={guardarSitio}
                disabled={nombreSitio.trim().length < 2}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-40"
              >
                {sitioEditando ? "Guardar cambios" : "Guardar sitio"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
