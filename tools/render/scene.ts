/**
 * Furnishes product renderer. Runs in a browser (headless Chromium, driven by
 * tools/render/render.mjs) and draws pieces straight from the site's part
 * model, so every picture matches the drawings and parts lists.
 *
 * Jobs:
 * - studio: one configuration, three-quarter view on a chalk sweep
 * - room:   the entry organiser at eye level beside a front door
 * - detail: a close view of a corner (veneer, plywood edge, hole grid, hook)
 * - front:  straight-on studio view (for comparisons)
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { N8AOPass } from "n8ao";
import { designs } from "@/data/designs";
import { recipes } from "@/data/recipes";
import type { Configuration, Recipe, RecipeId } from "@/data/types";
import { parts, type Part } from "@/lib/parts";
import { renderKey, renderedRecipes, variants, STUDIO } from "@/lib/renders";

type Options = Pick<Configuration, "finish" | "front" | "accessories">;
export type Job = {
  kind: "studio" | "room" | "detail" | "front";
  recipe: RecipeId;
  config: Options;
  out: string;
  width: number;
  height: number;
};

const A = "/assets/";
const CHALK = new THREE.Color("#f2efea");
const tl = new THREE.TextureLoader();

/* ---------- textures ---------- */

function tex(url: string, srgb: boolean) {
  const t = tl.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

const ply = {
  map: tex(`${A}pbr/plywood/Diffuse.webp`, true),
  rough: tex(`${A}pbr/plywood/Rough.webp`, false),
  normal: tex(`${A}pbr/plywood/nor_gl.webp`, false),
};

/** Birch plywood edge: 13 plies across 18 mm, with thin glue lines. */
function edgeTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 208;
  const g = c.getContext("2d")!;
  const plies = 13;
  const h = c.height / plies;
  for (let i = 0; i < plies; i++) {
    const light = i % 2 === 0;
    g.fillStyle = light ? "#ead9ba" : "#dcc49c";
    g.fillRect(0, i * h, c.width, h);
    // fibre streaks along each ply
    for (let k = 0; k < 40; k++) {
      g.fillStyle = `rgba(150,110,60,${0.04 + Math.random() * 0.05})`;
      g.fillRect(
        Math.random() * c.width,
        i * h + Math.random() * h,
        20 + Math.random() * 90,
        1,
      );
    }
    g.fillStyle = "rgba(120,86,46,0.55)";
    g.fillRect(0, i * h, c.width, 1.4);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const EDGE = edgeTexture();

/** The working face's hole grid: 8 mm holes on a 40 mm grid (as in the drawings). */
function holesTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 128, 128);
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 13);
  grad.addColorStop(0, "rgba(28,20,12,0.95)");
  grad.addColorStop(0.7, "rgba(45,32,18,0.9)");
  grad.addColorStop(1, "rgba(60,42,24,0)");
  g.fillStyle = grad;
  g.beginPath();
  g.arc(64, 64, 13, 0, Math.PI * 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const HOLES = holesTexture();

/* ---------- materials ---------- */

const veneer = new THREE.MeshPhysicalMaterial({
  color: "#fff6ea",
  map: ply.map,
  roughnessMap: ply.rough,
  normalMap: ply.normal,
  normalScale: new THREE.Vector2(0.35, 0.35),
  roughness: 0.62,
  sheen: 0.15,
});
const veneerBase = veneer.clone();
veneerBase.color = new THREE.Color("#d9c0a0");
const edgeMat = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  map: EDGE,
  roughness: 0.78,
});
const orange = new THREE.MeshPhysicalMaterial({
  color: "#e2622b",
  roughness: 0.42,
  clearcoat: 0.25,
  clearcoatRoughness: 0.5,
});
const steel = new THREE.MeshStandardMaterial({
  color: "#2b2a29",
  roughness: 0.38,
  metalness: 0.65,
});
const rubber = new THREE.MeshStandardMaterial({
  color: "#2a2725",
  roughness: 0.85,
});
const holesMat = new THREE.MeshStandardMaterial({
  map: HOLES,
  transparent: true,
  depthWrite: false,
  roughness: 0.9,
  polygonOffset: true,
  polygonOffsetFactor: -2,
});

/* ---------- geometry ---------- */

const M = 0.001; // mm to metres

/**
 * A plywood box: veneer on the two broad faces, layered edge on the four
 * thin faces, with texture coordinates in real size so grain and plies keep
 * their scale on every panel.
 */
function plyBox(
  w: number,
  h: number,
  d: number,
  face: THREE.Material,
  back: THREE.Material = face,
) {
  const g = new THREE.BoxGeometry(w * M, h * M, d * M);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // BoxGeometry faces in order: +x, -x, +y, -y, +z, -z; (u, v) spans per face:
  const spans: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  const thin = Math.min(w, h, d);
  const broadFace = (i: number) =>
    (thin === w && i < 2) ||
    (thin === h && (i === 2 || i === 3)) ||
    (thin === d && i >= 4);
  const TILE = 1250; // mm one veneer tile covers
  for (let f = 0; f < 6; f++) {
    const [us, vs] = spans[f]!;
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      const u = uv.getX(i);
      const v = uv.getY(i);
      if (broadFace(f)) {
        // grain runs along the longer side of the face
        if (us >= vs) uv.setXY(i, (u * us) / TILE, (v * vs) / TILE);
        else uv.setXY(i, (v * vs) / TILE, (u * us) / TILE);
      } else if (Math.abs(vs - thin) < 0.5) uv.setXY(i, (u * us) / 300, v);
      else uv.setXY(i, (v * vs) / 300, u);
    }
  }
  uv.needsUpdate = true;
  const mats = [0, 1, 2, 3, 4, 5].map((f) => {
    if (!broadFace(f)) return edgeMat;
    // the face nearer the front (+z, or +x/+y for side and horizontal panels)
    return f === 4 || f === 0 || f === 2 ? face : back;
  });
  const mesh = new THREE.Mesh(g, mats);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/** Position a mesh at a part's box (part coordinates: x across, y into depth, z up). */
function place(o: THREE.Object3D, p: Part) {
  o.position.set(
    (p.x + p.w / 2) * M,
    (p.z + p.h / 2) * M,
    -(p.y + p.d / 2) * M,
  );
  return o;
}

function holesOn(p: Part, side: 1 | -1) {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(p.w * M, p.h * M),
    holesMat,
  );
  const t = HOLES.clone();
  t.repeat.set(p.w / 40, p.h / 40);
  t.offset.set(0.5, 0.5);
  t.needsUpdate = true;
  plane.material = holesMat.clone();
  (plane.material as THREE.MeshStandardMaterial).map = t;
  const zFront = -p.y * M; // front face of the panel (toward the viewer)
  const zBack = -(p.y + p.d) * M;
  plane.position.set(
    (p.x + p.w / 2) * M,
    (p.z + p.h / 2) * M,
    side === 1 ? zFront + 0.0004 : zBack - 0.0004,
  );
  if (side === -1) plane.rotation.y = Math.PI;
  plane.receiveShadow = true;
  return plane;
}

function hook(p: Part, big: boolean) {
  // one bent steel rod: out from the working face, then a short upturn
  const len = p.d * M;
  const h = big ? 0.03 : 0.022;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, h * 0.4, -len / 2),
    new THREE.Vector3(0, 0, -len / 2 + 0.01),
    new THREE.Vector3(0, -0.004, len / 2 - 0.012),
    new THREE.Vector3(0, 0.004, len / 2 - 0.002),
    new THREE.Vector3(0, h, len / 2),
  ]);
  const rod = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 40, big ? 0.0045 : 0.0038, 10),
    steel,
  );
  const plate = new THREE.Mesh(
    new RoundedBoxGeometry(0.016, big ? 0.05 : 0.04, 0.005, 2, 0.0015),
    steel,
  );
  plate.position.set(0, 0.004, -len / 2 + 0.0025);
  const g = new THREE.Group();
  g.add(rod, plate);
  g.traverse((o) => {
    o.castShadow = true;
  });
  return place(g, p);
}

function tray(p: Part) {
  const g = new THREE.Group();
  const t = 9;
  const base = plyBox(p.w, t, p.d, veneer);
  base.position.y = (-p.h / 2 + t / 2) * M;
  g.add(base);
  for (const [dx, dz, w, d] of [
    [0, -(p.d / 2 - t / 2), p.w, t],
    [0, p.d / 2 - t / 2, p.w, t],
    [-(p.w / 2 - t / 2), 0, t, p.d],
    [p.w / 2 - t / 2, 0, t, p.d],
  ] as const) {
    const wall = plyBox(w, p.h, d, veneer);
    wall.position.set(dx * M, 0, dz * M);
    g.add(wall);
  }
  return place(g, p);
}

function rail(p: Part, along: "x" | "z") {
  const len = (along === "x" ? p.w : p.d) * M;
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, len, 16),
    steel,
  );
  tube.rotation.set(
    along === "z" ? Math.PI / 2 : 0,
    0,
    along === "x" ? Math.PI / 2 : 0,
  );
  tube.castShadow = true;
  return place(tube, p);
}

function caster(p: Part) {
  const g = new THREE.Group();
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.02, 20),
    rubber,
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position.y = (-p.h * M) / 2 + 0.024;
  const fork = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.03, 0.03), steel);
  fork.position.y = (p.h * M) / 2 - 0.015;
  g.add(wheel, fork);
  g.traverse((o) => {
    o.castShadow = true;
  });
  return place(g, p);
}

/** One configured piece, centred on x and z, standing on y = 0. */
export function piece(r: Recipe, c: Options) {
  const g = new THREE.Group();
  const face = c.finish === "orange" ? orange : veneer;
  for (const p of parts(r, c)) {
    if (p.kind === "caster") g.add(caster(p));
    else if (p.kind === "hardware") {
      if (p.partId === "hinge") {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(p.w * M, p.h * M, p.d * M),
          steel,
        );
        g.add(place(m, p));
      }
      // connectors sit inside the panels; they are not drawn
    } else if (p.kind === "accessory") {
      if (p.partId === "coat-hook") g.add(hook(p, false));
      else if (p.partId === "headphone-hook") g.add(hook(p, true));
      else if (p.partId === "key-tray") g.add(tray(p));
      else if (p.partId === "kitchen-rail") g.add(rail(p, "z"));
      else if (p.partId === "clothes-rail") g.add(rail(p, "x"));
    } else if (p.kind === "base") {
      g.add(place(plyBox(p.w, p.h, p.d, veneerBase), p));
    } else if (p.face) {
      const both = r.shape === "shelf";
      g.add(place(plyBox(p.w, p.h, p.d, face, both ? face : veneer), p));
      g.add(holesOn(p, 1));
      if (both) g.add(holesOn(p, -1));
    } else if (p.kind === "door") {
      const door = place(plyBox(p.w, p.h, p.d, veneer), p);
      g.add(door);
      const pull = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.016, 0.004),
        rubber,
      );
      pull.position.set(
        door.position.x,
        (p.z + p.h - 40) * M,
        -p.y * M + 0.002,
      );
      g.add(pull);
    } else {
      g.add(place(plyBox(p.w, p.h, p.d, veneer), p));
    }
  }
  const box = new THREE.Box3().setFromObject(g);
  const centre = box.getCenter(new THREE.Vector3());
  g.position.set(-centre.x, -box.min.y, -centre.z);
  return g;
}

/* ---------- stage ---------- */

let renderer: THREE.WebGLRenderer;
let envTex: THREE.Texture;
const gltf = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath(`${A}draco/`);
gltf.setDRACOLoader(draco);

async function setup() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);
  const hdr = await new HDRLoader().loadAsync(
    `${A}brown_photostudio_02_1k.hdr`,
  );
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  envTex = pm.fromEquirectangular(hdr).texture;
  await Promise.all(
    [ply.map, ply.rough, ply.normal].map(
      (t) =>
        new Promise<void>((res) =>
          t.image ? res() : (t.onUpdate = () => res()),
        ),
    ),
  );
}

function keyLight(
  scene: THREE.Scene,
  pos: THREE.Vector3,
  size: number,
  intensity = 2.2,
) {
  const key = new THREE.DirectionalLight("#fff4e6", intensity);
  key.position.copy(pos);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.01;
  const s = key.shadow.camera;
  s.left = s.bottom = -size;
  s.right = s.top = size;
  s.near = 0.1;
  s.far = 30;
  scene.add(key);
  return key;
}

function finish(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  w: number,
  h: number,
  ao = 1,
) {
  renderer.setSize(w, h, false);
  const composer = new EffectComposer(renderer);
  const aoPass = new N8AOPass(scene, camera, w, h);
  aoPass.configuration.aoRadius = 0.35;
  aoPass.configuration.distanceFalloff = 0.6;
  aoPass.configuration.intensity = 2.2 * ao;
  aoPass.configuration.halfRes = false;
  aoPass.configuration.aoSamples = 16;
  aoPass.configuration.denoiseRadius = 8;
  aoPass.configuration.gammaCorrection = false;
  composer.addPass(aoPass);
  composer.addPass(new OutputPass());
  composer.render();
  composer.render();
}

/** Fit a camera on a direction so the box fills `fill` of the frame height. */
function frame(
  camera: THREE.PerspectiveCamera,
  box: THREE.Box3,
  dir: THREE.Vector3,
  fill: number,
) {
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const radius = Math.max(
    size.y * 0.62,
    (size.x * 0.5) / camera.aspect + size.z * 0.25,
    0.25,
  );
  const dist =
    radius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / fill;
  camera.position.copy(centre).addScaledVector(dir.normalize(), dist);
  camera.lookAt(centre);
  camera.updateProjectionMatrix();
}

function studio(job: Job, straight = false) {
  const scene = new THREE.Scene();
  scene.background = CHALK;
  scene.environment = envTex;
  scene.environmentIntensity = 0.55;
  const p = piece(recipes[job.recipe], job.config);
  scene.add(p);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ color: "#3a2a1c", opacity: 0.34 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const box = new THREE.Box3().setFromObject(p);
  keyLight(
    scene,
    new THREE.Vector3(-2.6, 3.2, 2.4),
    Math.max(2, box.getSize(new THREE.Vector3()).length()),
  );
  const fill = new THREE.DirectionalLight("#eef3ff", 0.5);
  fill.position.set(3, 1.5, 2);
  scene.add(fill);
  const camera = new THREE.PerspectiveCamera(
    24,
    job.width / job.height,
    0.05,
    50,
  );
  const dir = straight
    ? new THREE.Vector3(0, 0.08, 1)
    : new THREE.Vector3(-0.55, 0.32, 1);
  frame(camera, box, dir, 0.8);
  finish(scene, camera, job.width, job.height, 1.5);
}

/** Part coordinates (mm: x across, y into depth, z up) to world, for a placed piece. */
function toWorld(g: THREE.Object3D, x: number, y: number, z: number) {
  return new THREE.Vector3(
    g.position.x + x * M,
    g.position.y + z * M,
    g.position.z - y * M,
  );
}

async function prop(url: string, pos: THREE.Vector3, ry = 0, scale = 1) {
  try {
    const o = (await gltf.loadAsync(url)).scene;
    o.position.copy(pos);
    o.rotation.y = ry;
    o.scale.setScalar(scale);
    o.traverse((m) => {
      m.castShadow = m.receiveShadow = true;
    });
    return o;
  } catch (e) {
    console.error("prop failed", url, String(e));
    return null;
  }
}

async function room(job: Job) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#ece6dd");
  scene.environment = envTex;
  scene.environmentIntensity = 0.38;
  const wallNormal = tex(`${A}pbr/plastered_wall/nor_gl.webp`, false);
  wallNormal.repeat.set(2.5, 1.4);
  const plaster = new THREE.MeshStandardMaterial({
    color: "#f1ebe2",
    normalMap: wallNormal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.94,
  });
  const floorMap = tex(`${A}pbr/laminate_floor_02/Diffuse.webp`, true);
  const floorRough = tex(`${A}pbr/laminate_floor_02/Rough.webp`, false);
  for (const t of [floorMap, floorRough]) t.repeat.set(2.2, 2.2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: "#fbf2e6",
    map: floorMap,
    roughnessMap: floorRough,
    roughness: 0.6,
  });
  const paint = new THREE.MeshStandardMaterial({
    color: "#f8f6f2",
    roughness: 0.55,
  });
  const wallZ = 0;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(7, 3), plaster);
  back.position.set(0, 1.5, wallZ);
  back.receiveShadow = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 6), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 3);
  floor.receiveShadow = true;
  scene.add(back, floor);
  const skirting = new THREE.Mesh(new THREE.BoxGeometry(7, 0.08, 0.014), paint);
  skirting.position.set(0, 0.04, wallZ + 0.007);
  skirting.castShadow = skirting.receiveShadow = true;
  scene.add(skirting);

  // the front door, in the same wall to the left: frame, closed leaf, lever
  const doorX = -1.05;
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.86, 2.04, 0.04), paint);
  leaf.position.set(doorX, 1.02, wallZ + 0.01);
  const frameW = 0.06;
  const jambL = new THREE.Mesh(new THREE.BoxGeometry(frameW, 2.1, 0.03), paint);
  jambL.position.set(doorX - 0.46, 1.05, wallZ + 0.016);
  const jambR = jambL.clone();
  jambR.position.x = doorX + 0.46;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.98, frameW, 0.03), paint);
  head.position.set(doorX, 2.1, wallZ + 0.016);
  const lever = new THREE.Mesh(
    new RoundedBoxGeometry(0.13, 0.018, 0.02, 2, 0.006),
    steel,
  );
  lever.position.set(doorX + 0.3, 1.02, wallZ + 0.05);
  for (const m of [leaf, jambL, jambR, head, lever]) {
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  }

  // the piece, against the wall beside the door
  const r = recipes[job.recipe];
  const p = piece(r, job.config);
  p.position.x += 0.05;
  p.position.z += wallZ + 0.03 + (r.size.d * M) / 2 + 0.012;
  scene.add(p);
  // part coordinates of the placed piece: origin at its front-left-bottom corner
  const origin = new THREE.Object3D();
  const pb = new THREE.Box3().setFromObject(p);
  origin.position.set(pb.min.x + 0.012, 0, pb.max.z - 0.012);

  // things in use, not included: two pairs of shoes on the shoe shelf, keys in the tray
  const leather = new THREE.MeshStandardMaterial({
    color: "#3b302b",
    roughness: 0.55,
  });
  const canvasShoe = new THREE.MeshStandardMaterial({
    color: "#ece8e1",
    roughness: 0.85,
  });
  const shelfTop = 30 + 240 + 18;
  for (const [x0, mat] of [
    [70, leather],
    [330, canvasShoe],
  ] as const)
    for (const k of [0, 1]) {
      const shoe = new THREE.Mesh(
        new RoundedBoxGeometry(0.09, 0.08, 0.26, 4, 0.03),
        mat,
      );
      shoe.position.copy(
        toWorld(origin, x0 + 50 + k * 100, 175, shelfTop + 40),
      );
      shoe.castShadow = shoe.receiveShadow = true;
      scene.add(shoe);
    }
  if (job.config.accessories.includes("key-tray")) {
    const brass = new THREE.MeshStandardMaterial({
      color: "#b8955a",
      roughness: 0.35,
      metalness: 0.8,
    });
    const z = 30 + 1200 * 0.65 - 150 + 12;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.016, 0.0025, 8, 24),
      brass,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(toWorld(origin, 260, 270, z));
    const key = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.004, 0.016),
      brass,
    );
    key.position.copy(toWorld(origin, 300, 265, z));
    key.rotation.y = 0.4;
    for (const m of [ring, key]) {
      m.castShadow = true;
      scene.add(m);
    }
  }

  // the chair that used to hold the coats, empty again; a plant by the wall
  const chair = await prop(
    `${A}models/painted_wooden_chair_02.glb`,
    new THREE.Vector3(1.05, 0, 0.38),
    -0.35,
  );
  if (chair) scene.add(chair);
  const plant = await prop(
    `${A}models/potted_plant_04.glb`,
    new THREE.Vector3(1.75, 0, 0.25),
    0.4,
  );
  if (plant) scene.add(plant);

  // daylight from a window to the right, and a soft fill from the room
  const sun = keyLight(scene, new THREE.Vector3(3.5, 2.6, 3.2), 3.2, 2.8);
  sun.color = new THREE.Color("#ffefd8");
  sun.target.position.set(0, 0.6, 0);
  scene.add(sun.target);
  const fillL = new THREE.DirectionalLight("#e7ecfa", 0.4);
  fillL.position.set(-3, 2, 4);
  scene.add(fillL);

  const camera = new THREE.PerspectiveCamera(
    34,
    job.width / job.height,
    0.05,
    50,
  );
  camera.position.set(0.5, 1.3, 3.35);
  camera.lookAt(0.22, 0.72, 0);
  camera.updateProjectionMatrix();
  finish(scene, camera, job.width, job.height, 0.9);
}

function detail(job: Job) {
  const scene = new THREE.Scene();
  scene.background = CHALK;
  scene.environment = envTex;
  scene.environmentIntensity = 0.6;
  const p = piece(recipes[job.recipe], job.config);
  scene.add(p);
  const box = new THREE.Box3().setFromObject(p);
  keyLight(scene, new THREE.Vector3(-1.5, 3, 2), 2, 2.4);
  const camera = new THREE.PerspectiveCamera(
    22,
    job.width / job.height,
    0.01,
    20,
  );
  // the top-left front corner: top and side edges, the working face, the hooks
  const corner = new THREE.Vector3(
    box.min.x + 0.012,
    box.max.y,
    box.max.z - 0.012,
  );
  camera.position.set(corner.x - 0.3, corner.y + 0.26, corner.z + 0.58);
  camera.lookAt(corner.x + 0.2, corner.y - 0.2, corner.z - 0.2);
  camera.updateProjectionMatrix();
  finish(scene, camera, job.width, job.height, 0.8);
}

/* ---------- API for the driver ---------- */

declare global {
  interface Window {
    furnishesJobs: () => Job[];
    furnishesRender: (job: Job) => Promise<string>;
  }
}

window.furnishesJobs = () => {
  const jobs: Job[] = [];
  for (const r of renderedRecipes(designs)) {
    for (const c of variants(r))
      jobs.push({
        kind: "studio",
        recipe: r.id,
        config: c,
        out: `studio/${renderKey(r.id, c)}`,
        width: STUDIO.w,
        height: STUDIO.h,
      });
  }
  const entry = {
    finish: "natural",
    front: "open",
    accessories: ["coat-hook", "key-tray"],
  } as Options;
  jobs.push({
    kind: "room",
    recipe: "entry",
    config: entry,
    out: "scene/entry-room",
    width: 2400,
    height: 1500,
  });
  jobs.push({
    kind: "room",
    recipe: "entry",
    config: { ...entry, finish: "orange" },
    out: "scene/entry-room-orange",
    width: 2400,
    height: 1500,
  });
  jobs.push({
    kind: "detail",
    recipe: "entry",
    config: entry,
    out: "scene/entry-detail",
    width: 1500,
    height: 1500,
  });
  jobs.push({
    kind: "detail",
    recipe: "entry",
    config: { ...entry, finish: "orange" },
    out: "scene/entry-detail-orange",
    width: 1500,
    height: 1500,
  });
  jobs.push({
    kind: "front",
    recipe: "entry",
    config: entry,
    out: "scene/entry-front",
    width: 1200,
    height: 1500,
  });
  return jobs;
};

let ready: Promise<void> | null = null;
window.furnishesRender = async (job: Job) => {
  ready ??= setup();
  await ready;
  if (job.kind === "studio") studio(job);
  else if (job.kind === "front") studio(job, true);
  else if (job.kind === "room") await room(job);
  else detail(job);
  const gl = renderer.getContext();
  if (gl.isContextLost()) throw new Error("WebGL context lost");
  const url = renderer.domElement.toDataURL("image/png");
  if (url.length < 100)
    throw new Error(
      `empty canvas ${renderer.domElement.width}x${renderer.domElement.height}`,
    );
  return url;
};
