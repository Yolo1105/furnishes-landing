/**
 * Things in a room that are not for sale: books, a lamp, a laptop, a bed,
 * the desk someone already has. Each scene names them as not included.
 */
import * as THREE from "three";
import type { Box, Built } from "./build";
import { A, cyl, linen, maps, mat, prop, rbox, shadowed, steel } from "./core";

const M = 0.001;

export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Somebody's own furniture: oiled oak, so it reads apart from ours. */
const oak = new THREE.MeshStandardMaterial({
  color: "#c9a27a",
  map: maps.oak,
  roughness: 0.55,
});

export type Surface = {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z: number;
  clear: number;
};

/** Every horizontal board a thing can stand on, with the height free above it. */
export function surfaces(bs: Box[]): Surface[] {
  const flat = bs.filter(
    (p) =>
      (p.kind === "board" || p.kind === "panel") &&
      p.h <= 30 &&
      p.w >= 150 &&
      p.d >= 150,
  );
  return flat.map((p) => {
    const z = p.z + p.h;
    const above = flat
      .filter(
        (q) =>
          q.z >= z - 1 &&
          q.x < p.x + p.w - 1 &&
          q.x + q.w > p.x + 1 &&
          q.y < p.y + p.d - 1 &&
          q.y + q.d > p.y + 1,
      )
      .map((q) => q.z - z);
    return {
      x0: p.x,
      x1: p.x + p.w,
      y0: p.y,
      y1: p.y + p.d,
      z,
      clear: above.length ? Math.min(...above) : 2000,
    };
  });
}

export type Ctx = {
  scene: THREE.Scene;
  piece: Built;
  rand: () => number;
  at: (x: number, y: number, z: number) => THREE.Vector3;
  frame: (o: THREE.Object3D) => void;
  add: (o: THREE.Object3D) => void;
  surf: Surface[];
  boxes: Box[];
};
export const BOOK_COLOURS = [
  "#7a3b26",
  "#c2643c",
  "#8a8256",
  "#e9dcc3",
  "#4f5a63",
  "#c9a15a",
  "#a8492b",
  "#d8c6a6",
  "#5d4636",
];

export function books(
  ctx: Ctx,
  s: Surface,
  from: number,
  to: number,
  lean = true,
) {
  let x = from;
  const g = new THREE.Group();
  const maxH = Math.min(s.clear - 25, 260);
  while (x < to - 20) {
    const t = 18 + ctx.rand() * 26;
    const h = Math.max(120, maxH - ctx.rand() * 70);
    const d = Math.min(s.y1 - s.y0 - 40, 140 + ctx.rand() * 50);
    const colour = BOOK_COLOURS[Math.floor(ctx.rand() * BOOK_COLOURS.length)]!;
    const b = rbox(t * M, h * M, d * M, 0.002, mat(colour, 0.8));
    b.position.copy(ctx.at(x + t / 2, s.y0 + 20 + d / 2, s.z + h / 2));
    g.add(b);
    x += t + 1;
  }
  if (lean && to - x > 60) {
    const h = Math.min(maxH, 210);
    const b = rbox(26 * M, h * M, 150 * M, 0.002, mat(BOOK_COLOURS[1]!, 0.8));
    b.geometry.translate(0, (h * M) / 2, 0);
    b.position.copy(ctx.at(x + 12, s.y0 + 95, s.z));
    b.rotation.z = -0.32;
    g.add(b);
  }
  ctx.add(g);
}

/** A horizontal stack of books or boxes, lying flat. */
export function stack(
  ctx: Ctx,
  s: Surface,
  x: number,
  n: number,
  colours = BOOK_COLOURS,
) {
  let z = s.z;
  for (let i = 0; i < n; i++) {
    const h = 22 + ctx.rand() * 18;
    const w = 210 - i * 12 + ctx.rand() * 20;
    const b = rbox(
      w * M,
      h * M,
      160 * M,
      0.002,
      mat(colours[(i * 3 + 1) % colours.length]!, 0.8),
    );
    b.position.copy(ctx.at(x, s.y0 + 30 + 80, z + h / 2));
    b.rotation.y = (ctx.rand() - 0.5) * 0.12;
    ctx.add(b);
    z += h;
  }
  return z;
}

export function jar(
  ctx: Ctx,
  pos: THREE.Vector3,
  h: number,
  r: number,
  body: string,
) {
  const g = new THREE.Group();
  const b = cyl(r, r, h, mat(body, 0.45));
  b.position.y = h / 2;
  const lid = cyl(r * 0.96, r * 0.96, 0.018, mat("#b88a5a", 0.6));
  lid.position.y = h + 0.009;
  g.add(b, lid);
  g.position.copy(pos);
  ctx.add(g);
}

export function lamp(ctx: Ctx, pos: THREE.Vector3) {
  const g = new THREE.Group();
  const base = cyl(0.05, 0.065, 0.24, mat("#c96f45", 0.4));
  base.position.y = 0.12;
  const stem = cyl(0.006, 0.006, 0.08, mat("#3a2f28", 0.4, 0.6));
  stem.position.y = 0.28;
  const shadeMat = linen("#f3e6d2", 2);
  shadeMat.side = THREE.DoubleSide;
  shadeMat.emissive = new THREE.Color("#ffcf96");
  shadeMat.emissiveIntensity = 0.12;
  const shade = cyl(0.1, 0.15, 0.19, shadeMat, 48);
  (shade.geometry as THREE.CylinderGeometry).dispose();
  shade.geometry = new THREE.CylinderGeometry(0.1, 0.15, 0.19, 48, 1, true);
  shade.position.y = 0.38;
  g.add(base, stem, shade);
  g.position.copy(pos);
  ctx.frame(g);
}

export function mug(ctx: Ctx, pos: THREE.Vector3, colour = "#efe4d2") {
  const g = new THREE.Group();
  const b = cyl(0.04, 0.036, 0.09, mat(colour, 0.35));
  b.position.y = 0.045;
  const handle = shadowed(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.024, 0.006, 8, 16, Math.PI),
      mat(colour, 0.35),
    ),
  );
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(0.04, 0.045, 0);
  g.add(b, handle);
  g.position.copy(pos);
  ctx.add(g);
}

export function laptop(ctx: Ctx, pos: THREE.Vector3, ry = 0) {
  const g = new THREE.Group();
  const alu = mat("#b9b6b1", 0.35, 0.6);
  const base = rbox(0.31, 0.012, 0.215, 0.004, alu);
  base.position.y = 0.006;
  const lid = new THREE.Group();
  const shell = rbox(0.31, 0.215, 0.006, 0.004, alu);
  shell.position.y = 0.1075;
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.29, 0.19),
    mat("#26292c", 0.25),
  );
  glass.position.set(0, 0.1075, 0.0032);
  lid.add(shell, glass);
  lid.position.set(0, 0.012, -0.105);
  lid.rotation.x = -0.32;
  g.add(base, lid);
  g.position.copy(pos);
  g.rotation.y = ry;
  ctx.frame(g);
}

export function headphones(ctx: Ctx, tip: THREE.Vector3) {
  const g = new THREE.Group();
  const black = mat("#2b2724", 0.5);
  const band = shadowed(
    new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.009, 10, 40, Math.PI),
      black,
    ),
  );
  band.position.y = -0.085;
  band.rotation.z = 0;
  const cupL = cyl(0.042, 0.042, 0.03, black);
  cupL.rotation.z = Math.PI / 2;
  cupL.position.set(-0.088, -0.09, 0);
  const cupR = cupL.clone();
  cupR.position.x = 0.088;
  const pad = cyl(0.038, 0.038, 0.012, mat("#8a6a52", 0.8));
  pad.rotation.z = Math.PI / 2;
  pad.position.set(-0.072, -0.09, 0);
  const pad2 = pad.clone();
  pad2.position.x = 0.072;
  const holder = new THREE.Group();
  holder.add(band, cupL, cupR, pad, pad2);
  holder.rotation.x = Math.PI; // band over the hook, cups hanging down
  holder.position.y = -0.17;
  g.add(holder);
  g.position.copy(tip);
  g.rotation.y = Math.PI / 2;
  ctx.add(g);
}

export function desk(ctx: Ctx, x: number, z: number, w = 1.2, d = 0.6) {
  const g = new THREE.Group();
  const top = rbox(w, 0.024, d, 0.003, oak);
  top.position.set(0, 0.73, 0);
  g.add(top);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const leg = shadowed(
        new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 0.718, 0.03),
          mat("#1f1d1b", 0.5),
        ),
      );
      leg.position.set(sx * (w / 2 - 0.05), 0.359, sz * (d / 2 - 0.05));
      g.add(leg);
    }
  g.position.set(x, 0, z);
  ctx.frame(g);
  return g;
}

export function bed(ctx: Ctx, x: number, z = 0, headboard = true) {
  const g = new THREE.Group();
  const W = 1.6;
  const L = 2.05;
  const head = rbox(W + 0.04, 0.98, 0.022, 0.004, oak);
  head.position.set(0, 0.49, 0.011);
  if (headboard) g.add(head);
  const frameBox = rbox(W, 0.26, L, 0.01, oak);
  frameBox.position.set(0, 0.17, L / 2 + 0.03);
  g.add(frameBox);
  const mattress = rbox(W - 0.04, 0.2, L - 0.06, 0.05, linen("#f5efe6"));
  mattress.position.set(0, 0.4, L / 2 + 0.03);
  g.add(mattress);
  const duvet = rbox(W + 0.06, 0.09, L * 0.72, 0.04, linen("#efe2cf"));
  duvet.position.set(0, 0.53, L * 0.64);
  g.add(duvet);
  const throwB = rbox(W + 0.1, 0.03, 0.42, 0.012, linen("#c45a2c", 4));
  throwB.position.set(0, 0.58, L * 0.86);
  g.add(throwB);
  for (const px of [-0.38, 0.38]) {
    const pillow = rbox(0.62, 0.15, 0.4, 0.07, linen("#f8f2ea"));
    pillow.position.set(px, 0.56, 0.3);
    pillow.rotation.x = -0.35;
    g.add(pillow);
  }
  const cushion = rbox(0.45, 0.32, 0.12, 0.05, linen("#d9a27a"));
  cushion.position.set(0.15, 0.68, 0.45);
  cushion.rotation.x = -0.25;
  g.add(cushion);
  g.position.set(x, 0, z);
  ctx.add(g);
  return g;
}

export function rug(
  ctx: Ctx,
  x: number,
  z: number,
  w: number,
  d: number,
  colour: string,
) {
  const r = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.008, d),
    linen(colour, 6),
  );
  r.position.set(x, 0.004, z);
  r.receiveShadow = true;
  ctx.add(r);
}

export function tv(ctx: Ctx, pos: THREE.Vector3) {
  const g = new THREE.Group();
  const screen = rbox(0.97, 0.57, 0.03, 0.006, mat("#26272a", 0.3));
  screen.position.y = 0.33;
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.55),
    new THREE.MeshStandardMaterial({
      color: "#2b2d31",
      roughness: 0.08,
      metalness: 0.4,
    }),
  );
  glass.position.set(0, 0.33, 0.0152);
  const stand = rbox(0.3, 0.012, 0.18, 0.004, mat("#2a2a2a", 0.4, 0.5));
  stand.position.y = 0.006;
  const neck = rbox(0.05, 0.05, 0.02, 0.004, mat("#2a2a2a", 0.4, 0.5));
  neck.position.set(0, 0.03, -0.02);
  g.add(screen, glass, stand, neck);
  g.position.copy(pos);
  ctx.frame(g);
}

export function towel(ctx: Ctx, pos: THREE.Vector3) {
  // a striped cotton towel folded over the side rail
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const g2 = c.getContext("2d")!;
  g2.fillStyle = "#f2e9dc";
  g2.fillRect(0, 0, 64, 256);
  g2.fillStyle = "#c4542a";
  for (const y of [30, 46, 200, 216]) g2.fillRect(0, y, 64, 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
  const g = new THREE.Group();
  for (const side of [-1, 1]) {
    const leaf = rbox(0.006, 0.3, 0.22, 0.002, m);
    leaf.position.set(side * 0.012, -0.15, 0);
    g.add(leaf);
  }
  g.position.copy(pos);
  ctx.add(g);
}

export function ball(ctx: Ctx, pos: THREE.Vector3, r: number, colour: string) {
  const b = shadowed(
    new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), mat(colour, 0.5)),
  );
  b.position.copy(pos).add(new THREE.Vector3(0, r, 0));
  ctx.add(b);
}

export function blocks(ctx: Ctx, s: Surface, x: number) {
  const colours = ["#c4542a", "#e9b04a", "#8a9a6a", "#e7d8bf"];
  [0, 1, 2, 3, 4].forEach((i) => {
    const size = 0.06;
    const b = rbox(size, size, size, 0.004, mat(colours[i % 4]!, 0.6));
    const col = i < 3 ? i : i - 3;
    const row = i < 3 ? 0 : 1;
    b.position.copy(
      ctx.at(x + col * 66 + row * 33, s.y0 + 120, s.z + 30 + row * 60),
    );
    b.rotation.y = (ctx.rand() - 0.5) * 0.3;
    ctx.add(b);
  });
}

export function shoes(ctx: Ctx, s: Surface) {
  const leather = mat("#3b2c25", 0.5);
  const canvasShoe = mat("#ede6da", 0.85);
  for (const [x0, m] of [
    [s.x0 + 50, leather],
    [s.x0 + 310, canvasShoe],
  ] as const)
    for (const k of [0, 1]) {
      const shoe = rbox(0.09, 0.08, 0.26, 0.03, m);
      shoe.position.copy(
        ctx.at(x0 + 50 + k * 100, (s.y0 + s.y1) / 2 + 5, s.z + 40),
      );
      ctx.add(shoe);
    }
}

export function keys(ctx: Ctx, trayPart: Box) {
  const brass = mat("#b8955a", 0.35, 0.8);
  const z = trayPart.z + 12;
  const ring = shadowed(
    new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0025, 8, 24), brass),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(ctx.at(trayPart.x + 80, trayPart.y + 80, z));
  const key = shadowed(
    new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.016), brass),
  );
  key.position.copy(ctx.at(trayPart.x + 120, trayPart.y + 75, z));
  key.rotation.y = 0.4;
  ctx.add(ring);
  ctx.add(key);
}

export async function door(ctx: Ctx, x: number) {
  const paint = mat("#f6f1ea", 0.55);
  const leaf = rbox(0.86, 2.04, 0.04, 0.004, paint);
  leaf.position.set(x, 1.02, 0.02);
  const parts3: THREE.Mesh[] = [leaf];
  const jamb = (dx: number) => {
    const j = rbox(0.06, 2.1, 0.03, 0.003, paint);
    j.position.set(x + dx, 1.05, 0.016);
    return j;
  };
  parts3.push(jamb(-0.46), jamb(0.46));
  const head = rbox(0.98, 0.06, 0.03, 0.003, paint);
  head.position.set(x, 2.1, 0.016);
  const lever = rbox(0.13, 0.018, 0.02, 0.006, steel);
  lever.position.set(x + 0.3, 1.02, 0.055);
  parts3.push(head, lever);
  for (const m of parts3) ctx.add(m);
}

export async function glb(
  ctx: Ctx,
  name: string,
  pos: THREE.Vector3,
  ry = 0,
  scale = 1,
  inFrame = false,
) {
  const o = await prop(`${A}models/${name}.glb`, pos, ry, scale);
  if (o) (inFrame ? ctx.frame : ctx.add)(o);
  return o;
}

export const findBox = (bs: Box[], id: string) => bs.find((p) => p.id === id);
