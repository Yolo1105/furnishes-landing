import { kitById } from "@/data/hero";
import type { Configuration, HeroId, KitId, Product } from "@/data/types";

/**
 * Names of the rendered images (tools/render writes them, the site reads
 * them, so a version always finds its own picture).
 *
 * Launch pieces are drawn from the hero model spec v0; second-batch pieces
 * from their early recipes. All in the decided materials (D10, D15): white
 * matte faces, birch edges, steel bases, accessories in the accent colour.
 */

/** Kits whose parts the spec draws, so a picture can show them. */
export const DRAWN_KITS: KitId[] = ["K-D1", "K-D2"];

/** Studio views: three-quarter, on the stage colour, 4:5. */
export const STUDIO = { w: 1200, h: 1500 } as const;

export function heroKey(design: HeroId, kits: KitId[]) {
  const drawn = kits.filter((k) => DRAWN_KITS.includes(k)).sort();
  return `${design}-${drawn.length ? drawn.join("-").toLowerCase() : "std"}`;
}

/** Every launch-piece picture the studio set holds. */
export const heroVariants: { design: HeroId; kits: KitId[] }[] = [
  { design: "entry", kits: [] },
  { design: "desk", kits: [] },
  { design: "desk", kits: ["K-D2"] },
  { design: "desk", kits: ["K-D1"] },
  { design: "desk", kits: ["K-D1", "K-D2"] },
  { design: "bedside", kits: [] },
];

/**
 * The studio picture for a version, and what it can't show: kits the spec
 * doesn't draw yet, and fabric faces. The page says so beside the picture.
 */
export function heroImage(c: Configuration) {
  const src = `/renders/hero/${heroKey(c.design, c.kits)}.webp`;
  const missing = c.kits
    .filter((k) => !DRAWN_KITS.includes(k))
    .map((k) => kitById.get(k)?.name ?? k);
  if (c.face !== "solid") missing.push("Fabric faces");
  return { src, missing };
}

/** The bare frame both packs share, on the same camera as the packs. */
export const FRAME_SRC = "/renders/hero/frame.webp";

export const studioSrc = (p: Product) =>
  p.hero
    ? `/renders/hero/${heroKey(p.hero, [])}.webp`
    : `/renders/studio/${p.id}.webp`;

/** Eye-level room views (5:4), one per product. */
export const SCENE = { w: 2000, h: 1600 } as const;
export const sceneSrc = (id: string) => `/renders/scene/${id}.webp`;

/** The opening scene, framed for a wide and a phone layout. */
export const HERO = {
  wide: { src: "/renders/scene/hero-entry.webp", w: 1800, h: 1600 },
  phone: { src: "/renders/scene/hero-entry-phone.webp", w: 1170, h: 1170 },
} as const;

/** Square close views and plates. */
export const SQUARE = { w: 1500, h: 1500 } as const;
export const detailSrc = (which: "edge" | "base") =>
  `/renders/detail/${which}.webp`;
export const partsSrc = (design: HeroId) => `/renders/parts/${design}.webp`;

/** One frame per assembly step, on one camera per piece (4:5). */
export const STEP = { w: 960, h: 1200 } as const;
export const stepSrc = (design: HeroId, n: number) =>
  `/renders/steps/${design}-${String(n).padStart(2, "0")}.webp`;
