import type { Metadata, Viewport } from "next";
import "@fontsource-variable/instrument-sans";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { market } from "@/data/market";

const indexable = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "1";

export const metadata: Metadata = {
  metadataBase: new URL(market.siteUrl),
  title: {
    default: "Furnishes: finished furniture, set up for how you live",
    template: "%s · Furnishes",
  },
  description:
    "Birch plywood furniture for Singapore homes. Choose a finished piece, adjust what it supports, save the exact version and ask for a quote.",
  openGraph: {
    siteName: market.siteName,
    locale: "en_SG",
    type: "website",
  },
  robots: indexable
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-SG">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
