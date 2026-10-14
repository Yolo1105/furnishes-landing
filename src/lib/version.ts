import { heroParts, kitById, kitParts } from "@/data/hero";
import type { Configuration } from "@/data/types";

/**
 * What one version of a launch piece is made of: the model's parts grouped
 * by name, adjusted by the chosen kits, and the plain list of what each
 * kit adds or takes off. Kits without drawn parts are listed as they are
 * named in the spec, not invented in detail.
 */
export type Row = {
  name: string;
  quantity: number;
  material: string;
  /** from the drawn model, or named by a kit */
  from: "model" | "kit";
};

export function partRows(c: Configuration): Row[] {
  const rows = new Map<string, Row>();
  const add = (name: string, material: string, from: Row["from"], n = 1) => {
    const r = rows.get(name);
    if (r) r.quantity += n;
    else rows.set(name, { name, quantity: n, material, from });
  };
  for (const p of heroParts(c.design)) {
    if (p.id === "RAIL" && !c.kits.includes("K-D2")) continue;
    if (p.id === "LEGS" && c.kits.includes("K-B3")) continue;
    if (c.face === "fabric" && p.id.startsWith("PNL")) {
      add("Face panel in fabric", "Fabric-covered panel", "kit");
      continue;
    }
    add(p.name, p.material, "model");
  }
  for (const k of c.kits) {
    if (k === "K-D2") continue; // the rail is drawn in the model
    const drawn = kitParts(k);
    if (drawn.length) for (const p of drawn) add(p.name, p.material, "model");
    else
      for (const a of kitById.get(k)?.adds ?? [])
        add(a, "As named in the spec", "kit");
  }
  return [...rows.values()];
}

/** What this version adds and takes off, compared with the standard one. */
export function changes(c: Configuration): {
  added: string[];
  removed: string[];
} {
  const added: string[] = [];
  const removed: string[] = [];
  for (const k of c.kits) {
    const kit = kitById.get(k);
    if (!kit) continue;
    added.push(...kit.adds);
    removed.push(...kit.removes);
  }
  if (c.face === "fabric") {
    added.push("3 face panels in fabric");
    removed.push("3 solid face panels (yours to keep)");
  }
  return { added, removed };
}

export const partTotal = (rows: Row[]) =>
  rows.reduce((n, r) => n + r.quantity, 0);

/**
 * The floor space one version takes, in mm, from the drawn model: the
 * widened base sets the depth (D13), the desk top kit widens and deepens
 * it, and a second segment or a joined block doubles the width.
 */
export function footprint(c: Configuration): { w: number; d: number } {
  const parts = [
    ...heroParts(c.design).filter((p) => p.id !== "RAIL"),
    ...(c.kits.includes("K-D1") ? kitParts("K-D1") : []),
  ];
  const span = (i: 0 | 1) =>
    Math.max(...parts.map((p) => p.pos[i] + p.size[i])) -
    Math.min(...parts.map((p) => p.pos[i]));
  const unit = Math.max(
    ...heroParts(c.design).map((p) => p.pos[0] + p.size[0]),
  );
  const doubled = c.kits.includes("K-E2") || c.kits.includes("K-B4");
  return { w: span(0) + (doubled ? unit : 0), d: span(1) };
}
