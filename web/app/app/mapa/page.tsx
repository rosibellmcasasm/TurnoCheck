"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  listEmployees,
  listWorkSites,
  listMarcacionesAbiertas,
  type Company,
  type Employee,
  type WorkSite,
  type TimeEntry,
} from "@/lib/supabase/queries";
import type { PuntoEnVivo } from "@/components/app/mapa/LiveMap";

const LiveMap = dynamic(() => import("@/components/app/mapa/LiveMap").then((m) => m.LiveMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-secondary" />,
});

function tiempoTranscurrido(fecha: string, horaEntrada: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  const [h, min] = horaEntrada.split(":").map(Number);
  const inicio = new Date(y, m - 1, d, h, min).getTime();
  const minutos = Math.max(0, Math.round((Date.now() - inicio) / 60000));
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `Trabajando hace ${horas > 0 ? `${horas}h ${resto}m` : `${resto}m`}`;
}

export default function MapaPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [empleados, setEmpleados] = useState<Employee[]>([]);
  const [sitios, setSitios] = useState<WorkSite[]>([]);
  const [abiertas, setAbiertas] = useState<TimeEntry[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const empresa = await ensureCompany(supabase, user.id);
      const [emps, sitiosData, abiertasData] = await Promise.all([
        listEmployees(supabase, empresa.id),
        listWorkSites(supabase, empresa.id),
        listMarcacionesAbiertas(supabase, empresa.id),
      ]);
      setCompany(empresa);
      setEmpleados(emps);
      setSitios(sitiosData);
      setAbiertas(abiertasData);
      setCargando(false);
    })();
  }, []);

  if (cargando || !company) {
    return (
      <div className="space-y-3 px-5 pt-6">
        <div className="h-7 w-40 animate-pulse rounded bg-secondary" />
        <div className="h-[60vh] animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  const puntos: PuntoEnVivo[] = abiertas
    .filter((e) => e.lat != null && e.lng != null)
    .map((e) => {
      const emp = empleados.find((x) => x.id === e.employee_id);
      return {
        id: e.id,
        nombre: emp?.nombre ?? "Empleado",
        lat: e.lat as number,
        lng: e.lng as number,
        tiempoTexto: tiempoTranscurrido(e.fecha, e.hora_entrada.slice(0, 5)),
        fueraDeRango: e.fuera_de_rango,
      };
    });

  return (
    <div className="px-5 pt-6">
      <h1 className="font-display text-xl font-extrabold text-foreground">Mapa en vivo</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {puntos.length > 0
          ? `${puntos.length} ${puntos.length === 1 ? "empleado marcando" : "empleados marcando"} ahora`
          : "Nadie está marcado en este momento"}
      </p>

      {sitios.length === 0 && puntos.length === 0 ? (
        <div className="mt-4 flex min-h-[55vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
          <MapPin className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Todavía no tienes sitios de trabajo registrados ni marcaciones abiertas. En
            cuanto un empleado marque entrada, lo verás aquí en el mapa.
          </p>
        </div>
      ) : (
        <div className="mt-4 h-[65vh] overflow-hidden rounded-2xl border border-border shadow-sm">
          <LiveMap sitios={sitios} puntos={puntos} />
        </div>
      )}
    </div>
  );
}
