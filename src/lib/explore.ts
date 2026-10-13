import { designs, problems } from "@/data/designs";
import type {
  ActivityId,
  Design,
  FamilyId,
  ObjectId,
  UseId,
} from "@/data/types";
import { activities, objects, uses } from "@/data/vocabulary";
import { bySiteOrder } from "./catalog";

export type ExploreState = {
  rooms: UseId[];
  doing: ActivityId[];
  things: ObjectId[];
  /** A visual example the visitor started from: a design id. */
  example: string | null;
};

export const emptyExplore: ExploreState = {
  rooms: [],
  doing: [],
  things: [],
  example: null,
};

const ROOM_IDS = new Set(uses.map((u) => u.id));
const ACT_IDS = new Set(activities.map((a) => a.id));
const OBJ_IDS = new Set(objects.map((o) => o.id));

function list<T extends string>(
  raw: string | null | undefined,
  ok: Set<T>,
): T[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").filter((x): x is T => ok.has(x as T)))];
}

type Params = URLSearchParams | Record<string, string | string[] | undefined>;
const get = (p: Params, k: string) => {
  if (p instanceof URLSearchParams) return p.get(k);
  const v = p[k];
  return Array.isArray(v) ? v[0] : v;
};

export function parseExplore(p: Params): ExploreState {
  const example = get(p, "example");
  return {
    rooms: list(get(p, "room"), ROOM_IDS),
    doing: list(get(p, "do"), ACT_IDS),
    things: list(get(p, "things"), OBJ_IDS),
    example: example && designs.some((d) => d.id === example) ? example : null,
  };
}

export function exploreParams(s: ExploreState): URLSearchParams {
  const q = new URLSearchParams();
  if (s.rooms.length) q.set("room", s.rooms.join(","));
  if (s.doing.length) q.set("do", s.doing.join(","));
  if (s.things.length) q.set("things", s.things.join(","));
  if (s.example) q.set("example", s.example);
  return q;
}

export const hasAnswers = (s: ExploreState) =>
  s.rooms.length + s.doing.length + s.things.length > 0 || s.example !== null;

export type Match = {
  design: Design;
  /** Short plain reasons, e.g. "For the entryway", "a place for coats and bags". */
  reasons: string[];
  /** True when it matches every kind of answer given. */
  exact: boolean;
};

/**
 * Designs that answer the visitor's choices. Within one kind of answer any
 * choice counts (entryway OR bedroom); across kinds every kind must match
 * (room AND activity AND object). If nothing matches everything, the
 * closest designs are returned and marked as not exact.
 */
export function explore(s: ExploreState): Match[] {
  const scored = designs.map((d) => {
    const reasons: string[] = [];
    let kinds = 0;
    let hit = 0;
    let score = 0;
    if (s.example) {
      kinds++;
      const ex = designs.find((x) => x.id === s.example)!;
      if (d.id === ex.id) {
        hit++;
        score += 6;
        reasons.push("The example you picked");
      } else if (d.frame === ex.frame) {
        hit++;
        score += 3;
        reasons.push(`Same frame as the ${ex.name.toLowerCase()}`);
      } else if (d.uses.some((u) => ex.uses.includes(u))) {
        hit++;
        score += 1;
        reasons.push("For the same kind of room");
      }
    }
    if (s.rooms.length) {
      kinds++;
      const r = s.rooms.filter((u) => d.uses.includes(u));
      if (r.length) {
        hit++;
        score += 3;
        reasons.push(
          `For the ${uses.find((u) => u.id === r[0])!.name.toLowerCase()}`,
        );
      }
    }
    if (s.doing.length) {
      kinds++;
      const a = s.doing.filter((x) => d.activities.includes(x));
      if (a.length) {
        hit++;
        score += 2 * a.length;
        reasons.push(...a.map((x) => activities.find((y) => y.id === x)!.fits));
      }
    }
    if (s.things.length) {
      kinds++;
      const o = s.things.filter((x) => d.objects.includes(x));
      if (o.length) {
        hit++;
        score += 2 * o.length;
        reasons.push(...o.map((x) => objects.find((y) => y.id === x)!.fits));
      }
    }
    return { design: d, reasons, exact: kinds > 0 && hit === kinds, score };
  });
  const exact = scored.filter((m) => m.exact);
  const pool = exact.length ? exact : scored.filter((m) => m.score > 0);
  return pool
    .sort((a, b) => b.score - a.score || bySiteOrder(a.design, b.design))
    .map(({ design, reasons, exact }) => ({ design, reasons, exact }));
}

/** Everyday situations with a picture, for "start from an example". */
export const examples = problems
  .filter((p, i, all) => all.findIndex((q) => q.design === p.design) === i)
  .map((p) => ({ ...p, design: designs.find((d) => d.id === p.design)! }));

/* ---------- Listing filters (Furniture page) ---------- */

export type ListFilters = {
  use: UseId | null;
  family: FamilyId | null;
  status: "configurable" | "concept" | null;
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
  const family = get(p, "type");
  const status = get(p, "status");
  const width = get(p, "width");
  return {
    use: use && ROOM_IDS.has(use as UseId) ? (use as UseId) : null,
    family:
      family === "pieces" || family === "walls" || family === "screens"
        ? family
        : null,
    status: status === "configurable" || status === "concept" ? status : null,
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
  if (f.family) q.set("type", f.family);
  if (f.status) q.set("status", f.status);
  if (f.width) q.set("width", f.width);
  if (f.q.trim()) q.set("q", f.q.trim());
  return q;
}

/** Words people type, matched against names, lines, rooms, objects and situations. */
export function matchesText(d: Design, q: string) {
  const words = q
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 1);
  if (!words.length) return true;
  const hay = [
    d.name,
    d.line,
    d.room,
    ...d.uses.map((u) => uses.find((x) => x.id === u)!.name),
    ...d.objects.map((o) => objects.find((x) => x.id === o)!.name),
    ...problems.filter((p) => p.design === d.id).map((p) => p.text),
  ]
    .join(" ")
    .toLowerCase();
  return words.every((w) => hay.includes(w.replace(/s$/, "")));
}

export function filterDesigns(f: ListFilters): Design[] {
  return designs
    .filter(
      (d) =>
        (!f.use || d.uses.includes(f.use)) &&
        (!f.family || d.family === f.family) &&
        (!f.status || d.status === f.status) &&
        (!f.width || widthBands[f.width].test(d.size.w)) &&
        matchesText(d, f.q),
    )
    .sort(bySiteOrder);
}
