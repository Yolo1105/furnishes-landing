import model from "./hero-model.json";
import type { HeroId, KitId, KitTier } from "./types";

/**
 * The launch pieces, from the hero modelling spec v0 (2026-10-14,
 * docs/source/hero-spec-v0): every part's size and position, the frozen
 * factory ports, the assembly steps and the 18 add-on kits. Sizes come
 * from params.yaml; values marked X01-X33 there are modelling assumptions
 * waiting for samples. This file only adds English names.
 *
 * Coordinates: x across (left to right), y depth (front 0 to back), z up
 * from the floor, millimetres. The widened base reaches 200 mm forward of
 * the body, so its y is negative.
 */

type RawPart = {
  id: string;
  name: string;
  kind: "board" | "metal" | "accessory";
  group: string;
  material: string;
  size: [number, number, number];
  pos: [number, number, number];
  mass?: number;
  rot?: { axis: "x"; deg: number };
};

type RawStep = {
  id: number;
  title: string;
  action: string;
  parts: string[];
  from_offset: [number, number, number];
  fasteners: { type: string; qty: number; at?: string }[];
  tool: string;
  people: number;
  check: string;
};

const raw = model as unknown as {
  configs: Record<
    HeroId,
    { parts: RawPart[]; steps: RawStep[]; geo: Record<string, number> }
  > & {
    desk: { kit_preview: Record<string, RawPart[]> };
  };
};

export type HeroPart = {
  id: string;
  name: string;
  kind: "board" | "metal" | "accessory";
  /** what it's made of, in words */
  material: string;
  size: [number, number, number];
  pos: [number, number, number];
  mass: number;
  rot?: { axis: "x"; deg: number };
  /** a part of the frame both packs share */
  shared: boolean;
};

/* ---------- English names ---------- */

const PART: Record<string, { name: string; material: string }> = {
  BASE: {
    name: "Widened steel base, with 4 levelling feet",
    material: "Powder-coated steel",
  },
  CW: { name: "Counterweight plate, about 10 kg", material: "Steel" },
  SL: { name: "Full-height side, left", material: "Birch plywood" },
  SR: { name: "Full-height side, right", material: "Birch plywood" },
  BEAM: { name: "Structural base beam", material: "Birch plywood" },
  PNL1: { name: "Face panel, lower", material: "Birch plywood" },
  PNL2: { name: "Face panel, middle", material: "Birch plywood" },
  PNL3: { name: "Face panel, upper", material: "Birch plywood" },
  TOP: { name: "Top", material: "Birch plywood" },
  SHOE: { name: "Slanted shoe shelf", material: "Birch plywood" },
  NSH: { name: "Narrow shelf", material: "Birch plywood" },
  FACE: {
    name: "Hanging face on spacers",
    material: "Perforated plywood or powder-coated steel, under test",
  },
  HOOK1: { name: "Coat hook", material: "Powder-coated steel" },
  HOOK2: { name: "Coat hook", material: "Powder-coated steel" },
  HOOK3: { name: "Coat hook", material: "Powder-coated steel" },
  KEY: { name: "Key tray", material: "Plywood with a steel hanger" },
  UMB: { name: "Umbrella ring", material: "Powder-coated steel" },
  SH1: { name: "Full-depth shelf", material: "Birch plywood" },
  SH2: { name: "Full-depth shelf", material: "Birch plywood" },
  RAIL: { name: "Aluminium rail", material: "Anodised aluminium" },
  CBL: { name: "Cable tray", material: "Steel" },
  PEN: { name: "Pen pot", material: "Steel" },
  BOOKEND: { name: "Bookend", material: "Steel" },
  LEGS: {
    name: "Steel leg frame, about 15 cm, levelling feet",
    material: "Powder-coated steel",
  },
  SL1: { name: "Side, left", material: "Birch plywood" },
  SR1: { name: "Side, right", material: "Birch plywood" },
  TOPB: { name: "Top", material: "Birch plywood" },
  TRAY: { name: "Shallow charging tray", material: "Plywood" },
  DESK: { name: "Desk top, 120 × 60 cm", material: "Birch plywood" },
  BRK: { name: "Heavy brackets, pair", material: "Steel" },
  LEG: { name: "Full-height steel desk leg", material: "Powder-coated steel" },
  STF: { name: "Stiffening tube under the top", material: "Steel" },
};

/** Parts both packs of the function face share (doc 12 v2.0, ch. 03). */
const FRAME = new Set([
  "BASE",
  "CW",
  "SL",
  "SR",
  "BEAM",
  "PNL1",
  "PNL2",
  "PNL3",
  "TOP",
]);

function part(p: RawPart): HeroPart {
  const en = PART[p.id] ?? { name: p.id, material: "" };
  return {
    id: p.id,
    name: en.name,
    kind: p.kind,
    material: en.material,
    size: p.size,
    pos: p.pos,
    mass: p.mass ?? 0,
    ...(p.rot ? { rot: p.rot } : {}),
    shared: FRAME.has(p.id),
  };
}

/* ---------- kits ---------- */

export type Kit = {
  id: KitId;
  name: string;
  /** which launch pieces it fits */
  applies: HeroId[];
  tier: KitTier;
  /** frozen factory ports it uses (D8) */
  ports: number[];
  adds: string[];
  removes: string[];
  /** what the visitor should know, in one line */
  line: string;
  /** the part ids it brings into the model, where the spec draws them */
  geometry?: string[];
};

export const kits: Kit[] = [
  {
    id: "K-E1",
    name: "Change to the desk-side pack",
    applies: ["entry"],
    tier: "first",
    ports: [1, 7],
    adds: ["2 full-depth shelves", "Desk-side accessory pack"],
    removes: [
      "Slanted shoe shelf",
      "Narrow shelf",
      "Hanging face",
      "Entry accessory pack",
    ],
    line: "Same frame, another pack. The parts taken off are yours to keep for changing back.",
  },
  {
    id: "K-E2",
    name: "A second segment beside it",
    applies: ["entry"],
    tier: "first",
    ports: [6],
    adds: ["A complete second function face", "4 joining bolts"],
    removes: [],
    line: "Two entry faces side by side, bolted together.",
  },
  {
    id: "K-E3",
    name: "Door on the lower tier",
    applies: ["entry"],
    tier: "first",
    ports: [8],
    adds: ["1 door, hinges fitted"],
    removes: [],
    line: "Hides the shoes; clips into hinge bases fitted at the factory.",
  },
  {
    id: "K-E4",
    name: "Drawer module",
    applies: ["entry", "desk"],
    tier: "first",
    ports: [1],
    adds: ["1 drawer module"],
    removes: [],
    line: "Sits on the shelf-pin rows.",
  },
  {
    id: "K-E5",
    name: "Fabric face panels",
    applies: ["entry", "desk"],
    tier: "first",
    ports: [],
    adds: ["1 to 3 face panels in fabric"],
    removes: ["The solid face panels they replace"],
    line: "The faces slide out from the top and new ones slide in.",
  },
  {
    id: "K-E6",
    name: "Mirror",
    applies: ["entry"],
    tier: "after-test",
    ports: [3],
    adds: ["Safety mirror", "2 heavy brackets"],
    removes: [],
    line: "Fixes to structural inserts, not the hanging face.",
  },
  {
    id: "K-E7",
    name: "Shoe bench",
    applies: ["entry"],
    tier: "after-test",
    ports: [],
    adds: ["A low block", "Thick seat board", "Cushion"],
    removes: [],
    line: "Needs a seating strength test first.",
  },
  {
    id: "K-E8",
    name: "Caster base",
    applies: ["entry", "desk"],
    tier: "after-test",
    ports: [6],
    adds: ["Caster base with brakes", "Counterweight"],
    removes: ["Widened base"],
    line: "Turns it into the mobile screen; needs a dynamic stability test first.",
  },
  {
    id: "K-D1",
    name: "Desk top kit",
    applies: ["desk"],
    tier: "first",
    ports: [11],
    adds: [
      "Desk top 120 × 60 × 2.5 cm",
      "2 heavy brackets",
      "Full-height steel leg",
      "Stiffening tube",
    ],
    removes: [],
    line: "A desk of its own: the top locks to brackets on the face and stands on a steel leg.",
    geometry: ["DESK", "BRK", "LEG", "STF"],
  },
  {
    id: "K-D2",
    name: "Aluminium rail",
    applies: ["desk"],
    tier: "first",
    ports: [7],
    adds: ["Aluminium rail", "2 brackets"],
    removes: [],
    line: "For heavier things or things you take down often.",
    geometry: ["RAIL"],
  },
  {
    id: "K-D3",
    name: "Monitor arm bracket",
    applies: ["desk"],
    tier: "after-test",
    ports: [3],
    adds: ["Heavy bracket", "Your own monitor arm"],
    removes: [],
    line: "Needs the desk top kit or a second segment, and a test.",
  },
  {
    id: "K-D4",
    name: "Change to the entry pack",
    applies: ["desk"],
    tier: "first",
    ports: [1, 2],
    adds: [
      "Slanted shoe shelf",
      "Narrow shelf",
      "Hanging face",
      "Entry accessory pack",
    ],
    removes: ["2 full-depth shelves", "Desk-side accessory pack"],
    line: "Same frame, another pack. The parts taken off are yours to keep.",
  },
  {
    id: "K-D5",
    name: "Fold-down standing top",
    applies: ["desk"],
    tier: "research",
    ports: [],
    adds: [],
    removes: [],
    line: "",
  },
  {
    id: "K-B1",
    name: "Stack one tier (80 cm bedside)",
    applies: ["bedside"],
    tier: "after-test",
    ports: [10],
    adds: ["2 sides with joining plates", "1 face panel"],
    removes: [],
    line: "Stacking is tested first; at most three tiers.",
  },
  {
    id: "K-B2",
    name: "Stack two tiers (small cabinet)",
    applies: ["bedside"],
    tier: "after-test",
    ports: [10],
    adds: ["4 sides with joining plates", "2 face panels", "Wall strap"],
    removes: [],
    line: "Three tiers need the wall strap; tested first.",
  },
  {
    id: "K-B3",
    name: "Caster base",
    applies: ["bedside"],
    tier: "first",
    ports: [6],
    adds: ["Caster base with brakes"],
    removes: ["Steel leg frame"],
    line: "Rolls to the sofa as a side table.",
  },
  {
    id: "K-B4",
    name: "Join two blocks",
    applies: ["bedside"],
    tier: "first",
    ports: [],
    adds: ["4 joining bolts"],
    removes: [],
    line: "Two blocks side by side as one low cabinet bay. Needs a quantity of 2.",
  },
  {
    id: "K-B5",
    name: "Drawer or door",
    applies: ["bedside"],
    tier: "first",
    ports: [1],
    adds: ["A drawer module or a door"],
    removes: [],
    line: "Closes the lower shelf.",
  },
];

export const kitById = new Map(kits.map((k) => [k.id, k]));

/** The kit that swaps one pack of the function face for the other. */
export const SWAP: Partial<Record<HeroId, KitId>> = {
  entry: "K-E1",
  desk: "K-D4",
};

/** Kits a visitor can choose on a launch piece (sold-first tier, not swaps). */
export function choosableKits(h: HeroId): Kit[] {
  return kits.filter(
    (k) =>
      k.applies.includes(h) &&
      k.tier === "first" &&
      k.id !== SWAP[h] &&
      k.id !== "K-E5",
  );
}

/** Kits shown as "in testing": visible, not choosable. */
export function testingKits(h: HeroId): Kit[] {
  return kits.filter((k) => k.applies.includes(h) && k.tier === "after-test");
}

/* ---------- ports ---------- */

export const PORTS: Record<number, { name: string; where: string }> = {
  1: { name: "Shelf-pin rows", where: "Inside both sides" },
  2: { name: "Hanging area", where: "Upper tier" },
  3: { name: "Mirror or monitor inserts", where: "Outside of the right side" },
  4: { name: "Rail inserts", where: "Inside both sides" },
  5: { name: "Upstand holes", where: "In the top, plugged" },
  6: { name: "Base bolt pattern", where: "Top of the base" },
  7: { name: "Aluminium rail slots", where: "Desk-side version only" },
  8: { name: "Door hinge bases", where: "Inside both sides, lower tier" },
  9: { name: "Inserts under the top", where: "Underside of the top" },
  10: { name: "Stacking plates", where: "Top of the sides" },
  11: { name: "Desk top bracket inserts", where: "Outside of the right side" },
};

/* ---------- steps ---------- */

const STEP: Record<HeroId, [string, string][]> = {
  entry: [
    [
      "Set down the base and level it; drop in the counterweight",
      "Bubble centred; the plate sits in its slot",
    ],
    [
      "Stand the left side on its dowels; lock its plates to the base",
      "The side stands without holding it",
    ],
    ["Stand the right side", "Both sides parallel, grooves facing"],
    [
      "Fit the base beam on its pins; lock both ends",
      "Push the top of a side: the frame doesn't sway",
    ],
    [
      "Lay the shoe shelf on its two pin rows, low at the front",
      "Front lip up; the shelf sits flat",
    ],
    [
      "Slide face panel 1 down the back grooves to the bottom",
      "It lands with a click; one person steadies the sides",
    ],
    ["Slide in face panel 2 on top of it", "Even joints"],
    ["Slide in face panel 3", "Three faces flush"],
    [
      "Fit the top: it holds the panels; lock the side plates up into it",
      "Top flush with the sides; nothing sways",
    ],
    ["Lay the narrow shelf on its pins", "Shelf down on its pins"],
    ["Fit the hanging face on its spacers", "About 2 cm of space behind it"],
    [
      "Hang the coat hooks, key tray and umbrella ring",
      "Each catch locked; a light pull doesn't lift it",
    ],
    [
      "Final check; fit the wall strap from the box if needed",
      "Use within the hanging range in the instructions",
    ],
  ],
  desk: [
    [
      "Set down the base and level it; drop in the counterweight",
      "Bubble centred; the plate sits in its slot",
    ],
    [
      "Stand the left side on its dowels; lock its plates to the base",
      "The side stands without holding it",
    ],
    ["Stand the right side", "Both sides parallel, grooves facing"],
    [
      "Fit the base beam on its pins; lock both ends",
      "Push the top of a side: the frame doesn't sway",
    ],
    [
      "Slide face panel 1 down the back grooves to the bottom",
      "It lands with a click; one person steadies the sides",
    ],
    ["Slide in face panel 2 on top of it", "Even joints"],
    ["Slide in face panel 3", "Three faces flush"],
    [
      "Fit the top: it holds the panels; lock the side plates up into it",
      "Top flush with the sides; nothing sways",
    ],
    [
      "Lay the two full-depth shelves on their pins",
      "Level and down on their pins",
    ],
    ["Fit the aluminium rail, if chosen", "Rail level"],
    ["Place the cable tray, pen pot and bookend", "Cables can enter the tray"],
    [
      "Final check; fit the wall strap from the box if needed",
      "Use within the hanging range in the instructions",
    ],
  ],
  bedside: [
    [
      "Set down the steel leg frame and level it",
      "All four feet down, no rocking",
    ],
    ["Stand the left side; lock it to the frame", "Side upright"],
    ["Stand the right side", "Grooves facing"],
    ["Fit the base beam, which is also the bottom", "The frame doesn't sway"],
    ["Slide the face panel down the back grooves", "Panel down to the bottom"],
    ["Fit the top", "Top flush"],
    ["Place the shallow tray", "A charging cable can leave at the back"],
  ],
};

const TOOL: Record<string, string> = {
  "随附L扳手（调节脚）": "L-key, in the box",
  随附L扳手: "L-key, in the box",
  手拧: "By hand",
  无: "None",
  "螺丝刀（仅固定件）": "Screwdriver (wall strap only)",
};

export type HeroStep = {
  n: number;
  title: string;
  check: string;
  parts: string[];
  /** where the parts come from, relative to their place (mm) */
  from: [number, number, number];
  tool: string;
  people: number;
  fasteners: number;
};

/* ---------- the model, per launch piece ---------- */

export function heroParts(h: HeroId): HeroPart[] {
  return raw.configs[h].parts.map(part);
}

/** Geometry the spec draws for a kit (only the desk top kit, so far). */
export function kitParts(id: KitId): HeroPart[] {
  if (id === "K-D1") return raw.configs.desk.kit_preview["K-D1"]!.map(part);
  return [];
}

export function heroSteps(h: HeroId): HeroStep[] {
  return raw.configs[h].steps.map((s, i) => ({
    n: s.id,
    title: STEP[h][i]?.[0] ?? s.title,
    check: STEP[h][i]?.[1] ?? s.check,
    parts: s.parts,
    from: s.from_offset,
    tool: TOOL[s.tool] ?? s.tool,
    people: s.people,
    fasteners: s.fasteners.reduce((n, f) => n + f.qty, 0),
  }));
}

/** Overall height: base + side + top. */
export function heroHeight(h: HeroId) {
  const g = raw.configs[h].geo;
  return g.hb! + g.H! + 18;
}

/** Parts of one pack swap: what stays, what comes off, what goes on. */
export function packSwap(from: "entry" | "desk", to: "entry" | "desk") {
  const a = heroParts(from).filter((p) => p.id !== "RAIL");
  const b = heroParts(to).filter((p) => p.id !== "RAIL");
  const inB = new Set(b.map((p) => p.id));
  const inA = new Set(a.map((p) => p.id));
  return {
    kept: a.filter((p) => inB.has(p.id)),
    removed: a.filter((p) => !inB.has(p.id)),
    added: b.filter((p) => !inA.has(p.id)),
  };
}
