"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import { CAPA_MAPA, CAPA_SATELITE, type TipoCapa } from "@/lib/map-tiles";

const iconoPin = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#2554c7;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

function ClicksDelMapa({ onMover }: { onMover: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMover(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** MapContainer solo usa `center` en el primer render — react-leaflet no
 *  recentra solo cuando el prop cambia después (ej. al elegir un resultado
 *  de búsqueda). Este componente escucha el cambio y mueve la vista a mano. */
function RecentrarMapa({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export function PickerMap({
  lat,
  lng,
  radioMetros,
  onMover,
  centro,
}: {
  lat: number;
  lng: number;
  radioMetros: number;
  onMover: (lat: number, lng: number) => void;
  centro?: { lat: number; lng: number };
}) {
  const [capa, setCapa] = useState<TipoCapa>("mapa");
  const tile = capa === "satelite" ? CAPA_SATELITE : CAPA_MAPA;

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
        center={[centro?.lat ?? lat, centro?.lng ?? lng]}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer attribution={tile.attribution} url={tile.url} />
        <ClicksDelMapa onMover={onMover} />
        <RecentrarMapa lat={centro?.lat ?? lat} lng={centro?.lng ?? lng} />
        <Circle
          center={[lat, lng]}
          radius={radioMetros}
          pathOptions={{ color: "#2554c7", fillColor: "#2554c7", fillOpacity: 0.15, weight: 1.5 }}
        />
        <Marker
          position={[lat, lng]}
          icon={iconoPin}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const pos = (e.target as L.Marker).getLatLng();
              onMover(pos.lat, pos.lng);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
