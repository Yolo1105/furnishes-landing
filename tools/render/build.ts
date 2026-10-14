/**
 * Builders: a launch piece from the hero model (spec v0) and a second-batch
 * piece from its early recipe, as three.js groups in the decided finishes.
 * Coordinates in mm: x across, y depth (front 0 to back), z up.
 */
import * as THREE from "three";
import { TubeGeometry } from "three";
import { heroParts, kitParts, type HeroPart } from "@/data/hero";
import type { HeroId, KitId, Recipe } from "@/data/types";
import { parts as recipeParts, type Part } from "@/lib/parts";
import {
  M,
  accent,
  aluminium,
  birch,
  board,
  boxCentre,
  cyl,
  hangingFace,
  mat,
  rbox,
  rubber,
  shadowed,
  steel,
} from "./core";

/** A part as a box in model millimetres, for placing things on it. */
export type Box = {
  id: string;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  kind: string;
};

export type Built = {
  group: THREE.Group;
  boxes: Box[];
  /** part coordinates (mm) to world, once the group is placed */
  at: (x: number, y: number, z: number) => THREE.Vector3;
};

const toBox = (p: HeroPart): Box => ({
  id: p.id,
  x: p.pos[0],
  y: p.pos[1],
  z: p.pos[2],
  w: p.size[0],
  d: p.size[1],
  h: p.size[2],
  kind: p.kind,
});

/* ---------- metalwork and accessories ---------- */

/** Widened sled base: two side rails, cross rails, levelling feet. */
function sled(w: number, d: number, h: number) {
  const g = new THREE.Group();
  const t = 40;
  const rail = (rw: number, rd: number, x: number, z: number) => {
    const m = rbox(rw * M, (h - 14) * M, rd * M, 0.004, steel);
    m.position.set(x * M, ((h - 14) / 2 + 14) * M, z * M);
    g.add(m);
  };
  rail(t, d, -(w / 2 - t / 2), 0);
  rail(t, d, w / 2 - t / 2, 0);
  rail(w - 2 * t, t, 0, d / 2 - t / 2);
  rail(w - 2 * t, t, 0, -(d / 2 - t / 2));
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const foot = cyl(0.016, 0.018, 0.014, rubber, 20);
      foot.position.set(sx * (w / 2 - 30) * M, 0.007, sz * (d / 2 - 30) * M);
      g.add(foot);
    }
  // built from the floor up; the caller centres parts on their box
  g.position.y = (-h / 2) * M;
  return new THREE.Group().add(g);
}

/** Steel leg frame of the low block: four square legs and a top ring. */
function legFrame(w: number, d: number, h: number) {
  const g = new THREE.Group();
  const t = 22;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = rbox(t * M, (h - 8) * M, t * M, 0.003, steel);
      leg.position.set(
        sx * (w / 2 - t / 2 - 8) * M,
        ((h - 8) / 2 + 8) * M,
        sz * (d / 2 - t / 2 - 8) * M,
      );
      g.add(leg);
      const foot = cyl(0.012, 0.012, 0.008, rubber, 16);
      foot.position.set(leg.position.x, 0.004, leg.position.z);
      g.add(foot);
    }
  for (const [rw, rd, x, z] of [
    [w - 16, t, 0, d / 2 - t / 2 - 8],
    [w - 16, t, 0, -(d / 2 - t / 2 - 8)],
    [t, d - 16, -(w / 2 - t / 2 - 8), 0],
    [t, d - 16, w / 2 - t / 2 - 8, 0],
  ] as const) {
    const r = rbox(rw * M, 20 * M, rd * M, 0.003, steel);
    r.position.set(x * M, (h - 10) * M, z * M);
    g.add(r);
  }
  g.position.y = (-h / 2) * M;
  return new THREE.Group().add(g);
}

/** A coat hook: a back plate on the face and a rod out and up (accent). */
function coatHook(d: number, h: number) {
  const g = new THREE.Group();
  const len = d * M;
  const up = h * M * 0.55;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, -len / 2),
    new THREE.Vector3(0, -0.004, -len / 2 + 0.012),
    new THREE.Vector3(0, -0.006, len / 2 - 0.014),
    new THREE.Vector3(0, 0.004, len / 2 - 0.002),
    new THREE.Vector3(0, up * 0.6, len / 2),
  ]);
  g.add(
    shadowed(new THREE.Mesh(new TubeGeometry(curve, 40, 0.0045, 10), accent)),
  );
  const plate = rbox(0.022, h * M, 0.005, 0.002, accent);
  plate.position.set(0, (h * M) / 2 - 0.012, -len / 2 + 0.0025);
  g.add(plate);
  return g;
}

/** Open box tray in plywood (key tray, charging tray). */
function tray(w: number, d: number, h: number, hanger = false) {
  const g = new THREE.Group();
  const t = 8;
  const base = board(w, t, d, birch);
  base.position.y = (-h / 2 + t / 2) * M;
  g.add(base);
  for (const [dx, dz, bw, bd] of [
    [0, -(d / 2 - t / 2), w, t],
    [0, d / 2 - t / 2, w, t],
    [-(w / 2 - t / 2), 0, t, d],
    [w / 2 - t / 2, 0, t, d],
  ] as const) {
    const wall = board(bw, h, bd, birch);
    wall.position.set(dx * M, 0, dz * M);
    g.add(wall);
  }
  if (hanger) {
    const hook = rbox(0.03, (h + 16) * M, 0.004, 0.0015, accent);
    hook.position.set(0, 0.008, -(d / 2 + 2) * M);
    g.add(hook);
  }
  return g;
}

function umbrellaRing(w: number, d: number) {
  const g = new THREE.Group();
  const ring = shadowed(
    new THREE.Mesh(
      new THREE.TorusGeometry((w / 2 - 6) * M, 0.004, 10, 40),
      accent,
    ),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.z = 0.004;
  const arm = rbox(0.008, 0.008, d * M, 0.002, accent);
  arm.position.z = 0;
  g.add(ring, arm);
  return g;
}

/** U-shaped steel cable tray, open at the top. */
function cableTray(w: number, d: number, h: number) {
  const g = new THREE.Group();
  const t = 2;
  const bottom = rbox(w * M, t * M, d * M, 0.001, accent);
  bottom.position.y = (-h / 2 + t / 2) * M;
  const front = rbox(w * M, h * M, t * M, 0.001, accent);
  front.position.z = (d / 2 - t / 2) * M;
  const back = front.clone();
  back.position.z = -(d / 2 - t / 2) * M;
  g.add(bottom, front, back);
  return g;
}

function bookend(w: number, d: number, h: number) {
  const g = new THREE.Group();
  const upright = rbox(w * M, h * M, d * M, 0.002, accent);
  const foot = rbox(0.12, 0.003, d * M, 0.001, accent);
  foot.position.set(0.05, (-h / 2 + 1.5) * M, 0);
  g.add(upright, foot);
  return g;
}

function deskLeg(d: number, h: number) {
  const g = new THREE.Group();
  const t = 40;
  for (const z of [-(d / 2 - t / 2), d / 2 - t / 2]) {
    const post = rbox(t * M, h * M, t * M, 0.004, steel);
    post.position.set(0, (h / 2) * M - (h / 2) * M, z * M);
    g.add(post);
  }
  const top = rbox(t * M, 30 * M, d * M, 0.004, steel);
  top.position.y = (h / 2 - 15) * M;
  const foot = rbox((t + 10) * M, 20 * M, d * M, 0.004, steel);
  foot.position.y = (-h / 2 + 10) * M;
  g.add(top, foot);
  return g;
}

/** One model part as a mesh, centred on its own box. */
function partMesh(p: HeroPart): THREE.Object3D {
  const [w, d, h] = p.size;
  switch (p.id) {
    case "BASE":
      return sled(w, d, h);
    case "LEGS":
      return legFrame(w, d, h);
    case "CW":
      return rbox(w * M, h * M, d * M, 0.002, mat("#2a2826", 0.6, 0.3));
    case "FACE": {
      const m = rbox(w * M, h * M, d * M, 0.0015, hangingFace);
      return m;
    }
    case "SHOE": {
      // the real board, tilted 15 degrees: front low, back high
      const b = board(563, 18, 300);
      b.rotation.x = THREE.MathUtils.degToRad(p.rot?.deg ?? 15);
      const lip = board(563, 30, 12);
      lip.position.set(0, 0.012, 0.144);
      b.add(lip);
      return b;
    }
    case "HOOK1":
    case "HOOK2":
    case "HOOK3":
      return coatHook(d, h);
    case "KEY":
      return tray(w, d, h, true);
    case "TRAY":
      return tray(w, d, h);
    case "UMB":
      return umbrellaRing(w, d);
    case "CBL":
      return cableTray(w, d, h);
    case "PEN":
      return cyl((w / 2) * M, (w / 2) * M, h * M, accent, 28);
    case "BOOKEND":
      return bookend(w, d, h);
    case "RAIL": {
      const g = new THREE.Group();
      g.add(rbox(w * M, h * M, d * M, 0.003, aluminium));
      for (const x of [-(w / 2 - 10), w / 2 - 10]) {
        const b = rbox(0.02, 0.04, 0.03, 0.002, steel);
        b.position.set(x * M, 0, 0.01);
        g.add(b);
      }
      return g;
    }
    case "BRK": {
      const g = new THREE.Group();
      for (const z of [-(d / 2 - 15), d / 2 - 15]) {
        const b = rbox(w * M, h * M, 0.008, 0.002, steel);
        b.position.z = z * M;
        g.add(b);
      }
      return g;
    }
    case "LEG":
      return deskLeg(d, h);
    case "STF":
      return rbox(w * M, h * M, d * M, 0.003, steel);
    default:
      if (p.kind === "board") return board(w, h, d);
      return rbox(
        w * M,
        h * M,
        d * M,
        0.002,
        p.kind === "metal" ? steel : accent,
      );
  }
}

export type HeroBuild = {
  design: HeroId;
  kits?: KitId[];
  /** draw only these part ids (assembly steps, the bare frame) */
  only?: Set<string>;
  /** move parts by these offsets (mm), for exploded views and steps */
  offsets?: Map<string, [number, number, number]>;
  /** leave the optional rail out unless its kit is chosen */
  rail?: boolean;
};

export function heroModelParts(design: HeroId, kits: KitId[] = []): HeroPart[] {
  let ps = heroParts(design);
  if (!kits.includes("K-D2")) ps = ps.filter((p) => p.id !== "RAIL");
  if (kits.includes("K-D1")) ps = [...ps, ...kitParts("K-D1")];
  return ps;
}

/** A launch piece. The body's centre sits at x = 0, z = 0; the floor at y = 0. */
export function hero(b: HeroBuild): Built {
  const all = heroModelParts(b.design, b.kits ?? []);
  const ps = b.only ? all.filter((p) => b.only!.has(p.id)) : all;
  const inner = new THREE.Group();
  for (const p of ps) {
    const m = partMesh(p);
    const off = b.offsets?.get(p.id) ?? [0, 0, 0];
    m.position.copy(
      boxCentre(
        [p.pos[0] + off[0], p.pos[1] + off[1], p.pos[2] + off[2]],
        p.size,
      ),
    );
    inner.add(shadowed(m));
  }
  const group = new THREE.Group();
  group.add(inner);
  // centre on the body (600 x 400), not on the base or a desk top
  inner.position.set(-0.3, 0, 0.2);
  group.updateMatrixWorld(true);
  return {
    group,
    boxes: all.map(toBox),
    at: (x, y, z) =>
      inner.localToWorld(new THREE.Vector3(x * M, z * M, -y * M)),
  };
}

/* ---------- second batch, from early recipes ---------- */

function recipeMesh(p: Part): THREE.Object3D {
  switch (p.kind) {
    case "leg":
      return rbox(p.w * M, p.h * M, p.d * M, 0.003, steel);
    case "caster": {
      const g = new THREE.Group();
      const wheel = cyl(0.024, 0.024, 0.02, rubber, 20);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.y = (-p.h * M) / 2 + 0.024;
      const fork = rbox(0.028, 0.03, 0.03, 0.003, steel);
      fork.position.y = (p.h * M) / 2 - 0.015;
      g.add(wheel, fork);
      return g;
    }
    case "base":
      return p.partId === "widened-base"
        ? sled(p.w, p.d, p.h)
        : rbox(p.w * M, p.h * M, p.d * M, 0.003, steel);
    case "rail": {
      const along = p.w > p.d ? "x" : "z";
      const len = (along === "x" ? p.w : p.d) * M;
      const tube = cyl(0.008, 0.008, len, steel, 16);
      tube.rotation.set(
        along === "z" ? Math.PI / 2 : 0,
        0,
        along === "x" ? Math.PI / 2 : 0,
      );
      return tube;
    }
    case "door": {
      const d = board(p.w, p.h, p.d);
      const pull = rbox(0.09, 0.016, 0.004, 0.002, accent);
      pull.position.set(0, (p.h / 2 - 40) * M, (p.d / 2 + 2) * M);
      d.add(pull);
      return d;
    }
    default:
      return board(p.w, p.h, p.d);
  }
}

export function recipe(
  r: Recipe,
  opts: {
    doors?: boolean;
    offsets?: Map<string, [number, number, number]>;
  } = {},
): Built {
  const ps = recipeParts(r, opts);
  const inner = new THREE.Group();
  for (const p of ps) {
    const m = recipeMesh(p);
    const off = opts.offsets?.get(p.key) ?? [0, 0, 0];
    m.position.copy(
      boxCentre([p.x + off[0], p.y + off[1], p.z + off[2]], [p.w, p.d, p.h]),
    );
    inner.add(shadowed(m));
  }
  const group = new THREE.Group();
  group.add(inner);
  inner.position.set((-r.size.w / 2) * M, 0, (r.size.d / 2) * M);
  group.updateMatrixWorld(true);
  return {
    group,
    boxes: ps.map((p) => ({
      id: p.partId,
      x: p.x,
      y: p.y,
      z: p.z,
      w: p.w,
      d: p.d,
      h: p.h,
      kind: p.kind,
    })),
    at: (x, y, z) =>
      inner.localToWorld(new THREE.Vector3(x * M, z * M, -y * M)),
  };
}

/* ---------- exploded view of a launch piece ---------- */

/** Pull the parts apart along their thin axis, accessories out to the front. */
export function explodeOffsets(
  design: HeroId,
): Map<string, [number, number, number]> {
  const ps = heroModelParts(design);
  const body = ps.filter((p) => p.kind === "board");
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const p of body)
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i]!, p.pos[i]!);
      hi[i] = Math.max(hi[i]!, p.pos[i]! + p.size[i]!);
    }
  const C = lo.map((v, i) => (v + hi[i]!) / 2);
  const out = new Map<string, [number, number, number]>();
  for (const p of ps) {
    const c = p.pos.map((v, i) => v + p.size[i]! / 2);
    const [w, d, h] = p.size;
    const o: [number, number, number] = [0, 0, 0];
    if (p.id === "BASE" || p.id === "LEGS") o[2] = -170;
    else if (p.id === "CW") o[2] = -60;
    else if (p.kind === "accessory") {
      if (["HOOK1", "HOOK2", "HOOK3", "KEY", "UMB"].includes(p.id)) o[1] = -170;
      else o[2] = 140;
    } else if (p.id === "FACE") o[1] = 90;
    else if (p.id === "RAIL") o[1] = -140;
    else if (Math.min(w, d, h) === w) o[0] = Math.sign(c[0]! - C[0]!) * 150;
    else if (Math.min(w, d, h) === d)
      o[1] = Math.abs(c[1]! - C[1]!) < 30 ? 0 : c[1]! > C[1]! ? 230 : -230;
    else
      o[2] =
        (c[2]! - C[2]!) * 0.42 + (p.id === "TOP" || p.id === "TOPB" ? 150 : 0);
    out.set(p.id, o);
  }
  return out;
}
