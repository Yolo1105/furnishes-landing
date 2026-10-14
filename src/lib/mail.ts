import { market } from "@/data/market";
import type { Configuration, Product } from "@/data/types";
import { fullSizeLabel } from "./catalog";
import { configHref, configSummary } from "./config";

/**
 * Email drafts. Nothing is sent from the site: these open the visitor's
 * email app with the details written in, and the page says so.
 */
const mailto = (subject: string, body: string) =>
  `mailto:${market.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const link = (path: string) => `${market.siteUrl}${path}`;

/** A question about one product, with the product and version written in. */
export function askMail(p: Product, config?: Configuration | null) {
  const lines = [
    "Hello Furnishes,",
    "",
    `I have a question about the ${p.name} (record ${p.record}).`,
    config ? `Version: ${configSummary(config)}` : "",
    `Link: ${link(config ? configHref(config, "product") : `/furniture/${p.id}`)}`,
    "",
    "My question:",
    "",
  ].filter((l, i, all) => l || all[i - 1] !== "");
  return mailto(`Question about the ${p.name}`, lines.join("\n"));
}

/** Interest in a second-batch piece. Not counted as an order or as demand. */
export function interestMail(p: Product) {
  const body = [
    "Hello Furnishes,",
    "",
    `Please let me know when the ${p.name} (record ${p.record}) is ready.`,
    `Link: ${link(`/furniture/${p.id}`)}`,
    "",
    "Where I'd use it (optional):",
    "",
  ].join("\n");
  return mailto(`Interest: ${p.name}`, body);
}

export type RequestLine = { product: Product; config: Configuration | null };

/** One email listing every saved version, asking for price and timing. */
export function requestMail(lines: RequestLine[], note: string) {
  const body = [
    "Hello Furnishes,",
    "",
    "These are the versions I saved. Please tell me the price, timing and delivery when you can:",
    "",
    ...lines.flatMap(({ product, config }, i) => [
      `${i + 1}. ${product.name} (record ${product.record})`,
      config
        ? `   ${configSummary(config)} · quantity ${config.quantity}`
        : "   Coming soon: please let me know when it's ready.",
      `   ${fullSizeLabel(product)}, nominal`,
      `   ${link(config ? configHref(config, "product") : `/furniture/${product.id}`)}`,
      "",
    ]),
    note.trim() ? `About my space and timing:\n${note.trim()}\n` : "",
    `Delivery area: ${market.country}`,
  ].join("\n");
  return { href: mailto("About my saved versions", body), body };
}
