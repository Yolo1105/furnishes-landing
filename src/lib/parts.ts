import { accessories } from "@/data/recipes";
import type { Configuration, Recipe } from "@/data/types";

/**
 * The part model: one configured recipe becomes a list of positioned parts.
 * Geometry is nominal (600 x 400 x 400 unit, 18 mm panels), from the
 * transformation record. Millimetres: x across the front, y into the
 * depth (0 = front), z up from the floor.
 *
 * Ported from the furnishes-house prototype (storefront/lib/assembly.ts).
 * Dropped on purpose: bolt counts, minutes, box weights and the price
 * formula, which looked exact but were not.
 */
export type PartKind = "panel" | "base" | "caster" | "door" | "hardware" | "accessory";

export type PartGroup =
  | "Base"
  | "Body panels"
  | "Shelves"
  | "Top"
  | "Doors"
  | "Connections"
  | "Desk"
  | "Accessories"
  | "Screen frames"
  | "Screen panels";

export type Part = {
  key: string;
  partId: string;
  name: string;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  kind: PartKind;
  group: PartGroup;
  spec: string;
  /** The working face (functional panel) takes the chosen finish. */
  face?: boolean;
};

export type PartRow = {
  partId: string;
  name: string;
  quantity: number;
  spec: string;
  group: PartGroup;
  kind: PartKind;
};

type Options = Pick<Configuration, "finish" | "front" | "accessories">;

const T = 18;
const D = 400;
const SEGMENT = 600;

export const isMobile = (r: Recipe) =>
  ["trolley", "screen", "island"].includes(r.shape);

export function parts(r: Recipe, c: Options): Part[] {
  const out: Part[] = [];
  let serial = 0;
  const add = (
    partId: string,
    name: string,
    box: [number, number, number, number, number, number],
    group: PartGroup = "Body panels",
    kind: PartKind = "panel",
    spec?: string,
    face?: boolean,
  ) => {
    const [x, y, z, w, d, h] = box;
    out.push({
      key: `${partId}-${serial++}`,
      partId,
      name,
      x,
      y,
      z,
      w,
      d,
      h,
      group,
      kind,
      spec:
        spec ??
        `${Math.round(w)} × ${Math.round(d)} × ${Math.round(h)} mm, nominal`,
      ...(face ? { face } : {}),
    });
  };
  const H = r.size.h;
  const mobile = isMobile(r);
  const baseZ = mobile ? 85 : 30;

  if (r.shape === "folding") {
    for (let leaf = 0; leaf < 3; leaf++) {
      for (let side = 0; side < 2; side++)
        add(
          "fold-frame",
          "Leaf frame upright",
          [leaf * 600 + side * 582, 0, 0, 18, 40, H],
          "Screen frames",
          "panel",
          "Frame section and hinge gaps not final",
        );
      for (let tier = 0; tier < 3; tier++)
        add(
          "fold-panel",
          "Screen panel",
          [leaf * 600 + 18, 8, tier * 400, 564, 18, 400],
          "Screen panels",
        );
      if (leaf < 2)
        add(
          "hinge",
          "Continuous hinge",
          [(leaf + 1) * 600 - 10, 0, 20, 12, 25, H - 40],
          "Connections",
          "hardware",
          "Hinge specification not final",
        );
    }
    return out;
  }

  const bodyH = r.shape === "bench" ? 400 : H;
  const full = r.structure === "full-height";
  for (let bay = 0; bay < r.bays; bay++) {
    const x = bay * SEGMENT;
    add(
      mobile ? "caster-base" : "foot-base",
      mobile ? "Caster base" : "Foot base",
      [x - 12, -12, baseZ - 28, 624, 424, 28],
      "Base",
      "base",
      mobile ? "Base on four casters" : "Base on adjustable pads",
    );
    if (mobile)
      for (const [dx, dy] of [
        [38, 26],
        [530, 26],
        [38, 340],
        [530, 340],
      ] as const)
        add(
          "caster",
          "Caster",
          [x + dx, dy, 0, 32, 30, 57],
          "Base",
          "caster",
          "Caster type and height not final",
        );
    for (let side = 0; side < 2; side++)
      for (let t = 0; t < (full ? 1 : r.tiers); t++) {
        const ph = full ? bodyH : bodyH / r.tiers;
        add(
          full ? `side-full-${bodyH}` : "side-400",
          full ? "Full-height side panel" : "Stacking side panel",
          [x + side * (SEGMENT - T), 0, baseZ + t * ph, T, D, ph],
        );
      }
    for (let t = 0; t < r.tiers; t++)
      add(
        "working-face",
        "Working face panel",
        [
          x + T,
          r.shape === "shelf" ? 191 : D - T,
          baseZ + t * (bodyH / r.tiers),
          SEGMENT - 2 * T,
          T,
          bodyH / r.tiers,
        ],
        "Body panels",
        "panel",
        undefined,
        true,
      );
    add("bottom", "Bottom panel", [x + T, 0, baseZ, 564, 380, T]);
    if (r.shape === "organiser") {
      if (r.id === "entry") {
        add("shoe-shelf", "Shoe shelf", [x + T, 0, baseZ + 240, 564, 330, T], "Shelves");
        add("narrow-shelf", "Narrow shelf", [x + T, 180, baseZ + 780, 564, 190, T], "Shelves");
      } else if (r.id === "coat-rack")
        add("shelf", "Shelf", [x + T, 0, baseZ + 300, 564, 380, T], "Shelves");
      else
        for (const z of bodyH >= 1200 ? [430, 770] : bodyH >= 800 ? [400] : [])
          add("shelf", "Shelf", [x + T, 0, baseZ + z, 564, 380, T], "Shelves");
    } else if (r.shape === "shelf") {
      for (let t = 1; t < r.tiers; t++)
        for (const y of [0, 209])
          add("narrow-shelf", "Narrow shelf", [x + T, y, baseZ + t * 400, 564, 190, T], "Shelves");
    } else
      for (let t = 1; t < r.tiers; t++)
        add(
          "shelf",
          "Shelf",
          [x + T, 0, baseZ + t * (bodyH / r.tiers), 564, 380, T],
          "Shelves",
        );
    const longTop = r.shape === "island" || (r.shape === "cabinet" && r.bays > 1);
    if (r.shape !== "bench" && !longTop)
      add(
        r.id === "kitchen" ? "worktop" : "top",
        r.id === "kitchen" ? "Worktop" : "Top panel",
        [x, 0, baseZ + bodyH, SEGMENT, D, T],
        "Top",
      );
    if (c.front === "doors" && r.doors)
      add(
        `door-${bodyH}`,
        "Door",
        [x + T, -20, baseZ + T, 564, 18, bodyH - 30],
        "Doors",
        "door",
        "Door with hinges; specification not final",
      );
  }
  if (r.shape === "island" || (r.shape === "cabinet" && r.bays > 1))
    add(
      `long-top-${r.size.w}`,
      "Long top",
      [0, 0, baseZ + bodyH, r.size.w, D, T],
      "Top",
      "panel",
      `${r.size.w} × ${D} mm, nominal`,
    );
  if (r.shape === "bench")
    for (let bay = 0; bay < r.bays; bay++)
      add(
        "seat",
        "Seat panel",
        [bay * SEGMENT, 0, baseZ + bodyH, SEGMENT, 380, 25],
        "Top",
        "panel",
        "Candidate seat; seating strength not tested",
      );
  for (let i = 1; i < r.bays; i++)
    add(
      "bay-connector",
      "Bay connector",
      [i * SEGMENT - 12, 360, baseZ + 150, 24, 20, 45],
      "Connections",
      "hardware",
      "Connector and fixings not final",
    );
  if (r.shape === "desk") {
    add("desk-top", "Desk surface", [0, -600, baseZ + 720, 1200, 600, T], "Desk");
    add(
      "desk-support",
      "Desk support",
      [1164, -600, baseZ, 36, 580, 720],
      "Desk",
      "panel",
      "Support construction not final",
    );
    for (const bx of [50, 500])
      add(
        "desk-bracket",
        "Desk bracket",
        [bx, -70, baseZ + 660, 50, 80, 60],
        "Connections",
        "hardware",
        "Bracket and fixings not final",
      );
  }
  const sorted = [...c.accessories].sort();
  sorted.forEach((id, i) => {
    const z = baseZ + bodyH * 0.65 - i * 150;
    const spec = accessories[id].description;
    if (id === "coat-hook")
      for (let k = 0; k < 3; k++)
        add("coat-hook", "Coat hook", [135 + k * 125, 300, z, 18, 70, 40], "Accessories", "accessory", spec);
    else if (id === "clothes-rail")
      add(id, "Clothes rail", [80, 170, baseZ + bodyH - 200, 440, 25, 25], "Accessories", "accessory", spec);
    else if (id === "kitchen-rail")
      add(id, "Side rail", [-32, 60, baseZ + bodyH - 70, 20, 270, 20], "Accessories", "accessory", spec);
    else if (id === "key-tray")
      add(id, "Small tray", [180, 190, z, 210, 170, 30], "Accessories", "accessory", spec);
    else add(id, "Utility hook", [300, 300, z, 20, 70, 50], "Accessories", "accessory", spec);
  });
  return out;
}

/** Parts grouped into rows, the way a parts list is read. Casters count with their base. */
export function partsList(r: Recipe, c: Options): PartRow[] {
  const rows = new Map<string, PartRow>();
  for (const p of parts(r, c)) {
    if (p.kind === "caster") continue;
    const row = rows.get(p.partId);
    if (row) row.quantity++;
    else
      rows.set(p.partId, {
        partId: p.partId,
        name: p.name,
        quantity: 1,
        spec: p.spec,
        group: p.group,
        kind: p.kind,
      });
  }
  return [...rows.values()];
}

export const partCount = (rows: PartRow[]) =>
  rows.reduce((n, r) => n + r.quantity, 0);

export type PartChange = {
  partId: string;
  name: string;
  kept: number;
  added: number;
  removed: number;
};

/** What stays, what comes off and what goes on between two parts lists. */
export function compareParts(from: PartRow[], to: PartRow[]): PartChange[] {
  const ids = [...new Set([...from.map((p) => p.partId), ...to.map((p) => p.partId)])];
  return ids.map((partId) => {
    const a = from.find((p) => p.partId === partId);
    const b = to.find((p) => p.partId === partId);
    const start = a?.quantity ?? 0;
    const end = b?.quantity ?? 0;
    return {
      partId,
      name: (b ?? a)!.name,
      kept: Math.min(start, end),
      added: Math.max(0, end - start),
      removed: Math.max(0, start - end),
    };
  });
}

export function changeTotals(changes: PartChange[]) {
  return changes.reduce(
    (t, c) => ({
      kept: t.kept + c.kept,
      added: t.added + c.added,
      removed: t.removed + c.removed,
    }),
    { kept: 0, added: 0, removed: 0 },
  );
}

const ORDER: PartGroup[] = [
  "Base",
  "Body panels",
  "Shelves",
  "Top",
  "Connections",
  "Desk",
  "Doors",
  "Screen frames",
  "Screen panels",
  "Accessories",
];

export type Step = { title: string; detail: string; parts: { name: string; quantity: number }[] };

/** The order the parts go together. Illustrative: not final instructions. */
export function steps(r: Recipe, c: Options): Step[] {
  const all = parts(r, c).filter((p) => p.kind !== "caster");
  const tally = (pick: (p: Part) => boolean) => {
    const m = new Map<string, { name: string; quantity: number }>();
    for (const p of all.filter(pick)) {
      const e = m.get(p.partId);
      if (e) e.quantity++;
      else m.set(p.partId, { name: p.name, quantity: 1 });
    }
    return [...m.values()];
  };
  const plan: [string, string, (p: Part) => boolean][] =
    r.shape === "folding"
      ? [
          ["Lay out the leaves", "Three frames on the floor, nothing fixed yet.", (p) => p.group === "Screen frames"],
          ["Slide the panels into the frames", "Each leaf takes three panels.", (p) => p.group === "Screen panels"],
          ["Join the leaves", "The hinges connect neighbouring frames. Two people make this easier.", (p) => p.group === "Connections"],
        ]
      : [
          ["Set the base where the piece will stand", "Pads or casters go on first.", (p) => p.group === "Base"],
          ["Stand the side panels on the base", "Holes face the side you use.", (p) => p.partId.startsWith("side-")],
          ["Fit the bottom panel", "It squares the two sides.", (p) => p.partId === "bottom"],
          ["Fit the working face", "The panel with the holes for hooks and trays.", (p) => p.partId === "working-face"],
          ["Slide in the shelves", "", (p) => p.group === "Shelves"],
          ["Connect the bays", "", (p) => p.partId === "bay-connector"],
          ["Cap it with the top", "", (p) => p.group === "Top"],
          ["Attach the desk", "", (p) => p.group === "Desk" || p.partId === "desk-bracket"],
          ["Hang the doors", "", (p) => p.group === "Doors"],
          ["Add the accessories", "Hooks and trays hang on the working face.", (p) => p.group === "Accessories"],
        ];
  return plan
    .map(([title, detail, pick]) => ({ title, detail, parts: tally(pick) }))
    .filter((s) => s.parts.length > 0);
}

export const groupOrder = ORDER;

