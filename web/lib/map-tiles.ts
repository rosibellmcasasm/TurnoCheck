/** Fuentes de mosaicos de mapa — ambas gratis, sin API key.
 *  Satelital: Esri World Imagery (uso libre para volúmenes normales de tráfico). */
export const CAPA_MAPA = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

export const CAPA_SATELITE = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
};

export type TipoCapa = "mapa" | "satelite";
