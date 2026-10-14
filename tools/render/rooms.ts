/**
 * Eye-level room views: each product doing its job, in warm late-morning
 * light from a window on the left, on one lens (34 degrees vertical).
 */
import * as THREE from "three";
import { getProduct } from "@/lib/catalog";
import { recipes } from "@/data/recipes";
import type { HeroId } from "@/data/types";
import { hero, recipe, type Built } from "./build";
import {
  M,
  envTex,
  finish,
  keyLight,
  linen,
  maps,
  mat,
  rbox,
  cyl,
  shadowed,
} from "./core";
import {
  BOOK_COLOURS,
  bed,
  books,
  desk,
  door,
  findBox,
  glb,
  jar,
  keys,
  lamp,
  laptop,
  mug,
  rug,
  seeded,
  stack,
  surfaces,
  towel,
  type Ctx,
} from "./props";

type RoomSpec = {
  wall: string;
  tiles?: boolean;
  /** world x of the piece's centre (m) */
  x?: number;
  side?: 1 | -1;
  eye: number;
  fill?: number;
  /** distance from the wall (m), beyond touching it */
  gap?: number;
  rotY?: number;
  props?: (ctx: Ctx) => Promise<void> | void;
};

/* ---------- small things for these rooms ---------- */

function slantedShoes(ctx: Ctx) {
  // two pairs on the 15 degree shoe shelf, front low
  const leather = mat("#3b2c25", 0.5);
  const canvas = mat("#ede6da", 0.85);
  const tilt = THREE.MathUtils.degToRad(15);
  for (const [x0, m] of [
    [80, leather],
    [330, canvas],
  ] as const)
    for (const k of [0, 1]) {
      const shoe = rbox(0.09, 0.08, 0.25, 0.03, m);
      const y = 150;
      const z = 160 + Math.tan(tilt) * (y - 10) + 18 + 38;
      shoe.position.copy(ctx.at(x0 + 45 + k * 100, y, z));
      shoe.rotation.x = tilt;
      ctx.add(shoe);
    }
}

function tote(ctx: Ctx, tip: THREE.Vector3) {
  const cloth = linen("#c7ad85", 3);
  const g = new THREE.Group();
  const strap = shadowed(
    new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.007, 8, 30, Math.PI), cloth),
  );
  strap.rotation.z = Math.PI;
  strap.position.y = 0.0;
  const body = rbox(0.3, 0.32, 0.06, 0.025, cloth);
  body.position.set(0, -0.06 - 0.16, 0.035);
  g.add(strap, body);
  g.position.copy(tip);
  ctx.add(g);
}

function umbrella(ctx: Ctx, x: number, y: number, z0: number, z1: number) {
  const g = new THREE.Group();
  const len = (z1 - z0) * M;
  const body = cyl(0.022, 0.012, len * 0.82, mat("#2f3a46", 0.7), 24);
  body.position.y = len * 0.41 + 0.02;
  const tip = cyl(0.003, 0.003, 0.04, mat("#bbb", 0.3, 0.8), 8);
  tip.position.y = 0.0;
  const handle = shadowed(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.03, 0.007, 8, 20, Math.PI),
      mat("#5a3a24", 0.4),
    ),
  );
  handle.position.set(0.03, len, 0);
  const shaft = cyl(0.006, 0.006, len * 0.2, mat("#1d1d1d", 0.4), 8);
  shaft.position.y = len * 0.9;
  g.add(body, tip, handle, shaft);
  g.position.copy(ctx.at(x, y, z0));
  ctx.add(g);
}

function coat(ctx: Ctx, pos: THREE.Vector3, colour: string, ry = 0) {
  const g = new THREE.Group();
  const cloth = linen(colour, 4);
  const body = rbox(0.42, 0.86, 0.09, 0.04, cloth);
  body.position.y = -0.48;
  const shoulders = rbox(0.44, 0.08, 0.1, 0.04, cloth);
  shoulders.position.y = -0.06;
  const hanger = shadowed(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.02, 0.003, 6, 16, Math.PI * 1.4),
      mat("#a07850", 0.5),
    ),
  );
  hanger.position.y = 0.0;
  g.add(body, shoulders, hanger);
  g.position.copy(pos);
  g.rotation.y = ry;
  ctx.add(g);
}

function sofa(ctx: Ctx, x: number, z: number) {
  const g = new THREE.Group();
  const cloth = linen("#b9a58c", 3);
  const base = rbox(2.0, 0.28, 0.9, 0.04, cloth);
  base.position.y = 0.22;
  g.add(base);
  for (const sx of [-0.48, 0.48]) {
    const seat = rbox(0.94, 0.16, 0.74, 0.05, cloth);
    seat.position.set(sx, 0.44, 0.06);
    g.add(seat);
    const back = rbox(0.94, 0.42, 0.2, 0.06, cloth);
    back.position.set(sx, 0.62, -0.34);
    back.rotation.x = -0.12;
    g.add(back);
  }
  for (const sx of [-1.02, 1.02]) {
    const arm = rbox(0.16, 0.56, 0.9, 0.05, cloth);
    arm.position.set(sx, 0.36, 0);
    g.add(arm);
  }
  for (const sx of [-0.9, 0.9])
    for (const sz of [-0.36, 0.36]) {
      const leg = cyl(0.018, 0.014, 0.08, mat("#2b2521", 0.5), 12);
      leg.position.set(sx, 0.04, sz);
      g.add(leg);
    }
  const cushion = rbox(0.42, 0.42, 0.13, 0.06, linen("#c96a3a", 3));
  cushion.position.set(0.7, 0.66, -0.16);
  cushion.rotation.set(-0.2, -0.3, 0.05);
  g.add(cushion);
  g.position.set(x, 0, z);
  ctx.add(g);
}

function boxProp(
  ctx: Ctx,
  pos: THREE.Vector3,
  w: number,
  h: number,
  d: number,
  colour: string,
  ry = 0,
) {
  const b = rbox(w, h, d, 0.004, mat(colour, 0.6));
  b.position.copy(pos).add(new THREE.Vector3(0, h / 2, 0));
  b.rotation.y = ry;
  ctx.add(b);
}

/* ---------- rooms ---------- */

export const ROOMS: Record<string, RoomSpec> = {
  entry: {
    wall: "#eee2d2",
    eye: 1.2,
    side: 1,
    props: async (ctx) => {
      await door(ctx, -0.98);
      slantedShoes(ctx);
      const k = findBox(ctx.boxes, "KEY");
      if (k) keys(ctx, { ...k, y: k.y + 10, z: k.z });
      const h2 = findBox(ctx.boxes, "HOOK3");
      if (h2) tote(ctx, ctx.at(h2.x + h2.w / 2, h2.y + 4, h2.z + h2.h * 0.75));
      umbrella(ctx, 100, 322, 214, 1000);
      const nsh = ctx.surf.find((s) => s.z > 740 && s.z < 780);
      if (nsh) mug(ctx, ctx.at(420, 90, nsh.z), "#e9dfcf");
      await glb(
        ctx,
        "wicker_basket_01",
        new THREE.Vector3(0.62, 0, 0.36),
        0.3,
        1,
      );
      rug(ctx, 0.05, 1.05, 1.2, 0.75, "#c98f6a");
    },
  },
  desk: {
    wall: "#e7dccb",
    eye: 1.2,
    side: 1,
    x: -0.25,
    props: async (ctx) => {
      desk(ctx, 0.72, 0.33);
      laptop(ctx, new THREE.Vector3(0.74, 0.742, 0.36), -0.15);
      mug(ctx, new THREE.Vector3(1.1, 0.742, 0.22));
      await glb(
        ctx,
        "painted_wooden_chair_02",
        new THREE.Vector3(0.86, 0, 0.8),
        0.25,
      );
      const sh = ctx.surf
        .filter((s) => s.z > 790 && s.z < 1100)
        .sort((a, b) => a.z - b.z);
      if (sh[0]) books(ctx, sh[0], sh[0].x0 + 120, sh[0].x1 - 160);
      if (sh[1]) books(ctx, sh[1], sh[1].x0 + 40, sh[1].x0 + 330);
      const top = ctx.surf.reduce((a, b) => (b.z > a.z ? b : a));
      stack(ctx, top, 420, 2);
      const low = ctx.surf.find((s) => s.z < 200);
      if (low)
        boxProp(ctx, ctx.at(300, 200, low.z), 0.36, 0.2, 0.28, "#d8cbb6");
    },
  },
  bedside: {
    wall: "#e9cdb6",
    eye: 0.98,
    side: -1,
    fill: 0.6,
    props: async (ctx) => {
      bed(ctx, 1.18);
      const top = ctx.surf.reduce((a, b) => (b.z > a.z ? b : a));
      lamp(ctx, ctx.at(140, 230, top.z));
      mug(ctx, ctx.at(500, 300, top.z));
      const low = ctx.surf.find((s) => s.z < 200);
      if (low) stack(ctx, low, 300, 3);
      rug(ctx, 0.9, 1.1, 2.2, 1.2, "#e3c7a6");
    },
  },
  kitchen: {
    wall: "#efe5d6",
    tiles: true,
    eye: 1.15,
    side: 1,
    props: async (ctx) => {
      const top = ctx.surf.reduce((a, b) => (b.z > a.z ? b : a));
      const cutting = rbox(
        0.36,
        0.018,
        0.24,
        0.004,
        new THREE.MeshStandardMaterial({
          color: "#c79a6a",
          map: maps.oak,
          roughness: 0.6,
        }),
      );
      cutting.position.copy(ctx.at(250, 160, top.z + 9));
      cutting.rotation.y = 0.12;
      ctx.add(cutting);
      jar(ctx, ctx.at(500, 300, top.z), 0.16, 0.05, "#d9cbb5");
      jar(ctx, ctx.at(500, 180, top.z), 0.11, 0.045, "#c66a3e");
      const s = ctx.surf.filter((q) => q.z < top.z).sort((a, b) => b.z - a.z);
      if (s[0]) {
        jar(ctx, ctx.at(120, 200, s[0].z), 0.2, 0.055, "#efe7d9");
        jar(ctx, ctx.at(240, 200, s[0].z), 0.2, 0.055, "#efe7d9");
        jar(ctx, ctx.at(360, 200, s[0].z), 0.14, 0.055, "#efe7d9");
      }
      const rail = findBox(ctx.boxes, "rail");
      if (rail)
        towel(
          ctx,
          ctx.at(rail.x + rail.w / 2, rail.y + rail.d / 2, rail.z + rail.h / 2),
        );
      await glb(ctx, "potted_plant_04", new THREE.Vector3(0.75, 0, 0.3), 0.6);
    },
  },
  "work-cart": {
    wall: "#e4d8c6",
    eye: 1.15,
    side: -1,
    props: async (ctx) => {
      desk(ctx, -0.92, 0.33);
      laptop(ctx, new THREE.Vector3(-0.95, 0.742, 0.36), 0.2);
      const top = ctx.surf.reduce((a, b) => (b.z > a.z ? b : a));
      // a printer on top, paper below
      boxProp(ctx, ctx.at(300, 200, top.z), 0.44, 0.17, 0.34, "#d9d6d0");
      const s = ctx.surf.filter((q) => q.z < top.z).sort((a, b) => b.z - a.z);
      if (s[0])
        stack(ctx, s[0], 300, 4, ["#f3efe8", "#efe9e0", "#f6f2ea", "#ece4d8"]);
    },
  },
  "low-cabinet": {
    wall: "#e3d1bd",
    eye: 1.12,
    side: 1,
    fill: 0.8,
    props: async (ctx) => {
      const top = ctx.surf.reduce((a, b) => (b.z > a.z ? b : a));
      lamp(ctx, ctx.at(1600, 220, top.z));
      stack(ctx, top, 380, 3);
      const low = ctx.surf
        .filter((q) => q.z < top.z)
        .sort((a, b) => a.x0 - b.x0 || a.z - b.z);
      low.forEach((q, i) => {
        if (i % 3 === 0) books(ctx, q, q.x0 + 10, q.x1 - 80, false);
        else if (i % 3 === 1) stack(ctx, q, q.x0 + 280, 2);
      });
      await glb(ctx, "potted_plant_04", new THREE.Vector3(-1.25, 0, 0.35), 0.2);
      rug(ctx, 0, 1.25, 2.4, 1.4, "#d8b493");
    },
  },
  "device-cabinet": {
    wall: "#e6d8c6",
    eye: 1.1,
    side: 1,
    fill: 0.62,
    props: async (ctx) => {
      const top = ctx.surf.reduce((a, b) => (b.z > a.z ? b : a));
      boxProp(ctx, ctx.at(200, 200, top.z), 0.24, 0.05, 0.16, "#f1efea", 0.2);
      lamp(ctx, ctx.at(470, 220, top.z));
      await glb(ctx, "potted_plant_04", new THREE.Vector3(0.62, 0, 0.3), 0.6);
    },
  },
  console: {
    wall: "#eee2d2",
    eye: 1.18,
    side: 1,
    x: 0.2,
    props: async (ctx) => {
      await door(ctx, -0.95);
      const top = ctx.surf.reduce((a, b) => (b.z > a.z ? b : a));
      const bowl = cyl(0.11, 0.07, 0.05, mat("#c96a3a", 0.4), 32);
      bowl.position
        .copy(ctx.at(380, 200, top.z))
        .add(new THREE.Vector3(0, 0.025, 0));
      ctx.add(bowl);
      stack(ctx, top, 760, 2, ["#efe7da", "#e9dfcf"]);
      await glb(ctx, "potted_plant_04", ctx.at(1080, 200, top.z), 0.3, 0.8);
      const low = ctx.surf.filter((q) => q.z < 300);
      if (low[0]) {
        const sh = mat("#3b2c25", 0.5);
        for (const k of [0, 1]) {
          const shoe = rbox(0.09, 0.08, 0.25, 0.03, sh);
          shoe.position.copy(
            ctx.at(low[0].x0 + 150 + k * 100, 180, low[0].z + 40),
          );
          ctx.add(shoe);
        }
      }
    },
  },
  "coat-stand": {
    wall: "#ead9c6",
    eye: 1.25,
    side: 1,
    props: async (ctx) => {
      const rail = findBox(ctx.boxes, "rail");
      if (rail) {
        coat(ctx, ctx.at(rail.x + 130, rail.y + 12, rail.z + 10), "#a8754a");
        coat(ctx, ctx.at(rail.x + 300, rail.y + 12, rail.z + 10), "#3f4a57");
      }
      await glb(
        ctx,
        "wicker_basket_01",
        new THREE.Vector3(0.66, 0, 0.36),
        0.3,
        1,
      );
      rug(ctx, 0, 1.05, 1.3, 0.8, "#c98f6a");
    },
  },
  divider: {
    wall: "#ead2bd",
    eye: 1.18,
    side: -1,
    gap: 0.9,
    props: async (ctx) => {
      const s = ctx.surf
        .filter((q) => q.y0 < 100)
        .sort((a, b) => a.z - b.z || a.x0 - b.x0);
      s.filter((q) => q.clear < 1000).forEach((q, i) => {
        if (i % 3 === 0) books(ctx, q, q.x0 + 10, q.x1 - 160);
        else if (i % 3 === 1) stack(ctx, q, q.x0 + 250, 2);
      });
      await glb(
        ctx,
        "painted_wooden_chair_02",
        new THREE.Vector3(1.0, 0, 1.6),
        -0.5,
      );
      await glb(
        ctx,
        "wicker_basket_01",
        new THREE.Vector3(-0.98, 0, 1.45),
        0.4,
      );
      rug(ctx, 0, 1.9, 2.0, 1.2, "#e7c79e");
    },
  },
  "sofa-back": {
    wall: "#e3d3c0",
    eye: 1.15,
    side: 1,
    gap: 0.25,
    rotY: Math.PI,
    props: async (ctx) => {
      // the sofa backs onto the divider; we look at it from the room
      sofa(ctx, 0, 1.14);
      const top = ctx.surf.reduce((a, b) => (b.z > a.z ? b : a));
      lamp(ctx, ctx.at(1600, 200, top.z));
      stack(ctx, top, 300, 3);
      await glb(ctx, "potted_plant_04", new THREE.Vector3(1.35, 0, 0.5), 0.2);
      rug(ctx, 0, 1.6, 2.6, 1.4, "#d8b493");
    },
  },
  bookwall: {
    wall: "#e6d6c2",
    eye: 1.2,
    side: 1,
    gap: 0.6,
    props: async (ctx) => {
      const s = ctx.surf
        .filter((q) => q.y0 < 100)
        .sort((a, b) => a.z - b.z || a.x0 - b.x0);
      s.filter((q) => q.clear < 1000).forEach((q, i) => {
        if (i % 4 === 0) books(ctx, q, q.x0 + 10, q.x1 - 120);
        else if (i % 4 === 1) books(ctx, q, q.x0 + 10, q.x0 + 260);
        else if (i % 4 === 2) stack(ctx, q, q.x0 + 220, 3);
        else
          jar(ctx, ctx.at(q.x0 + 300, q.y0 + 100, q.z), 0.14, 0.05, "#c66a3e");
      });
      await glb(
        ctx,
        "painted_wooden_chair_02",
        new THREE.Vector3(1.05, 0, 1.25),
        -0.6,
      );
      await glb(ctx, "potted_plant_04", new THREE.Vector3(-0.95, 0, 0.85), 0.2);
    },
  },
  "bed-head": {
    wall: "#e9cdb6",
    eye: 1.35,
    side: -1,
    gap: 0.5,
    fill: 0.6,
    props: async (ctx) => {
      // the bed's head against the divider, not leaning on it
      bed(ctx, 0, 0.5 + 0.43, false);
      const top = ctx.surf.reduce((a, b) => (b.z > a.z ? b : a));
      lamp(ctx, ctx.at(200, 200, top.z));
      stack(ctx, top, 900, 2);
    },
  },
  "mobile-screen": {
    wall: "#ece1d2",
    eye: 1.2,
    side: 1,
    gap: 0.9,
    rotY: -0.35,
    props: async (ctx) => {
      desk(ctx, -0.75, 0.33);
      laptop(ctx, new THREE.Vector3(-0.8, 0.742, 0.33), 0.1);
      await glb(
        ctx,
        "painted_wooden_chair_02",
        new THREE.Vector3(-0.85, 0, 0.82),
        0.3,
      );
      await glb(ctx, "potted_plant_04", new THREE.Vector3(1.1, 0, 0.45), 0.2);
      rug(ctx, 0.3, 1.5, 2.2, 1.3, "#d9b08c");
    },
  },
};

const tileTexture = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#e2d6c4";
    g.fillRect(0, 0, 256, 256);
    let seed = 5;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 2; x++) {
        const v = 236 + Math.floor(rnd() * 10);
        g.fillStyle = `rgb(${v},${v - 6},${v - 16})`;
        g.fillRect(x * 128 + 3, y * 64 + 3, 122, 58);
      }
    t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

/** Build the product for a room: launch pieces from the model, others from recipes. */
export function buildProduct(id: string): Built {
  const p = getProduct(id)!;
  if (p.hero) return hero({ design: p.hero as HeroId });
  return recipe(recipes[p.recipe!], { doors: p.id === "device-cabinet" });
}

export type RoomView = { aspect: number; fill?: number; tight?: boolean };

export async function room(
  id: string,
  width: number,
  height: number,
  view?: RoomView,
) {
  const spec = ROOMS[id]!;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#e9dccb");
  scene.environment = envTex;
  scene.environmentIntensity = 0.32;
  const plaster = new THREE.MeshStandardMaterial({
    color: spec.wall,
    normalMap: maps.wallNormal,
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughness: 0.95,
  });
  const floorMat = new THREE.MeshStandardMaterial({
    color: "#f6e6d2",
    map: maps.floor,
    roughnessMap: maps.floorRough,
    roughness: 0.6,
  });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.2), plaster);
  back.position.set(0, 1.6, 0);
  back.receiveShadow = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 3.5);
  floor.receiveShadow = true;
  scene.add(back, floor);
  const skirting = new THREE.Mesh(
    new THREE.BoxGeometry(9, 0.08, 0.014),
    mat("#f6f0e8", 0.55),
  );
  skirting.position.set(0, 0.04, 0.007);
  skirting.receiveShadow = true;
  scene.add(skirting);
  if (spec.tiles) {
    const tt = tileTexture().clone();
    tt.repeat.set(9 / 0.3, 1.2 / 0.3);
    tt.needsUpdate = true;
    const tiles = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 1.2),
      new THREE.MeshStandardMaterial({ map: tt, roughness: 0.35 }),
    );
    tiles.position.set(0, 0.6, 0.002);
    tiles.receiveShadow = true;
    scene.add(tiles);
  }

  const built = buildProduct(id);
  const g = built.group;
  const box0 = new THREE.Box3().setFromObject(g);
  g.rotation.y = spec.rotY ?? 0;
  g.position.x += spec.x ?? 0;
  // the back of the piece against the wall, plus any gap
  g.position.z += -box0.min.z + 0.012 + (spec.gap ?? 0);
  scene.add(g);
  g.updateMatrixWorld(true);

  // frame on the body and base, so a piece's versions share one camera
  const focus = new THREE.Box3();
  for (const b of built.boxes)
    if (b.kind !== "accessory" && b.kind !== "door")
      for (const [x, y, z] of [
        [b.x, b.y, b.z],
        [b.x + b.w, b.y + b.d, b.z + b.h],
      ] as const)
        focus.expandByPoint(built.at(x, y, z));

  const ctx: Ctx = {
    scene,
    piece: built,
    rand: seeded(7 + id.length),
    at: built.at,
    add: (o) => {
      shadowed(o);
      scene.add(o);
    },
    frame: (o) => {
      shadowed(o);
      scene.add(o);
      o.updateMatrixWorld(true);
      if (!view?.tight) focus.union(new THREE.Box3().setFromObject(o));
    },
    surf: surfaces(built.boxes),
    boxes: built.boxes,
  };
  await spec.props?.(ctx);

  const sunDir = new THREE.Vector3(-0.62, 0.52, 0.58).normalize();
  const centre = focus.getCenter(new THREE.Vector3());
  const sun = keyLight(
    scene,
    centre.clone().addScaledVector(sunDir, 6),
    3.6,
    3.4,
  );
  sun.color = new THREE.Color("#ffd6a6");
  sun.target.position.copy(centre);
  scene.add(sun.target);
  const windowFrame = new THREE.Group();
  const bar = (w: number, h: number, x: number, y: number) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.04),
      new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    );
    m.position.set(x, y, 0);
    m.castShadow = true;
    windowFrame.add(m);
  };
  bar(1.4, 0.06, 0, 0.8);
  bar(1.4, 0.06, 0, -0.8);
  bar(0.06, 1.66, -0.68, 0);
  bar(0.06, 1.66, 0.68, 0);
  bar(0.04, 1.6, 0, 0);
  bar(1.36, 0.04, 0, 0.32);
  windowFrame.position.copy(
    new THREE.Vector3(centre.x + 0.9, 1.25, 0.2).addScaledVector(sunDir, 2.4),
  );
  windowFrame.lookAt(windowFrame.position.clone().add(sunDir));
  scene.add(windowFrame);
  scene.add(new THREE.HemisphereLight("#fff2e2", "#b88c66", 0.55));
  const fill = new THREE.DirectionalLight("#f0e6ff", 0.25);
  fill.position.set(4, 2, 5);
  scene.add(fill);

  const aspect = view?.aspect ?? width / height;
  const camera = new THREE.PerspectiveCamera(34, aspect, 0.05, 50);
  const dir = new THREE.Vector3((spec.side ?? 1) * 0.3, 0, 1).normalize();
  const size = focus.getSize(new THREE.Vector3());
  const look = focus.getCenter(new THREE.Vector3());
  const fillF = view?.fill ?? spec.fill ?? 0.72;
  const vt = Math.tan(THREE.MathUtils.degToRad(34 / 2));
  const across = Math.abs(size.x * dir.z) + Math.abs(size.z * dir.x);
  const dist =
    Math.max(size.y / 2 / (vt * fillF), across / 2 / (vt * aspect * fillF)) +
    size.z / 2;
  camera.position.set(look.x + dir.x * dist, spec.eye, look.z + dir.z * dist);
  camera.lookAt(look.x, Math.min(look.y, spec.eye - 0.05), look.z);
  camera.updateProjectionMatrix();
  finish(scene, camera, width, height, 0.9);
}

export { BOOK_COLOURS };
