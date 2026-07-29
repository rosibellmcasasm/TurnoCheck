import crypto from "node:crypto";

/**
 * Compara dos strings en TIEMPO CONSTANTE (anti timing-attack) — nunca usar
 * === / !== para comparar secretos: JS corta en el primer byte distinto y
 * el tiempo de respuesta filtra cuántos bytes acertó un atacante.
 * timingSafeEqual exige buffers de igual longitud, o lanza — por eso se
 * compara la longitud con una variable ANTES de comparar bytes.
 */
function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Verifica el hottok recibido contra HOTMART_HOTTOK. Este es el camino
 * PRINCIPAL de autenticidad de Hotmart (token compartido sobre HTTPS, no una
 * firma HMAC inventada) — ver docs/sistema/18-VENTA-HOTMART.md.
 * Devuelve false (nunca lanza) si falta el secreto en el entorno — el
 * caller decide cómo responder (503, sin procesar nada).
 */
export function verifyHotmart(hottok: string | undefined): boolean {
  const HOTTOK = process.env.HOTMART_HOTTOK;
  if (!HOTTOK || !hottok) return false;
  return timingSafeEqualStr(hottok, HOTTOK);
}
