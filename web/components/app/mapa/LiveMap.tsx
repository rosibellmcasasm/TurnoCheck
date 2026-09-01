"use client";

import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from "react-leaflet";
import { CAPA_MAPA, CAPA_SATELITE, type TipoCapa } from "@/lib/map-tiles";
import type { WorkSite } from "@/lib/supabase/queries";

export interface PuntoEnVivo {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  tiempoTexto: string;
  fueraDeRango: boolean;
}

export function LiveMap({ sitios, puntos }: { sitios: WorkSite[]; puntos: PuntoEnVivo[] }) {
  const [capa, setCapa] = useState<TipoCapa>("mapa");
  const tile = capa === "satelite" ? CAPA_SATELITE : CAPA_MAPA;
  const centro =
    puntos[0] ?? sitios[0] ?? { lat: 4.710989, lng: -74.072092 }; // Bogotá como fallback

  return (
    <div className="relative h-full w-full">
      <div className="absolute right-2 top-2 z-[1000] flex gap-0.5 rounded-lg bg-card p-0.5 shadow-md">
        {(["mapa", "satelite"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCapa(c)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize ${
              capa === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <MapContainer
        center={[centro.lat, centro.lng]}
        zoom={puntos.length || sitios.length ? 15 : 12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer attribution={tile.attribution} url={tile.url} />
        {sitios
          .filter((s) => s.activo)
          .map((s) => (
            <Circle
              key={s.id}
              center={[s.lat, s.lng]}
              radius={s.radio_metros}
              pathOptions={{ color: "#2554c7", fillColor: "#2554c7", fillOpacity: 0.12, weight: 1.5 }}
            >
              <Popup>{s.nombre}</Popup>
            </Circle>
          ))}
        {puntos.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={9}
            pathOptions={{
              color: p.fueraDeRango ? "#b45309" : "#15803d",
              fillColor: p.fueraDeRango ? "#f59e0b" : "#22c55e",
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <strong>{p.nombre}</strong>
              <br />
              {p.tiempoTexto}
              {p.fueraDeRango && (
                <>
                  <br />
                  <span style={{ color: "#b45309" }}>Lejos de toda obra registrada</span>
                </>
              )}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
