export type Pais = "colombia" | "us_colorado";

export function formatoMoneda(monto: number, pais: Pais): string {
  const redondeado = Math.round(monto);
  if (pais === "us_colorado") return `US$${redondeado.toLocaleString("en-US")}`;
  return `$${redondeado.toLocaleString("es-CO")}`;
}

export const PAISES: { valor: Pais; etiqueta: string }[] = [
  { valor: "colombia", etiqueta: "Colombia" },
  { valor: "us_colorado", etiqueta: "Estados Unidos (Colorado)" },
];
