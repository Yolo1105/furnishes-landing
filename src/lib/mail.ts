import { market } from "@/data/market";
import type { Configuration, Design } from "@/data/types";
import { sizeLabel } from "./catalog";
import { configHref, configSummary } from "./config";

const mailto = (subject: string, body: string) =>
  `mailto:${market.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const link = (path: string) => `${market.siteUrl}${path}`;

/** A question about one design, with the design written in. */
export function askMail(design: Design, config?: Configuration | null) {
  const lines = [
    "Hello Furnishes,",
    "",
    `I have a question about the ${design.name} (design ${design.record}).`,
    config
      ? `Version: ${configSummary(config)}`
      : `Status: ${design.status === "concept" ? "concept" : "configurable"}`,
    `Link: ${link(config ? configHref(config, "product") : `/furniture/${design.id}`)}`,
    "",
    "My question:",
    "",
  ];
  return mailto(`Question about the ${design.name}`, lines.join("\n"));
}

export type QuoteLine = { design: Design; config: Configuration | null };

/** A quote request listing every saved line with its exact configuration. */
export function quoteMail(lines: QuoteLine[], note: string) {
  const body = [
    "Hello Furnishes,",
    "",
    "Please send me a quote for these saved designs:",
    "",
    ...lines.flatMap(({ design, config }, i) => [
      `${i + 1}. ${design.name} (design ${design.record})`,
      config
        ? `   ${configSummary(config)}`
        : "   Concept: I'd like to hear about this direction.",
      `   Size: ${sizeLabel(design.size)} nominal${config ? ` · Quantity: ${config.quantity}` : ""}`,
      `   ${link(config ? configHref(config, "product") : `/furniture/${design.id}`)}`,
      "",
    ]),
    note.trim() ? `About my space and timing:\n${note.trim()}\n` : "",
    `Delivery area: ${market.country}`,
  ].join("\n");
  return {
    href: mailto("Quote request", body),
    body,
  };
}
