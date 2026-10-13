/** The market this site currently serves. One place to change it. */
export const market = {
  country: "Singapore",
  locale: "en-SG",
  currency: "SGD",
  email: "hello@furnish-es.com",
  siteName: "Furnishes",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://furnish-es.com",
} as const;

/**
 * Prices in SGD per configurable design, when they are confirmed.
 * Empty on purpose: until a price is set here, every page shows
 * "Price on request". Never fill this from the prototype's estimates.
 */
export const prices: Partial<Record<string, number>> = {};

export function formatPrice(amount: number) {
  return new Intl.NumberFormat(market.locale, {
    style: "currency",
    currency: market.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
