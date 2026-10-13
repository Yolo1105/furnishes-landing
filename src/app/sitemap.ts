import type { MetadataRoute } from "next";
import { designs } from "@/data/designs";
import { market } from "@/data/market";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/furniture", "/explore", "/how-it-works", "/help"];
  return [
    ...pages.map((p) => ({ url: `${market.siteUrl}${p}` })),
    ...designs.map((d) => ({ url: `${market.siteUrl}/furniture/${d.id}` })),
  ];
}
