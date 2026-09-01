/** Distancia entre dos coordenadas en metros (fórmula de Haversine). */
export function distanciaMetros(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000; // radio de la Tierra en metros
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Radio de tolerancia de la geocerca — más allá de esto, la marcación queda
 *  señalada como "lejos de toda obra registrada" (no se bloquea, solo se
 *  avisa: el GPS de un celular puede fallar por 20-80m fácilmente). */
export const RADIO_GEOCERCA_METROS = 150;

/** true si el punto está dentro del radio de AL MENOS un sitio activo.
 *  Sin sitios registrados, no hay nada que validar → true (no penalizar a
 *  negocios que todavía no configuraron ninguna obra). */
export function dentroDeAlgunSitio(
  punto: { lat: number; lng: number },
  sitios: { lat: number; lng: number }[],
): boolean {
  if (sitios.length === 0) return true;
  return sitios.some((s) => distanciaMetros(punto, s) <= RADIO_GEOCERCA_METROS);
}

/** A qué sitio/proyecto pertenece una marcación — el sitio activo más cercano
 *  dentro del radio de la geocerca. null si no hay ninguno dentro de rango
 *  (o no hay sitios configurados) — para atribuir horas por proyecto. */
export function sitioDentroDeRango(
  punto: { lat: number; lng: number },
  sitios: { id: string; lat: number; lng: number }[],
): string | null {
  let mejor: { id: string; distancia: number } | null = null;
  for (const s of sitios) {
    const distancia = distanciaMetros(punto, s);
    if (distancia <= RADIO_GEOCERCA_METROS && (!mejor || distancia < mejor.distancia)) {
      mejor = { id: s.id, distancia };
    }
  }
  return mejor?.id ?? null;
}
