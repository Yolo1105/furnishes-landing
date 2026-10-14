import type { Recipe } from "@/data/types";

/**
 * Early part geometry for a second-batch piece: one recipe becomes a list
 * of positioned boxes for the renderer. Millimetres: x across the front,
 * y into the depth (0 = front), z up from the floor. Nominal 600 x 400 x
 * 400 unit and 18 mm panels; not a parts list (those are still open).
 */
export type Part = {
  key: string;
  partId: string;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  kind: "panel" | "base" | "caster" | "door" | "rail" | "leg";
  /** the panels at the back of each bay, which take a face type */
  face?: boolean;
};

const T = 18;
const D = 400;
const SEGMENT = 600;

export const isMobile = (r: Recipe) =>
  r.shape === "trolley" || r.shape === "screen";

export function parts(r: Recipe, opts: { doors?: boolean } = {}): Part[] {
  const out: Part[] = [];
  let serial = 0;
  const add = (
    partId: string,
    box: [number, number, number, number, number, number],
    kind: Part["kind"] = "panel",
    face = false,
  ) => {
    const [x, y, z, w, d, h] = box;
    out.push({
      key: `${partId}-${serial++}`,
      partId,
      x,
      y,
      z,
      w,
      d,
      h,
      kind,
      ...(face ? { face } : {}),
    });
  };
  const H = r.size.h;
  const mobile = isMobile(r);
  // 1.2 m and taller hanging pieces stand on the widened base (D13)
  const widened = r.id === "coat-stand";
  const baseZ = mobile ? 85 : widened ? 60 : 120;
  const full = r.structure === "full-height";
  for (let bay = 0; bay < r.bays; bay++) {
    const x = bay * SEGMENT;
    if (mobile) {
      add("caster-base", [x + 10, 10, baseZ - 24, 580, 380, 24], "base");
      for (const [dx, dy] of [
        [38, 26],
        [530, 26],
        [38, 340],
        [530, 340],
      ] as const)
        add("caster", [x + dx, dy, 0, 32, 30, 57], "caster");
    } else if (widened) {
      add("widened-base", [x, -200, 0, SEGMENT, 600, 60], "base");
    } else {
      // steel legs, as the bedside block and the low pieces stand
      for (const [dx, dy] of [
        [20, 20],
        [560, 20],
        [20, 360],
        [560, 360],
      ] as const)
        add("leg", [x + dx, dy, 0, 20, 20, baseZ], "leg");
    }
    for (let side = 0; side < 2; side++)
      for (let t = 0; t < (full ? 1 : r.tiers); t++) {
        const ph = full ? H : H / r.tiers;
        add("side", [x + side * (SEGMENT - T), 0, baseZ + t * ph, T, D, ph]);
      }
    for (let t = 0; t < r.tiers; t++)
      add(
        "face",
        [
          x + T,
          r.shape === "shelf" ? 191 : D - T,
          baseZ + t * (H / r.tiers),
          SEGMENT - 2 * T,
          T,
          H / r.tiers,
        ],
        "panel",
        true,
      );
    add("bottom", [x + T, 0, baseZ, 564, 380, T]);
    if (r.shape === "organiser")
      add("shelf", [x + T, 0, baseZ + H - 340, 564, 380, T]);
    else if (r.shape === "shelf") {
      for (let t = 1; t < r.tiers; t++)
        for (const y of [0, 209])
          add("narrow-shelf", [
            x + T,
            y,
            baseZ + t * (H / r.tiers),
            564,
            190,
            T,
          ]);
    } else
      for (let t = 1; t < r.tiers; t++)
        add("shelf", [x + T, 0, baseZ + t * (H / r.tiers), 564, 380, T]);
    const longTop = r.shape === "cabinet" && r.bays > 1;
    if (!longTop) add("top", [x, 0, baseZ + H, SEGMENT, D, T]);
    if (opts.doors && r.doors)
      add("door", [x + T, -20, baseZ + T, 564, 18, H - 30], "door");
  }
  if (r.shape === "cabinet" && r.bays > 1)
    add("long-top", [0, 0, baseZ + H, r.size.w, D, T]);
  if (r.rail && r.shape === "trolley")
    add("rail", [-32, 60, baseZ + H - 70, 20, 270, 20], "rail");
  if (r.rail && r.shape === "organiser")
    add("rail", [80, 170, baseZ + H - 200, 440, 25, 25], "rail");
  return out;
}
