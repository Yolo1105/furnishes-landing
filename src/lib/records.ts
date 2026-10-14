import conceptSizes from "@/data/concept-images.json";
import { arrangements, packs, products } from "@/data/products";
import type { FamilyId, Product } from "@/data/types";
import { getProduct } from "./catalog";
import { SCENE, STUDIO, studioSrc } from "./renders";

/**
 * Every design visible on the site, as one index: products (launch and
 * coming soon), other uses (packs, which follow their parent product) and
 * arrangements (several products together). Packs and arrangements have
 * no page, price or "add" of their own; their entry links to the product
 * page where they are shown.
 */
export type DesignKind = "launch" | "soon" | "use" | "arrangement";

export type DesignRecord = {
  id: string;
  record: string;
  name: string;
  line: string;
  family: FamilyId;
  kind: DesignKind;
  href: string;
  /** "Other use of the mobile screen", "Arrangement of 2 kitchen carts" */
  relation?: string;
  note?: string;
  image: { src: string; w: number; h: number; concept: boolean };
  product?: Product;
};

const sizes = conceptSizes as unknown as Record<
  "object",
  Record<string, [number, number]>
>;
const concept = (id: string) => {
  const [w, h] = sizes.object[id] ?? [800, 800];
  return { src: `/renders/object/${id}.webp`, w, h, concept: true };
};

const familyOfArrangement: Record<string, FamilyId> = {
  island: "pieces",
  strip: "pieces",
  "wheeled-partition": "screens",
  double: "screens",
};

export const records: DesignRecord[] = [
  ...products.map((p) => ({
    id: p.id,
    record: p.record,
    name: p.name,
    line: p.line,
    family: p.family,
    kind: p.status,
    href: `/furniture/${p.id}`,
    image: { src: studioSrc(p), w: STUDIO.w, h: STUDIO.h, concept: false },
    product: p,
  })),
  ...packs.map((k) => {
    const parent = getProduct(k.parents[0]!)!;
    return {
      id: k.id,
      record: k.record,
      name: k.name,
      line: k.line,
      family: parent.family,
      kind: "use" as const,
      href: `/furniture/${parent.id}#uses`,
      relation: `Other use of the ${k.parents
        .map((id) => getProduct(id)!.name.toLowerCase())
        .join(" or the ")}`,
      note: k.state === "testing" ? "In testing" : "Follows its piece",
      image: concept(k.id),
    };
  }),
  ...arrangements.map((a) => {
    const first = getProduct(a.members[0]!.product)!;
    return {
      id: a.id,
      record: a.record,
      name: a.name,
      line: a.line,
      family: familyOfArrangement[a.id] ?? "walls",
      kind: "arrangement" as const,
      href: `/furniture/${first.id}#around`,
      relation: `Arrangement of ${a.members
        .map((m) => `${m.count} × ${getProduct(m.product)!.name.toLowerCase()}`)
        .join(" + ")}`,
      note: a.note,
      image: concept(a.id),
    };
  }),
].sort((x, y) => {
  const [a1, a2] = x.record.split(".").map(Number);
  const [b1, b2] = y.record.split(".").map(Number);
  return (a1 ?? 0) - (b1 ?? 0) || (a2 ?? 0) - (b2 ?? 0);
});

export const kindLabel: Record<DesignKind, string> = {
  launch: "Launch piece",
  soon: "Coming soon",
  use: "Other use",
  arrangement: "Arrangement",
};

export { SCENE };
