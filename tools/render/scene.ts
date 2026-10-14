/**
 * Furnishes product renderer. Runs in a browser (headless Chromium, driven
 * by tools/render/render.mjs). Launch pieces are drawn from the hero model
 * spec v0 (src/data/hero-model.json); second-batch pieces from their early
 * recipes. Materials follow the decisions: white matte faces, birch edges,
 * steel bases, accessories in the accent colour (D10, D15). The widened
 * base is always drawn (D13).
 *
 * Jobs:
 * - hero:    a launch piece in the studio (a pack, kits, or the bare frame)
 * - product: a second-batch piece in the studio
 * - room:    a product at eye level in a room doing its job
 * - step:    one assembly step of a launch piece, on a fixed camera
 * - parts:   a launch piece pulled apart, with where each part lands
 * - detail:  a close view (the birch edge, or the widened base)
 */
import * as THREE from "three";
import { heroSteps } from "@/data/hero";
import { products } from "@/data/products";
import { recipes } from "@/data/recipes";
import type { HeroId, KitId } from "@/data/types";
import {
  heroKey,
  heroVariants,
  STUDIO,
  STEP,
  SCENE,
  SQUARE,
} from "@/lib/renders";
import {
  explodeOffsets,
  hero,
  heroModelParts,
  recipe,
  type Built,
} from "./build";
import {
  M,
  STAGE_IN,
  envTex,
  finish,
  frame,
  keyLight,
  renderer,
  setup,
  stageScene,
} from "./core";
import { room } from "./rooms";

export type Job = {
  kind: "hero" | "product" | "room" | "step" | "parts" | "detail";
  id: string;
  design?: HeroId;
  kits?: KitId[];
  only?: string[];
  step?: number;
  out: string;
  width: number;
  height: number;
  tight?: boolean;
};

const FRAME_PARTS = [
  "BASE",
  "CW",
  "SL",
  "SR",
  "BEAM",
  "PNL1",
  "PNL2",
  "PNL3",
  "TOP",
];

/** One camera for every picture of the function face (frame, both packs). */
function bodyBox(design: HeroId) {
  const b = hero({ design, only: new Set(FRAME_PARTS) });
  return new THREE.Box3().setFromObject(b.group);
}

const VIEW = new THREE.Vector3(-0.55, 0.3, 1);

function studioShot(built: Built, box: THREE.Box3, job: Job, fill = 0.8) {
  const scene = stageScene(box);
  scene.add(built.group);
  const camera = new THREE.PerspectiveCamera(
    24,
    job.width / job.height,
    0.05,
    50,
  );
  frame(camera, box, VIEW.clone(), fill);
  finish(scene, camera, job.width, job.height, 1.4);
  return camera;
}

function heroShot(job: Job) {
  const design = job.design!;
  const kits = job.kits ?? [];
  const only = job.only ? new Set(job.only) : undefined;
  const built = hero({ design, kits, ...(only ? { only } : {}) });
  // the frame and both packs share a camera; a desk top widens the view
  const box = kits.includes("K-D1")
    ? new THREE.Box3().setFromObject(built.group)
    : bodyBox(design);
  studioShot(built, box, job);
}

function productShot(job: Job) {
  const p = products.find((x) => x.id === job.id)!;
  const built = recipe(recipes[p.recipe!], {
    doors: p.id === "device-cabinet",
  });
  const box = new THREE.Box3().setFromObject(built.group);
  studioShot(built, box, job);
}

function stepShot(job: Job) {
  const design = job.design!;
  const steps = heroSteps(design);
  const n = job.step!;
  const done = new Set(steps.filter((s) => s.n <= n).flatMap((s) => s.parts));
  const now = steps.find((s) => s.n === n)!;
  const offsets = new Map<string, [number, number, number]>();
  for (const id of now.parts)
    offsets.set(id, now.from.map((v) => v * 0.42) as [number, number, number]);
  const built = hero({
    design,
    only: done,
    offsets,
    kits: design === "desk" ? ["K-D2"] : [],
  });
  // fixed camera: the finished piece, with room above for parts coming in
  const full = new THREE.Box3().setFromObject(
    hero({ design, kits: design === "desk" ? ["K-D2"] : [] }).group,
  );
  full.max.y += 0.32;
  full.min.x -= 0.12;
  full.max.x += 0.12;
  studioShot(built, full, job, 0.86);
}

function partsShot(job: Job) {
  const design = job.design!;
  const offsets = explodeOffsets(design);
  const built = hero({ design, offsets });
  const box = new THREE.Box3().setFromObject(built.group);
  const camera = studioShot(built, box, job, 0.84);
  // where each kind of part lands: the first part of each name
  const seen = new Map<string, { u: number; v: number }>();
  const names = new Set<string>();
  for (const p of heroModelParts(design)) {
    if (names.has(p.name)) continue;
    names.add(p.name);
    const o = offsets.get(p.id) ?? [0, 0, 0];
    const w = built.at(
      p.pos[0] + o[0] + p.size[0] / 2,
      p.pos[1] + o[1] + p.size[1] / 2,
      p.pos[2] + o[2] + p.size[2] / 2,
    );
    const s = w.project(camera);
    seen.set(p.id, {
      u: +((s.x + 1) / 2).toFixed(4),
      v: +((1 - s.y) / 2).toFixed(4),
    });
  }
  return Object.fromEntries(seen);
}

function detailShot(job: Job) {
  const built = hero({ design: "entry" });
  const scene = new THREE.Scene();
  scene.background = STAGE_IN;
  scene.environment = envTex;
  scene.environmentIntensity = 0.6;
  scene.add(built.group);
  keyLight(scene, new THREE.Vector3(-1.5, 3, 2), 2, 2.4);
  const fillL = new THREE.DirectionalLight("#fff0e2", 0.5);
  fillL.position.set(2, 1, 2);
  scene.add(fillL);
  if (job.id === "base") {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.ShadowMaterial({ color: "#4a2a18", opacity: 0.3 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
  }
  const camera = new THREE.PerspectiveCamera(
    24,
    job.width / job.height,
    0.01,
    20,
  );
  if (job.id === "edge") {
    // top-left front corner: white faces, birch edges, a hook
    const c = built.at(0, 0, 1278);
    camera.position.set(c.x - 0.32, c.y + 0.24, c.z + 0.62);
    camera.lookAt(c.x + 0.2, c.y - 0.22, c.z - 0.2);
  } else {
    // front-left corner of the widened base: rail, foot, counterweight
    const c = built.at(0, -200, 60);
    camera.position.set(c.x - 0.5, c.y + 0.32, c.z + 0.75);
    camera.lookAt(c.x + 0.22, c.y - 0.02, c.z - 0.25);
  }
  camera.updateProjectionMatrix();
  finish(scene, camera, job.width, job.height, 0.8);
}

/* ---------- jobs ---------- */

declare global {
  interface Window {
    furnishesJobs: () => Job[];
    furnishesRender: (job: Job) => Promise<{ url: string; meta?: unknown }>;
  }
}

window.furnishesJobs = () => {
  const jobs: Job[] = [];
  for (const v of heroVariants)
    jobs.push({
      kind: "hero",
      id: v.design,
      design: v.design,
      kits: v.kits,
      out: `hero/${heroKey(v.design, v.kits)}`,
      width: STUDIO.w,
      height: STUDIO.h,
    });
  jobs.push({
    kind: "hero",
    id: "frame",
    design: "entry",
    only: FRAME_PARTS,
    out: "hero/frame",
    width: STUDIO.w,
    height: STUDIO.h,
  });
  for (const p of products.filter((x) => !x.hero))
    jobs.push({
      kind: "product",
      id: p.id,
      out: `studio/${p.id}`,
      width: STUDIO.w,
      height: STUDIO.h,
    });
  for (const p of products)
    jobs.push({
      kind: "room",
      id: p.id,
      out: `scene/${p.id}`,
      width: SCENE.w,
      height: SCENE.h,
    });
  jobs.push({
    kind: "room",
    id: "entry",
    out: "scene/hero-entry",
    width: 1800,
    height: 1600,
  });
  jobs.push({
    kind: "room",
    id: "entry",
    out: "scene/hero-entry-phone",
    width: 1170,
    height: 1170,
    tight: true,
  });
  for (const design of ["entry", "desk", "bedside"] as HeroId[]) {
    jobs.push({
      kind: "parts",
      id: design,
      design,
      out: `parts/${design}`,
      width: SQUARE.w,
      height: SQUARE.h,
    });
    for (const s of heroSteps(design))
      jobs.push({
        kind: "step",
        id: design,
        design,
        step: s.n,
        out: `steps/${design}-${String(s.n).padStart(2, "0")}`,
        width: STEP.w,
        height: STEP.h,
      });
  }
  jobs.push({
    kind: "detail",
    id: "edge",
    out: "detail/edge",
    width: SQUARE.w,
    height: SQUARE.h,
  });
  jobs.push({
    kind: "detail",
    id: "base",
    out: "detail/base",
    width: SQUARE.w,
    height: SQUARE.h,
  });
  return jobs;
};

let ready: Promise<void> | null = null;
window.furnishesRender = async (job: Job) => {
  ready ??= setup();
  await ready;
  let meta: unknown;
  if (job.kind === "hero") heroShot(job);
  else if (job.kind === "product") productShot(job);
  else if (job.kind === "room")
    await room(
      job.id,
      job.width,
      job.height,
      job.tight
        ? { aspect: job.width / job.height, tight: true, fill: 0.8 }
        : undefined,
    );
  else if (job.kind === "step") stepShot(job);
  else if (job.kind === "parts") meta = partsShot(job);
  else detailShot(job);
  void M;
  const gl = renderer.getContext();
  if (gl.isContextLost()) throw new Error("WebGL context lost");
  const url = renderer.domElement.toDataURL("image/png");
  if (url.length < 100)
    throw new Error(
      `empty canvas ${renderer.domElement.width}x${renderer.domElement.height}`,
    );
  return { url, meta };
};
