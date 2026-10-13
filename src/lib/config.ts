import { accessories, recipes } from "@/data/recipes";
import type {
  AccessoryId,
  Configuration,
  Design,
  Finish,
  Front,
  Recipe,
} from "@/data/types";
import { getDesign, recipeOf } from "./catalog";

export const MAX_QUANTITY = 10;

export function defaultConfig(d: Design): Configuration | null {
  const r = recipeOf(d);
  if (!r) return null;
  return {
    design: d.id,
    finish: "natural",
    front: "open",
    accessories: [...r.defaultAccessories].sort(),
    quantity: 1,
  };
}

export const allowedAccessories = (r: Recipe): AccessoryId[] => [
  ...r.defaultAccessories,
  ...r.optionalAccessories,
];

/** Problems found while reading a configuration, said in plain words. */
export type ConfigIssue = string;

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function read(params: Params, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Read a configuration from URL parameters. Anything this design does not
 * support is dropped and reported, never silently swapped for something
 * else. A missing parameter means "the default".
 */
export function parseConfig(
  designId: string,
  params: Params,
): { config: Configuration | null; issues: ConfigIssue[] } {
  const d = getDesign(designId);
  const fallback = d ? defaultConfig(d) : null;
  if (!d || !fallback) return { config: null, issues: [] };
  const r = recipes[d.recipe!];
  const issues: ConfigIssue[] = [];
  const config = { ...fallback };

  const finish = read(params, "finish");
  if (finish !== undefined) {
    if (finish === "natural" || (finish === "orange" && r.orangeFace))
      config.finish = finish as Finish;
    else
      issues.push(
        "The finish in the link isn't offered on this piece, so it shows natural birch.",
      );
  }
  const front = read(params, "front");
  if (front !== undefined) {
    if (front === "open" || (front === "doors" && r.doors))
      config.front = front as Front;
    else
      issues.push(
        "Doors aren't offered on this piece, so it shows an open front.",
      );
  }
  const acc = read(params, "acc");
  if (acc !== undefined) {
    const allowed = allowedAccessories(r);
    const asked = acc.split(",").filter(Boolean);
    const kept = asked.filter((a): a is AccessoryId =>
      allowed.includes(a as AccessoryId),
    );
    if (kept.length < asked.length)
      issues.push(
        "Some accessories in the link don't fit this piece and were left out.",
      );
    config.accessories = [...new Set(kept)].sort();
  }
  const qty = read(params, "qty");
  if (qty !== undefined) {
    const n = Number(qty);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_QUANTITY) config.quantity = n;
    else issues.push(`Quantity must be between 1 and ${MAX_QUANTITY}.`);
  }
  return { config, issues };
}

/** URL parameters for a configuration; defaults are left out to keep links short. */
export function configParams(c: Configuration): URLSearchParams {
  const d = getDesign(c.design);
  const q = new URLSearchParams();
  if (c.finish !== "natural") q.set("finish", c.finish);
  if (c.front !== "open") q.set("front", c.front);
  const def = d ? defaultConfig(d) : null;
  const same =
    def &&
    def.accessories.length === c.accessories.length &&
    def.accessories.every((a, i) => a === [...c.accessories].sort()[i]);
  if (!same) q.set("acc", [...c.accessories].sort().join(","));
  if (c.quantity !== 1) q.set("qty", String(c.quantity));
  return q;
}

export function configHref(c: Configuration, page: "product" | "customize") {
  const q = configParams(c).toString();
  const path = `/furniture/${c.design}${page === "customize" ? "/customize" : ""}`;
  return q ? `${path}?${q}` : path;
}

/** A stable identity for an exact version, used to compare saved designs. */
export function configKey(c: Configuration) {
  return [
    c.design,
    c.finish,
    c.front,
    [...c.accessories].sort().join("+") || "-",
    c.quantity,
  ].join(":");
}

export function sameVersion(a: Configuration, b: Configuration) {
  return configKey({ ...a, quantity: 1 }) === configKey({ ...b, quantity: 1 });
}

export const finishName = (f: Finish) =>
  f === "orange" ? "Birch with orange working face" : "Natural birch";

export const frontName = (f: Front) =>
  f === "doors" ? "With doors" : "Open front";

/** One line a person can read back: "Natural birch · Open front · Coat hooks, Small tray". */
export function configSummary(c: Configuration): string {
  const d = getDesign(c.design);
  const r = d ? recipeOf(d) : undefined;
  return [
    finishName(c.finish),
    r?.doors ? frontName(c.front) : null,
    c.accessories.length
      ? c.accessories.map((a) => accessories[a].name).join(", ")
      : "No accessories",
  ]
    .filter(Boolean)
    .join(" · ");
}
