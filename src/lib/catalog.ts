import { arrangements, packs, products } from "@/data/products";
import { recipes } from "@/data/recipes";
import type {
  Arrangement,
  CategoryId,
  Pack,
  Product,
  Recipe,
  UseId,
} from "@/data/types";

const byId = new Map(products.map((p) => [p.id, p]));

export { arrangements, packs, products };

export function getProduct(id: string): Product | undefined {
  return byId.get(id);
}

export const launchPieces = products.filter((p) => p.layer === "A");
export const comingSoon = products.filter((p) => p.layer === "B");

export const recipeOf = (p: Product): Recipe | undefined =>
  p.recipe ? recipes[p.recipe] : undefined;

/** Layer C packs on this product ("Other uses"). */
export const packsFor = (p: Product): Pack[] =>
  packs.filter((k) => k.parents.includes(p.id));

/** Layer D arrangements this product is part of ("Around it"). */
export const arrangementsWith = (p: Product): Arrangement[] =>
  arrangements.filter((a) => a.members.some((m) => m.product === p.id));

/** The other pack on the same frame, for the function face. */
export function samePack(p: Product): Product | undefined {
  if (p.id === "entry") return byId.get("desk");
  if (p.id === "desk") return byId.get("entry");
  return undefined;
}

export const uses: { id: UseId; name: string; line: string }[] = [
  {
    id: "entryway",
    name: "By the door",
    line: "Give what you carry in and out a place.",
  },
  {
    id: "work",
    name: "Beside the desk",
    line: "Find your own way of working, and keep your desk.",
  },
  {
    id: "bedroom",
    name: "Next to the bed",
    line: "Keep what you use within reach.",
  },
  {
    id: "living",
    name: "Living room",
    line: "Room to show things, and to hide the rest.",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    line: "A better place to prepare food.",
  },
  {
    id: "dividing",
    name: "Sharing a room",
    line: "Two uses in one room, with something between them.",
  },
];

export const useName = (id: UseId) => uses.find((u) => u.id === id)?.name ?? id;

export const categories: { id: CategoryId; name: string }[] = [
  { id: "organisers", name: "Organisers" },
  { id: "storage", name: "Storage" },
  { id: "carts", name: "Carts" },
  { id: "dividers", name: "Screens and dividers" },
];

export const categoryName = (id: CategoryId) =>
  categories.find((c) => c.id === id)?.name ?? id;

/** Nominal size in centimetres, W x H x D, the order used everywhere. */
export function sizeLabel(s: { w: number; h: number; d: number }) {
  const cm = (mm: number) => Math.round(mm / 10);
  return `${cm(s.w)} × ${cm(s.h)} × ${cm(s.d)} cm`;
}

/** Size, with the base's depth when it reaches further than the body. */
export function fullSizeLabel(p: Product) {
  const base = p.size.baseD
    ? `, base ${Math.round(p.size.baseD / 10)} cm deep`
    : "";
  return `${sizeLabel(p.size)}${base}`;
}

/** Launch pieces first, then the second batch by record number. */
export function bySiteOrder(a: Product, b: Product) {
  if (a.layer !== b.layer) return a.layer < b.layer ? -1 : 1;
  const [a1, a2] = a.record.split(".").map(Number);
  const [b1, b2] = b.record.split(".").map(Number);
  return (a1 ?? 0) - (b1 ?? 0) || (a2 ?? 0) - (b2 ?? 0);
}

/** Earlier concept renders (old finishes), kept for packs and arrangements. */
export const conceptImage = {
  object: (id: string) => `/renders/object/${id}.webp`,
  room: (id: string) => `/renders/room/${id}.webp`,
};
