"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  listWorkSites,
  createWorkSite,
  toggleWorkSiteActivo,
  updateWorkSiteProyecto,
  deleteWorkSite,
  type Company,
  type WorkSite,
} from "@/lib/supabase/queries";

export default function LocalizacionesPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sitios, setSitios] = useState<WorkSite[]>([]);
  const [nombreSitio, setNombreSitio] = useState("");
  const [capturando, setCapturando] = useState(false);
  const [errorSitio, setErrorSitio] = useState<string | null>(null);
  const [proyectoAbierto, setProyectoAbierto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

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
      await cargarSitios(supabase, empresa.id);
      setCargando(false);
    })();
  }, []);

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

  async function guardarProyecto(site: WorkSite, clienteFinal: string, avance: number) {
    if (!company) return;
    const supabase = createClient();
    await updateWorkSiteProyecto(supabase, site.id, {
      cliente_final: clienteFinal.trim() || null,
      avance_porcentaje: Math.min(100, Math.max(0, avance)),
    });
    await cargarSitios(supabase, company.id);
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
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/app/ajustes")} aria-label="Volver a Ajustes">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="font-display text-xl font-extrabold text-foreground">Localizaciones</h1>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-display text-sm font-bold text-foreground">Sitios de trabajo</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Regístralos parado en el lugar (útil si tu negocio trabaja por obras o proyectos que
          cambian de sitio). Cuando alguien marca, la app avisa si está lejos de TODOS los
          sitios activos, y las horas quedan atribuidas a ese proyecto en Reportes.
        </p>

        {sitios.length > 0 && (
          <div className="mt-3 space-y-2">
            {sitios.map((s) => {
              const abierto = proyectoAbierto === s.id;
              return (
                <div key={s.id} className="rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-2 p-2.5">
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
                      onClick={() => setProyectoAbierto(abierto ? null : s.id)}
                      aria-label={`Datos del proyecto de ${s.nombre}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-primary"
                    >
                      {abierto ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => eliminarSitio(s.id)}
                      aria-label={`Eliminar ${s.nombre}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {abierto && (
                    <div className="space-y-2.5 border-t border-border p-2.5">
                      <label className="block text-xs font-medium text-foreground">
                        Cliente al que se le factura este proyecto
                        <input
                          key={`cliente-${s.id}`}
                          defaultValue={s.cliente_final ?? ""}
                          onBlur={(e) => guardarProyecto(s, e.target.value, s.avance_porcentaje)}
                          placeholder="Ej: Constructora Andina S.A.S."
                          className="mt-1 h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm text-foreground outline-none focus:border-primary"
                        />
                      </label>
                      <label className="block text-xs font-medium text-foreground">
                        % de avance del proyecto
                        <input
                          key={`avance-${s.id}`}
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={s.avance_porcentaje}
                          onBlur={(e) =>
                            guardarProyecto(s, s.cliente_final ?? "", Number(e.target.value) || 0)
                          }
                          className="mt-1 h-9 w-24 rounded-lg border border-border bg-card px-2.5 text-sm text-foreground outline-none focus:border-primary"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
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
    </div>
  );
}
