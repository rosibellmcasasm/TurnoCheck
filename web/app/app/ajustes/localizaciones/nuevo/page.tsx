"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, MapPin, Crosshair, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ensureCompany, createWorkSite } from "@/lib/supabase/queries";

const PickerMap = dynamic(() => import("@/components/app/mapa/PickerMap").then((m) => m.PickerMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-secondary" />,
});

interface ResultadoBusqueda {
  direccion: string;
  lat: number;
  lng: number;
}

const BOGOTA = { lat: 4.710989, lng: -74.072092 };

export default function NuevaLocalizacionPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [direccion, setDireccion] = useState<string | null>(null);
  const [radio, setRadio] = useState(150);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const empresa = await ensureCompany(supabase, user.id);
      setUserId(user.id);
      setCompanyId(empresa.id);
    })();
  }, []);

  useEffect(() => {
    if (!punto) return;
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/geocode?lat=${punto.lat}&lon=${punto.lng}`);
        const data = await r.json();
        setDireccion(data.direccion ?? null);
      } catch {
        setDireccion(null);
      }
    }, 400);
    return () => clearTimeout(id);
  }, [punto]);

  function buscar(texto: string) {
    setBusqueda(texto);
    setBusquedaRealizada(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (texto.trim().length < 3) {
      setResultados([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(texto)}`);
        const data = await r.json();
        setResultados(data.resultados ?? []);
      } catch {
        setResultados([]);
      } finally {
        setBuscando(false);
        setBusquedaRealizada(true);
      }
    }, 500);
  }

  function elegirResultado(r: ResultadoBusqueda) {
    setPunto({ lat: r.lat, lng: r.lng });
    setDireccion(r.direccion);
    setResultados([]);
    setBusqueda("");
  }

  function usarUbicacionActual() {
    setError(null);
    navigator.geolocation?.getCurrentPosition(
      (pos) => setPunto({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("No pudimos obtener tu ubicación. Revisa los permisos del navegador."),
      { timeout: 8000 },
    );
  }

  async function guardar() {
    if (!userId || !companyId || !punto || nombre.trim().length < 2) return;
    setGuardando(true);
    const supabase = createClient();
    await createWorkSite(supabase, userId, companyId, {
      nombre: nombre.trim(),
      lat: punto.lat,
      lng: punto.lng,
      radio_metros: radio,
    });
    router.push("/app/ajustes/localizaciones");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-center gap-3 px-5 pt-6">
        <button onClick={() => router.push("/app/ajustes/localizaciones")} aria-label="Volver">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="font-display text-lg font-extrabold text-foreground">Añadir nueva localización</h1>
      </div>

      <div className="mt-4 space-y-3 px-5">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la localización"
          className="h-11 w-full rounded-lg border border-border bg-background px-3.5 text-[15px] text-foreground outline-none focus:border-primary"
        />

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busqueda}
            onChange={(e) => buscar(e.target.value)}
            placeholder="Buscar dirección..."
            className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-[15px] text-foreground outline-none focus:border-primary"
          />
          {busqueda && (
            <button
              onClick={() => {
                setBusqueda("");
                setResultados([]);
                setBusquedaRealizada(false);
              }}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {(resultados.length > 0 || buscando || (busquedaRealizada && busqueda.trim().length >= 3)) && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
              {buscando && <p className="p-3 text-xs text-muted-foreground">Buscando...</p>}
              {!buscando && resultados.length === 0 && busquedaRealizada && (
                <p className="p-3 text-xs text-muted-foreground">
                  No encontramos esa dirección. Prueba con algo más simple (calle, barrio o
                  ciudad) y después ajusta el pin a mano en el mapa.
                </p>
              )}
              {resultados.map((r, i) => (
                <button
                  key={i}
                  onClick={() => elegirResultado(r)}
                  className="flex w-full items-start gap-2 border-b border-border p-3 text-left last:border-0 hover:bg-secondary"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs text-foreground">{r.direccion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={usarUbicacionActual}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary"
        >
          <Crosshair className="h-3.5 w-3.5" /> Usar mi ubicación actual
        </button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="mt-4 h-64 w-full">
        <PickerMap
          lat={punto?.lat ?? BOGOTA.lat}
          lng={punto?.lng ?? BOGOTA.lng}
          radioMetros={radio}
          onMover={(lat, lng) => setPunto({ lat, lng })}
          centro={punto ?? undefined}
        />
      </div>

      <div className="flex-1 space-y-4 px-5 py-4">
        {direccion && (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {direccion}
          </p>
        )}

        <div>
          <div className="flex items-center justify-between text-sm font-medium text-foreground">
            <span>Radio de la geovalla</span>
            <span className="tabular font-bold text-primary">{radio} m</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Arrastra el pin o toca el mapa para mover el centro. Ajusta el radio con el control.
          </p>
          <input
            type="range"
            min={30}
            max={1000}
            step={10}
            value={radio}
            onChange={(e) => setRadio(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background px-5 py-4">
        <button
          onClick={guardar}
          disabled={!punto || nombre.trim().length < 2 || guardando}
          className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
