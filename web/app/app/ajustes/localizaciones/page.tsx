"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  listWorkSites,
  toggleWorkSiteActivo,
  updateWorkSiteProyecto,
  deleteWorkSite,
  type Company,
  type WorkSite,
} from "@/lib/supabase/queries";

export default function LocalizacionesPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [sitios, setSitios] = useState<WorkSite[]>([]);
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
      setCompany(empresa);
      await cargarSitios(supabase, empresa.id);
      setCargando(false);
    })();
  }, []);

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
    <div className="flex min-h-dvh flex-col px-5 pt-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/app/ajustes")} aria-label="Volver a Ajustes">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="font-display text-xl font-extrabold text-foreground">Localizaciones</h1>
      </div>
      <p className="mt-1 pl-8 text-xs text-muted-foreground">
        Cuando alguien marca, la app avisa si está lejos de TODOS los sitios activos, y las
        horas quedan atribuidas a ese proyecto en Reportes.
      </p>

      <div className="mt-4 flex-1 space-y-2">
        {sitios.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center">
            <MapPin className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Todavía no tienes sitios de trabajo.</p>
          </div>
        ) : (
          sitios.map((s) => {
            const abierto = proyectoAbierto === s.id;
            return (
              <div key={s.id} className="rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2 p-3">
                  <MapPin className={`h-4 w-4 shrink-0 ${s.activo ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${s.activo ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      {s.nombre}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">Radio: {s.radio_metros} m</span>
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
                  <div className="space-y-2.5 border-t border-border p-3">
                    <label className="block text-xs font-medium text-foreground">
                      Cliente al que se le factura este proyecto
                      <input
                        key={`cliente-${s.id}`}
                        defaultValue={s.cliente_final ?? ""}
                        onBlur={(e) => guardarProyecto(s, e.target.value, s.avance_porcentaje)}
                        placeholder="Ej: Constructora Andina S.A.S."
                        className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-primary"
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
                        className="mt-1 h-9 w-24 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="sticky bottom-6 mt-4 pb-2">
        <Link
          href="/app/ajustes/localizaciones/nuevo"
          className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20"
        >
          <Plus className="h-4 w-4" /> Añadir nueva localización
        </Link>
      </div>
    </div>
  );
}
