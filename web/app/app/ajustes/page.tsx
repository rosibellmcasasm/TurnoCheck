"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldCheck, MapPin, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  updateCompanyName,
  updateCompanyPeriodoPago,
  listWorkSites,
  createWorkSite,
  toggleWorkSiteActivo,
  deleteWorkSite,
  type Company,
  type WorkSite,
  type PeriodoPago,
} from "@/lib/supabase/queries";

const PERIODOS: { valor: PeriodoPago; etiqueta: string }[] = [
  { valor: "semanal", etiqueta: "Semanal" },
  { valor: "quincenal", etiqueta: "Quincenal" },
  { valor: "mensual", etiqueta: "Mensual" },
];

export default function AjustesPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sitios, setSitios] = useState<WorkSite[]>([]);
  const [nombreSitio, setNombreSitio] = useState("");
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
      await cargarSitios(supabase, empresa.id);
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

  function agregarSitio() {
    if (!company || !userId || nombreSitio.trim().length < 2) return;
    setErrorSitio(null);
    setCapturando(true);
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const supabase = createClient();
        await createWorkSite(supabase, userId, company.id, {
          nombre: nombreSitio.trim(),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setNombreSitio("");
        setCapturando(false);
        await cargarSitios(supabase, company.id);
      },
      () => {
        setCapturando(false);
        setErrorSitio("No pudimos obtener tu ubicación. Revisa los permisos del navegador.");
      },
      { timeout: 8000 },
    );
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
        <h2 className="font-display text-sm font-bold text-foreground">Sitios de trabajo</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Regístralos parado en el lugar (útil si tu negocio trabaja por obras o proyectos que
          cambian de sitio). Cuando alguien marca, la app avisa si está lejos de TODOS los
          sitios activos.
        </p>

        {sitios.length > 0 && (
          <div className="mt-3 space-y-2">
            {sitios.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5">
                <MapPin className={`h-4 w-4 shrink-0 ${s.activo ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`min-w-0 flex-1 truncate text-sm ${s.activo ? "text-foreground" : "text-muted-foreground line-through"}`}>
                  {s.nombre}
                </span>
                <button
                  onClick={() => cambiarActivo(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    s.activo ? "bg-success-soft text-success" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {s.activo ? "Activo" : "Inactivo"}
                </button>
                <button
                  onClick={() => eliminarSitio(s.id)}
                  aria-label={`Eliminar ${s.nombre}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <input
            value={nombreSitio}
            onChange={(e) => setNombreSitio(e.target.value)}
            placeholder="Ej: Obra Calle 80"
            className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          />
          <button
            onClick={agregarSitio}
            disabled={capturando || nombreSitio.trim().length < 2}
            className="flex h-10 shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> {capturando ? "Ubicando..." : "Guardar aquí"}
          </button>
        </div>
        {errorSitio && <p className="mt-2 text-xs text-destructive">{errorSitio}</p>}
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
    </div>
  );
}
