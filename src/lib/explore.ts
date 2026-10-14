import { products } from "@/data/products";
import type {
  ActivityId,
  CategoryId,
  ObjectId,
  Product,
  ProductStatus,
  UseId,
} from "@/data/types";
import { activities, objects } from "@/data/vocabulary";
import { bySiteOrder, categories, uses } from "./catalog";

type Params = URLSearchParams | Record<string, string | string[] | undefined>;
const get = (p: Params, k: string) => {
  if (p instanceof URLSearchParams) return p.get(k);
  const v = p[k];
  return Array.isArray(v) ? v[0] : v;
};

function list<T extends string>(
  raw: string | null | undefined,
  ok: Set<T>,
): T[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").filter((x): x is T => ok.has(x as T)))];
}

const USE_IDS = new Set(uses.map((u) => u.id));
const OBJ_IDS = new Set(objects.map((o) => o.id));
const CAT_IDS = new Set(categories.map((c) => c.id));
const ACT_IDS = new Set(activities.map((a) => a.id));
const PRODUCT_IDS = new Set(products.map((p) => p.id));
type Width = "narrow" | "medium" | "wide";

/* ---------- Explore: rooms and things ---------- */

export type ExploreState = {
  rooms: UseId[];
  doing: ActivityId[];
  things: ObjectId[];
  width: Width | null;
  /** a concrete situation, by the product it comes from */
  situation: string | null;
};

export const emptyExplore: ExploreState = {
  rooms: [],
  doing: [],
  things: [],
  width: null,
  situation: null,
};

export function parseExplore(p: Params): ExploreState {
  const width = get(p, "width");
  const situation = get(p, "situation");
  return {
    rooms: list(get(p, "room"), USE_IDS),
    doing: list(get(p, "do"), ACT_IDS),
    things: list(get(p, "things"), OBJ_IDS),
    width: width === "narrow" || width === "medium" || width === "wide" ? width : null,
    situation: situation && PRODUCT_IDS.has(situation) ? situation : null,
  };
}

export function exploreParams(s: ExploreState): URLSearchParams {
  const q = new URLSearchParams();
  if (s.rooms.length) q.set("room", s.rooms.join(","));
  if (s.doing.length) q.set("do", s.doing.join(","));
  if (s.things.length) q.set("things", s.things.join(","));
  if (s.width) q.set("width", s.width);
  if (s.situation) q.set("situation", s.situation);
  return q;
}

export const hasAnswers = (s: ExploreState) =>
  s.rooms.length + s.doing.length + s.things.length > 0 ||
  s.width !== null ||
  s.situation !== null;

/** Everyday situations, each from the product that answers it. */
export const situations = products.flatMap((p) =>
  p.situations.map((text) => ({ product: p.id, text })),
);

export type Match = {
  product: Product;
  /** short plain reasons, e.g. "By the door", "hooks for a bag and a coat" */
  reasons: string[];
  exact: boolean;
};

/**
 * Products that answer the choices. Within one kind any choice counts;
 * across kinds both must match. When nothing matches both, the closest
 * are returned and marked. Launch pieces first; nothing is cut silently.
 */
export function explore(s: ExploreState): Match[] {
  const from = s.situation ? products.find((p) => p.id === s.situation) : undefined;
  const scored = products.map((p) => {
    const reasons: string[] = [];
    let kinds = 0;
    let hit = 0;
    let score = 0;
    if (from) {
      kinds++;
      if (p.id === from.id) {
        hit++;
        score += 6;
        reasons.push("Made for this situation");
      } else if (p.uses.some((u) => from.uses.includes(u))) {
        hit++;
        score += 1;
        reasons.push("For the same place");
      }
    }
    if (s.width) {
      kinds++;
      if (widthBands[s.width].test(p.size.w)) {
        hit++;
        score += 1;
        reasons.push(`${Math.round(p.size.w / 10)} cm wide`);
      }
    }
    if (s.doing.length) {
      kinds++;
      const a = s.doing.filter((x) => p.activities.includes(x));
      if (a.length) {
        hit++;
        score += 2 * a.length;
        reasons.push(...a.map((x) => activities.find((y) => y.id === x)!.fits));
      }
    }
    if (s.rooms.length) {
      kinds++;
      const r = s.rooms.filter((u) => p.uses.includes(u));
      if (r.length) {
        hit++;
        score += 3;
        reasons.push(uses.find((u) => u.id === r[0])!.name);
      }
    }
    if (s.things.length) {
      kinds++;
      const o = s.things.filter((x) => p.objects.includes(x));
      if (o.length) {
        hit++;
        score += 2 * o.length;
        reasons.push(...o.map((x) => objects.find((y) => y.id === x)!.fits));
      }
    }
    return { product: p, reasons, exact: kinds > 0 && hit === kinds, score };
  });
  const exact = scored.filter((m) => m.exact);
  const pool = exact.length ? exact : scored.filter((m) => m.score > 0);
  return pool
    .sort(
      (a, b) =>
        (a.product.layer < b.product.layer
          ? -1
          : a.product.layer > b.product.layer
            ? 1
            : 0) ||
        b.score - a.score ||
        bySiteOrder(a.product, b.product),
    )
    .map(({ product, reasons, exact }) => ({ product, reasons, exact }));
}

/** Reasons as one plain sentence: "By the door: hooks for a bag and a coat." */
export function reasonSentence(reasons: string[]) {
  const [first, ...rest] = reasons;
  if (!first) return "";
  const tail = rest.slice(0, 2);
  const s = tail.length ? `${first}: ${tail.join(", ")}.` : `${first}.`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- Furniture index filters ---------- */

export type ListFilters = {
  use: UseId | null;
  category: CategoryId | null;
  status: ProductStatus | null;
  width: "narrow" | "medium" | "wide" | null;
  q: string;
};

export const widthBands = {
  narrow: { label: "Up to 60 cm wide", test: (w: number) => w <= 600 },
  medium: {
    label: "61–120 cm wide",
    test: (w: number) => w > 600 && w <= 1200,
  },
  wide: { label: "Over 120 cm wide", test: (w: number) => w > 1200 },
} as const;

export function parseFilters(p: Params): ListFilters {
  const use = get(p, "use");
  const category = get(p, "type");
  const status = get(p, "status");
  const width = get(p, "width");
  return {
    use: use && USE_IDS.has(use as UseId) ? (use as UseId) : null,
    category:
      category && CAT_IDS.has(category as CategoryId)
        ? (category as CategoryId)
        : null,
    status: status === "launch" || status === "soon" ? status : null,
    width:
      width === "narrow" || width === "medium" || width === "wide"
        ? width
        : null,
    q: (get(p, "q") ?? "").slice(0, 80),
  };
}

export function filterParams(f: ListFilters): URLSearchParams {
  const q = new URLSearchParams();
  if (f.use) q.set("use", f.use);
  if (f.category) q.set("type", f.category);
  if (f.status) q.set("status", f.status);
  if (f.width) q.set("width", f.width);
  if (f.q.trim()) q.set("q", f.q.trim());
  return q;
}

/** Words people type, matched against names, lines, rooms, things and situations. */
export function matchesText(p: Product, q: string) {
  const words = q
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 1);
  if (!words.length) return true;
  const hay = [
    p.name,
    p.line,
    ...p.uses.map((u) => uses.find((x) => x.id === u)!.name),
    ...p.objects.map((o) => objects.find((x) => x.id === o)!.name),
    ...p.situations,
  ]
    .join(" ")
    .toLowerCase();
  return words.every((w) => hay.includes(w.replace(/s$/, "")));
}

export function filterProducts(f: ListFilters): Product[] {
  return products
    .filter(
      (p) =>
        (!f.use || p.uses.includes(f.use)) &&
        (!f.category || p.category === f.category) &&
        (!f.status || p.status === f.status) &&
        (!f.width || widthBands[f.width].test(p.size.w)) &&
        matchesText(p, f.q),
    )
    .sort(bySiteOrder);
}
