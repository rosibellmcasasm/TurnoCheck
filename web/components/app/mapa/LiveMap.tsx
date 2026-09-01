"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from "react-leaflet";
import { RADIO_GEOCERCA_METROS } from "@/lib/geo";
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
  const centro =
    puntos[0] ?? sitios[0] ?? { lat: 4.710989, lng: -74.072092 }; // Bogotá como fallback

  return (
    <MapContainer
      center={[centro.lat, centro.lng]}
      zoom={puntos.length || sitios.length ? 15 : 12}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {sitios
        .filter((s) => s.activo)
        .map((s) => (
          <Circle
            key={s.id}
            center={[s.lat, s.lng]}
            radius={RADIO_GEOCERCA_METROS}
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
  );
}
