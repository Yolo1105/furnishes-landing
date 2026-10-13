import { designs, frames, problems } from "@/data/designs";
import { recipes } from "@/data/recipes";
import type { Design, Recipe, UseId } from "@/data/types";
import { uses } from "@/data/vocabulary";

const byId = new Map(designs.map((d) => [d.id, d]));

export const allDesigns = designs;

export function getDesign(id: string): Design | undefined {
  return byId.get(id);
}

/** The recipe a design is drawn and counted from, if it has one. */
export function recipeOf(d: Design): Recipe | undefined {
  return d.recipe ? recipes[d.recipe] : undefined;
}

/** A design a visitor can adjust and quote: configurable status and a recipe. */
export function isConfigurable(d: Design): boolean {
  return d.status === "configurable" && Boolean(d.recipe);
}

export const frameName = (id: string) =>
  frames.find((f) => f.id === id)?.name ?? id;

/** Other designs on the same frame: the same body, set up for another use. */
export function sameFrame(d: Design): Design[] {
  return designs.filter((x) => x.frame === d.frame && x.id !== d.id);
}

export function problemsFor(d: Design): string[] {
  return problems.filter((p) => p.design === d.id).map((p) => p.text);
}

export const useName = (id: UseId) => uses.find((u) => u.id === id)?.name ?? id;

export const images = {
  object: (id: string) => `/renders/object/${id}.webp`,
  room: (id: string) => `/renders/room/${id}.webp`,
  before: (id: string) => `/renders/before/${id}.webp`,
};

/** Nominal size in centimetres, W x H x D, the order used everywhere on the site. */
export function sizeLabel(s: { w: number; h: number; d: number }) {
  const cm = (mm: number) => Math.round(mm / 10);
  return `${cm(s.w)} × ${cm(s.h)} × ${cm(s.d)} cm`;
}

/**
 * Sort used on listings: configurable first, then by record number so the
 * order follows the transformation record.
 */
export function bySiteOrder(a: Design, b: Design) {
  if (a.status !== b.status) return a.status === "configurable" ? -1 : 1;
  const [a1, a2] = a.record.split(".").map(Number);
  const [b1, b2] = b.record.split(".").map(Number);
  return (
    (a1 ?? 0) - (b1 ?? 0) ||
    (a2 ?? 0) - (b2 ?? 0) ||
    a.name.localeCompare(b.name)
  );
}
