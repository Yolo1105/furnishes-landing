import data from "@/data/callouts.json";
import { heroParts } from "@/data/hero";
import type { HeroId } from "@/data/types";

/**
 * Where each kind of part lands in a launch piece's exploded render, as a
 * share of the image's width (u) and height (v), keyed by the first part
 * of each name. Written by tools/render, so a callout always sits on the
 * part it names.
 */
export type Callout = { u: number; v: number };

const all = data as Partial<Record<HeroId, Record<string, Callout>>>;

export type PlateRow = {
  key: string;
  name: string;
  quantity: number;
  material: string;
  size: string;
  at?: Callout | undefined;
};

/** Parts of a launch piece grouped by name, with their callout positions. */
export function plateRows(h: HeroId): PlateRow[] {
  const rows = new Map<string, PlateRow>();
  for (const p of heroParts(h)) {
    if (p.id === "RAIL") continue;
    const r = rows.get(p.name);
    if (r) {
      r.quantity++;
      continue;
    }
    const [w, d, hh] = p.size.map((v) => Math.round(v));
    rows.set(p.name, {
      key: p.id,
      name: p.name,
      quantity: 1,
      material: p.material,
      size: `${w} × ${d} × ${hh} mm`,
      at: all[h]?.[p.id],
    });
  }
  return [...rows.values()];
}
