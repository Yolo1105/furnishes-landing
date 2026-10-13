import type { MetadataRoute } from "next";
import { market } from "@/data/market";

/** Indexing stays off until NEXT_PUBLIC_ALLOW_INDEXING=1 is set for a real launch. */
export default function robots(): MetadataRoute.Robots {
  const allow = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "1";
  return allow
    ? {
        rules: [{ userAgent: "*", allow: "/", disallow: ["/saved", "/*/customize"] }],
        sitemap: `${market.siteUrl}/sitemap.xml`,
      }
    : { rules: [{ userAgent: "*", disallow: "/" }] };
}
