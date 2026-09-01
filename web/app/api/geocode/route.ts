import { NextRequest, NextResponse } from "next/server";

/** Proxy a Nominatim (OpenStreetMap) — gratis, sin API key. Se llama desde el
 *  servidor (no desde el navegador) porque su política de uso exige un
 *  User-Agent identificable, algo que el navegador no deja fijar a mano. */
const USER_AGENT = "TurnoCheck/1.0 (app de nómina para pymes colombianas; soporte@turnocheck.app)";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  try {
    if (lat && lon) {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
      const r = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      const data = await r.json();
      return NextResponse.json({ direccion: data.display_name ?? null });
    }

    if (q && q.trim().length >= 3) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=co&q=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      const data = await r.json();
      const resultados = (Array.isArray(data) ? data : []).map((d: { display_name: string; lat: string; lon: string }) => ({
        direccion: d.display_name,
        lat: Number(d.lat),
        lng: Number(d.lon),
      }));
      return NextResponse.json({ resultados });
    }

    return NextResponse.json({ error: "falta q o lat/lon" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "no se pudo consultar el servicio de mapas" }, { status: 502 });
  }
}
