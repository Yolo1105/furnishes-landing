import { choosableKits, kitById, SWAP } from "@/data/hero";
import type {
  Configuration,
  FaceType,
  HeroId,
  KitId,
  Product,
} from "@/data/types";

/**
 * One exact version of a launch piece, and how it travels in a URL:
 * `?kits=K-E3,K-E4&face=fabric&qty=2`. Defaults are left out. Only the
 * kits a visitor can choose today ("sold first" tier, D9) are accepted;
 * anything else in a link is dropped and said, never swapped silently.
 */
export const MAX_QUANTITY = 10;

export const isHero = (id: string): id is HeroId =>
  id === "entry" || id === "desk" || id === "bedside";

export function defaultConfig(p: Product): Configuration | null {
  if (!p.hero) return null;
  return { design: p.hero, kits: [], face: "solid", quantity: 1 };
}

export const facesFor = (h: HeroId): FaceType[] =>
  h === "bedside" ? ["solid"] : ["solid", "fabric"];

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function read(params: Params, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

export function parseConfig(
  design: string,
  params: Params,
): { config: Configuration | null; issues: string[] } {
  if (!isHero(design)) return { config: null, issues: [] };
  const issues: string[] = [];
  const config: Configuration = {
    design,
    kits: [],
    face: "solid",
    quantity: 1,
  };
  const raw = read(params, "kits");
  if (raw) {
    const ok = new Set(choosableKits(design).map((k) => k.id));
    const asked = [...new Set(raw.split(",").filter(Boolean))];
    config.kits = asked.filter((k): k is KitId => ok.has(k as KitId)).sort();
    const dropped = asked.filter((k) => !ok.has(k as KitId));
    if (dropped.length)
      issues.push(
        `${dropped.map((k) => kitById.get(k as KitId)?.name ?? k).join(", ")} can't be chosen on this piece today, so ${dropped.length === 1 ? "it was" : "they were"} left out.`,
      );
  }
  const face = read(params, "face");
  if (face !== undefined) {
    if (facesFor(design).includes(face as FaceType))
      config.face = face as FaceType;
    else
      issues.push(
        "That face type isn't offered here, so it shows solid faces.",
      );
  }
  const qty = read(params, "qty");
  if (qty !== undefined) {
    const n = Number(qty);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_QUANTITY) config.quantity = n;
    else issues.push(`Quantity is 1 to ${MAX_QUANTITY}; it was reset to 1.`);
  }
  if (config.kits.includes("K-B4") && config.quantity < 2) {
    config.quantity = 2;
    issues.push("Joining two blocks needs two of them, so the quantity is 2.");
  }
  return { config, issues };
}

export function configParams(c: Configuration): URLSearchParams {
  const q = new URLSearchParams();
  if (c.kits.length) q.set("kits", [...c.kits].sort().join(","));
  if (c.face !== "solid") q.set("face", c.face);
  if (c.quantity !== 1) q.set("qty", String(c.quantity));
  return q;
}

export function configHref(c: Configuration, page: "product" | "customize") {
  const qs = configParams(c).toString();
  const base = `/furniture/${c.design}${page === "customize" ? "/customize" : ""}`;
  return qs ? `${base}?${qs}` : base;
}

/** Identity of a version, ignoring quantity. */
export function configKey(c: Configuration) {
  return `${c.design}|${[...c.kits].sort().join(",")}|${c.face}`;
}

export const sameVersion = (a: Configuration, b: Configuration) =>
  configKey(a) === configKey(b);

export const faceName = (f: FaceType) =>
  f === "solid" ? "Solid faces" : "Fabric faces";

/** The version in words: "Standard pack" or "Door on the lower tier, fabric faces". */
export function configSummary(c: Configuration): string {
  const bits = c.kits.map((k) => kitById.get(k)?.name ?? k);
  if (c.face !== "solid") bits.push(faceName(c.face).toLowerCase());
  return bits.length ? bits.join(", ") : "Standard version";
}

/** The other pack of the function face, keeping what both packs share. */
export function swapPack(c: Configuration): Configuration | null {
  if (!SWAP[c.design] || c.design === "bedside") return null;
  const to: HeroId = c.design === "entry" ? "desk" : "entry";
  const ok = new Set(choosableKits(to).map((k) => k.id));
  return { ...c, design: to, kits: c.kits.filter((k) => ok.has(k)) };
}
