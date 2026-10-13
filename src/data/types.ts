/** Millimetres, width across the front x height x depth. */
export type Size = { w: number; h: number; d: number };

export type FamilyId = "pieces" | "walls" | "screens";

export type UseId =
  | "entryway"
  | "bedroom"
  | "living"
  | "kitchen"
  | "work"
  | "children"
  | "bath"
  | "dividing";

export type ActivityId =
  | "hang"
  | "set-down"
  | "store"
  | "display"
  | "work"
  | "divide"
  | "sit"
  | "move"
  | "pass";

export type ObjectId =
  | "coats-bags"
  | "keys-post"
  | "shoes"
  | "books"
  | "records"
  | "headphones-cables"
  | "laptop-printer"
  | "clothes"
  | "towels"
  | "toys"
  | "cups-coffee"
  | "jars-tools"
  | "plants"
  | "tv-devices"
  | "phone-glasses";

export type HomeId = "flat" | "studio" | "family" | "loft" | "workshop";

/**
 * What a visitor can do with a design.
 * - configurable: parts and drawings are worked out; it can be adjusted
 *   within its supported options, saved and put in a quote request.
 * - concept: a direction still being developed; it can be saved as an
 *   idea and asked about, never configured or quoted as a product.
 */
export type DesignStatus = "configurable" | "concept";

export type Design = {
  id: string;
  /** Number in the furniture transformation record (家具变形与板件拼装全量记录). */
  record: string;
  name: string;
  /** One sentence: what it is for. */
  line: string;
  family: FamilyId;
  frame: string;
  status: DesignStatus;
  size: Size;
  uses: UseId[];
  activities: ActivityId[];
  objects: ObjectId[];
  home: HomeId;
  /** Where it stands in its example home. */
  room: string;
  /** The parts recipe this design is built from, when one is worked out. */
  recipe?: RecipeId;
  /** A design that grows out of another one by adding parts. */
  grownFrom?: { design: string; adds: string };
  image: {
    object: { w: number; h: number };
    room: boolean;
    before: boolean;
  };
};

export type RecipeId =
  | "entry"
  | "desk"
  | "bedside"
  | "kitchen"
  | "work-cart"
  | "sideboard"
  | "bookcase"
  | "workstation"
  | "mobile-screen"
  | "folding-screen"
  | "island"
  | "bench"
  | "coat-rack";

export type Shape =
  | "organiser"
  | "cabinet"
  | "trolley"
  | "shelf"
  | "desk"
  | "screen"
  | "folding"
  | "bench"
  | "island";

export type AccessoryId =
  | "coat-hook"
  | "key-tray"
  | "headphone-hook"
  | "kitchen-rail"
  | "clothes-rail";

/** A parts recipe: the geometry the part model draws and counts. */
export type Recipe = {
  id: RecipeId;
  /** full-height: one-piece sides; stacked: 40 cm tiers; folding; seating. */
  structure: "full-height" | "stacked" | "folding" | "seating";
  shape: Shape;
  size: Size;
  tiers: number;
  bays: number;
  /** Customer copy. */
  use: string;
  description: string;
  /** What to check in your space. */
  space: string;
  /** Doors can be added across the front. */
  doors: boolean;
  /** The working face can be ordered in orange. */
  orangeFace: boolean;
  defaultAccessories: AccessoryId[];
  optionalAccessories: AccessoryId[];
};

export type Finish = "natural" | "orange";
export type Front = "open" | "doors";

/** One exact version of a configurable design. */
export type Configuration = {
  design: string;
  finish: Finish;
  front: Front;
  accessories: AccessoryId[];
  quantity: number;
};
