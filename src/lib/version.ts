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
