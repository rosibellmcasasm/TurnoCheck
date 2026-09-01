"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";

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
  return (
    <MapContainer
      center={[centro?.lat ?? lat, centro?.lng ?? lng]}
      zoom={16}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClicksDelMapa onMover={onMover} />
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
  );
}
