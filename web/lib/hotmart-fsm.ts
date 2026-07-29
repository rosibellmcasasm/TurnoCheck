export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "refunded" | "chargeback";

// ⚠️ PLACEHOLDER — verificar con una compra sandbox real antes de confiar en la
// métrica trial→pago (ver "OPERACIONES DE SUSCRIPCIÓN EN HOTMART" en
// docs/sistema/18-VENTA-HOTMART.md). Hotmart no siempre manda un evento propio
// de "inicio de trial": suele venir como PURCHASE_APPROVED con price.value = 0,
// o con subscription_status = 'started'. Ambas señales se tratan como
// 'trialing' aquí; si tu cuenta manda algo distinto, ajustar esta función.
export function statusForEvent(
  event: string,
  opts: { priceValue?: number; subscriptionStatus?: string } = {},
): SubscriptionStatus | null {
  const isTrialSignal = opts.priceValue === 0 || opts.subscriptionStatus === "started";

  switch (event) {
    case "PURCHASE_APPROVED":
    case "PURCHASE_COMPLETE":
      return isTrialSignal ? "trialing" : "active";
    case "PURCHASE_DELAYED":
      return "past_due";
    case "SUBSCRIPTION_CANCELLATION":
    case "PURCHASE_EXPIRED":
    case "PURCHASE_CANCELED":
      return "canceled";
    case "PURCHASE_REFUNDED":
      return "refunded";
    case "PURCHASE_CHARGEBACK":
      return "chargeback";
    default:
      return null; // evento que no nos interesa (ej. PURCHASE_BILLET_PRINTED) — se ignora, 200 igual
  }
}

const TERMINAL_NEGATIVE: SubscriptionStatus[] = ["refunded", "chargeback"];

/** ¿Es legal pasar de `from` a `to`? Bloquea que un evento viejo reentregado
 *  (ej. un PURCHASE_APPROVED tardío) reactive a alguien que ya reembolsó. */
export function canTransition(from: SubscriptionStatus | null, to: SubscriptionStatus): boolean {
  if (from === null) return true;
  if (TERMINAL_NEGATIVE.includes(from) && (to === "active" || to === "trialing")) return false;
  return true;
}

// Mapea el código de oferta de Hotmart (el "off=" del link de checkout) al
// plan interno — ver ESTADO.md, sección "Checkout de Hotmart conectado".
const OFFER_TO_PLAN: Record<string, "micro" | "pyme"> = {
  "4qqy56fl": "micro", // Plan Micro mensual
  xux8yrd7: "micro", // Plan Micro anual
  "3ojqn2b8": "pyme", // Plan Pyme mensual
  sa97egu3: "pyme", // Plan Pyme anual
};

export function planForOfferCode(offerCode: string | undefined): "micro" | "pyme" {
  if (!offerCode) return "micro"; // fallback conservador: nunca dar el plan más grande sin saber cuál pagó
  return OFFER_TO_PLAN[offerCode] ?? "micro";
}
