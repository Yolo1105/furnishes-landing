/** Millimetres, width across the front x height x depth. */
export type Size = { w: number; h: number; d: number };

/* ---------- the customer-facing catalogue ---------- */

/**
 * The six layers of the furniture record (家具变形与板件拼装全量记录 v2.0,
 * decision D1). Only A and B are products on the site; C appears as packs
 * on a parent product, D as arrangements of products. E (research) and F
 * (parked) are not on the site at all (D11).
 */
export type ProductLayer = "A" | "B";

/**
 * - launch: a launch piece (layer A). It can be configured and saved; a
 *   real price and "Add to bag" only arrive once its sample dossier is
 *   complete.
 * - soon: second batch (layer B). It can be explored and saved, and you
 *   can register interest; no price, estimate or lead time is shown.
 */
export type ProductStatus = "launch" | "soon";

export type UseId =
  | "entryway"
  | "work"
  | "bedroom"
  | "kitchen"
  | "living"
  | "dividing";

/** The three families of the furniture record: pieces (1.x), walls (2.x), screens (3.x). */
export type FamilyId = "pieces" | "walls" | "screens";

/** Things you do with a piece, for Explore. */
export type ActivityId =
  | "hang"
  | "set-down"
  | "store"
  | "display"
  | "work"
  | "divide"
  | "move";

/** Furniture identity, kept apart from rooms and properties (doc 13, ch. 04). */
export type CategoryId = "organisers" | "storage" | "carts" | "dividers";

/** Everyday things, for "Start with what you love". */
export type ObjectId =
  | "bag-coat"
  | "keys-post"
  | "shoes"
  | "umbrella"
  | "headphones"
  | "laptop"
  | "cables"
  | "books"
  | "records"
  | "camera"
  | "phone-glasses"
  | "cups"
  | "jars"
  | "plants"
  | "tv-devices";

/** The skeletons (doc 12 v2.0, ch. 02). */
export type SkeletonId = "f1200" | "low-block" | "cart" | "f800" | "partition";

export type HeroId = "entry" | "desk" | "bedside";

export type Product = {
  id: string;
  /** Number in the furniture record. */
  record: string;
  layer: ProductLayer;
  status: ProductStatus;
  name: string;
  /** One sentence: what it is for. */
  line: string;
  category: CategoryId;
  family: FamilyId;
  activities: ActivityId[];
  skeleton: SkeletonId;
  /** Overall nominal size; `baseD` when a base reaches deeper than the body. */
  size: Size & { baseD?: number };
  uses: UseId[];
  objects: ObjectId[];
  /** Everyday situations it answers, in the visitor's words. */
  situations: string[];
  /** What to know before choosing it: open questions, tests, limits. */
  notes: string[];
  /** Launch pieces are built from the hero model (spec v0). */
  hero?: HeroId;
  /** Second-batch pieces are drawn from a parts recipe (early geometry). */
  recipe?: RecipeId;
  /** Shown in its room render but not included. */
  scene: string;
};

/** Layer C: a recipe or accessory pack on a parent product. */
export type Pack = {
  id: string;
  record: string;
  name: string;
  line: string;
  parents: string[];
  /** with-parent: follows the parent; testing: needs a test first. */
  state: "with-parent" | "testing";
  note: string;
};

/** Layer D: an arrangement of products, never a product of its own. */
export type Arrangement = {
  id: string;
  record: string;
  name: string;
  line: string;
  members: { product: string; count: number; note?: string }[];
  note: string;
};

/* ---------- the launch-piece configuration ---------- */

export type KitId =
  | "K-E1"
  | "K-E2"
  | "K-E3"
  | "K-E4"
  | "K-E5"
  | "K-E6"
  | "K-E7"
  | "K-E8"
  | "K-D1"
  | "K-D2"
  | "K-D3"
  | "K-D4"
  | "K-D5"
  | "K-B1"
  | "K-B2"
  | "K-B3"
  | "K-B4"
  | "K-B5";

/** Add-on tiers (D9): sold first, after a test, research (never shown). */
export type KitTier = "first" | "after-test" | "research";

export type FaceType = "solid" | "fabric";

/** One exact version of a launch piece. */
export type Configuration = {
  design: HeroId;
  /** Add-on kits of the "sold first" tier, sorted. */
  kits: KitId[];
  /** Face type of the three panels (kit K-E5 when not solid). */
  face: FaceType;
  quantity: number;
};

/* ---------- render geometry for the second batch (early recipes) ---------- */

export type RecipeId =
  | "kitchen"
  | "work-cart"
  | "low-cabinet"
  | "device"
  | "console"
  | "coat-stand"
  | "partition"
  | "sofa-back"
  | "bed-head"
  | "mobile-screen";

export type Shape = "organiser" | "cabinet" | "trolley" | "shelf" | "screen";

/** A parts recipe: early geometry the renderer draws for a B-layer piece. */
export type Recipe = {
  id: RecipeId;
  structure: "full-height" | "stacked";
  shape: Shape;
  size: Size;
  tiers: number;
  bays: number;
  doors: boolean;
  rail?: boolean;
};
