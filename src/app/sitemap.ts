import type { MetadataRoute } from "next";
import { market } from "@/data/market";
import { products } from "@/data/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/furniture", "/explore", "/how-it-works", "/help"];
  return [
    ...pages.map((p) => ({ url: `${market.siteUrl}${p}` })),
    ...products.map((p) => ({ url: `${market.siteUrl}/furniture/${p.id}` })),
  ];
}
