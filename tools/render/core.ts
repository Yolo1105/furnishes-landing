/**
 * Renderer core: the WebGL setup, materials in the decided finishes, the
 * plywood box, camera framing and the background calibration.
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { N8AOPass } from "n8ao";

export const A = "/assets/";
/** The page's product stage colour (--stage in globals.css). */
export const STAGE = "#f7e5d2";
export const M = 0.001; // mm to metres

const tl = new THREE.TextureLoader();
export function tex(url: string, srgb: boolean) {
  const t = tl.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

export const maps = {
  ply: tex(`${A}pbr/plywood/Diffuse.webp`, true),
  plyRough: tex(`${A}pbr/plywood/Rough.webp`, false),
  plyNormal: tex(`${A}pbr/plywood/nor_gl.webp`, false),
  linenNormal: tex(`${A}pbr/rough_linen/nor_gl.webp`, false),
  wallNormal: tex(`${A}pbr/plastered_wall/nor_gl.webp`, false),
  floor: tex(`${A}pbr/laminate_floor_02/Diffuse.webp`, true),
  floorRough: tex(`${A}pbr/laminate_floor_02/Rough.webp`, false),
  oak: tex(`${A}pbr/oak_veneer_01/Diffuse.webp`, true),
};
maps.wallNormal.repeat.set(3, 1.6);
maps.floor.repeat.set(2.4, 2.4);
maps.floorRough.repeat.set(2.4, 2.4);

/** Birch plywood edge: 13 plies across 18 mm, with thin glue lines. */
function edgeTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 208;
  const g = c.getContext("2d")!;
  const plies = 13;
  const h = c.height / plies;
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < plies; i++) {
    g.fillStyle = i % 2 === 0 ? "#ecdcbe" : "#dfc8a1";
    g.fillRect(0, i * h, c.width, h);
    for (let k = 0; k < 40; k++) {
      g.fillStyle = `rgba(150,110,60,${0.04 + rnd() * 0.05})`;
      g.fillRect(rnd() * c.width, i * h + rnd() * h, 20 + rnd() * 90, 1);
    }
    g.fillStyle = "rgba(120,86,46,0.5)";
    g.fillRect(0, i * h, c.width, 1.4);
  }
  // the laminate's thin white skin on both faces
  g.fillStyle = "#f3f0ea";
  g.fillRect(0, 0, c.width, 3);
  g.fillRect(0, c.height - 3, c.width, 3);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ---------- materials (D10, D15) ---------- */

/** Large faces: white matte laminate on birch plywood. */
export const white = new THREE.MeshPhysicalMaterial({
  color: "#f7f4ef",
  roughness: 0.58,
  sheen: 0.1,
  clearcoat: 0.05,
});
/** The edges stay birch. */
export const birchEdge = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  map: edgeTexture(),
  roughness: 0.78,
});
/** Natural birch veneer, for trays and small plywood parts. */
export const birch = new THREE.MeshPhysicalMaterial({
  color: "#fff6ea",
  map: maps.ply,
  roughnessMap: maps.plyRough,
  normalMap: maps.plyNormal,
  normalScale: new THREE.Vector2(0.35, 0.35),
  roughness: 0.62,
});
/** Hanging face (plan b, thin perforated face): drawn plain until the hole
 * pattern is chosen; no Ø5 array, no brand's hole shape (doc 13). */
export const hangingFace = new THREE.MeshStandardMaterial({
  color: "#e4dfd7",
  roughness: 0.55,
});
/** Powder-coated steel for bases, legs and frames. */
export const steel = new THREE.MeshStandardMaterial({
  color: "#34312e",
  roughness: 0.5,
  metalness: 0.25,
});
export const aluminium = new THREE.MeshStandardMaterial({
  color: "#c9cac7",
  roughness: 0.3,
  metalness: 0.9,
});
/** Accessories and add-ons in the accent colour (value to be confirmed). */
export const accent = new THREE.MeshStandardMaterial({
  color: "#e05a22",
  roughness: 0.45,
  metalness: 0.1,
});
export const rubber = new THREE.MeshStandardMaterial({
  color: "#2a2725",
  roughness: 0.85,
});

export const mat = (color: string, roughness = 0.7, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

export function linen(color: string, repeat = 3) {
  // the weave's relief only: the scanned colour map is a cool grey cloth
  const normal = maps.linenNormal.clone();
  normal.repeat.set(repeat, repeat);
  normal.needsUpdate = true;
  return new THREE.MeshStandardMaterial({
    color,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughness: 0.95,
  });
}

/* ---------- geometry ---------- */

export function shadowed<T extends THREE.Object3D>(o: T) {
  o.traverse((m) => {
    m.castShadow = m.receiveShadow = true;
  });
  return o;
}

export function rbox(
  w: number,
  h: number,
  d: number,
  r: number,
  m: THREE.Material | THREE.Material[],
) {
  return shadowed(
    new THREE.Mesh(
      new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)),
      m,
    ),
  );
}

export function cyl(
  rTop: number,
  rBottom: number,
  h: number,
  m: THREE.Material,
  seg = 32,
) {
  return shadowed(
    new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), m),
  );
}

/**
 * A plywood board (sizes in mm): `face` on the two broad faces, the layered
 * birch edge on the four thin ones, with texture coordinates in real size.
 */
export function board(
  w: number,
  h: number,
  d: number,
  face: THREE.Material = white,
  back: THREE.Material = face,
) {
  const g = new THREE.BoxGeometry(w * M, h * M, d * M);
  const uv = g.attributes.uv as THREE.BufferAttribute;
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
  const TILE = 1250;
  for (let f = 0; f < 6; f++) {
    const [us, vs] = spans[f]!;
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      const u = uv.getX(i);
      const v = uv.getY(i);
      if (broadFace(f)) {
        if (us >= vs) uv.setXY(i, (u * us) / TILE, (v * vs) / TILE);
        else uv.setXY(i, (v * vs) / TILE, (u * us) / TILE);
      } else if (Math.abs(vs - thin) < 0.5) uv.setXY(i, (u * us) / 300, v);
      else uv.setXY(i, (v * vs) / 300, u);
    }
  }
  uv.needsUpdate = true;
  const mats = [0, 1, 2, 3, 4, 5].map((f) => {
    if (!broadFace(f)) return birchEdge;
    return f === 4 || f === 0 || f === 2 ? face : back;
  });
  const mesh = new THREE.Mesh(g, mats);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/** Model box (min corner, size; x across, y depth front-to-back, z up) to a local position. */
export function boxCentre(
  pos: [number, number, number],
  size: [number, number, number],
) {
  return new THREE.Vector3(
    (pos[0] + size[0] / 2) * M,
    (pos[2] + size[2] / 2) * M,
    -(pos[1] + size[1] / 2) * M,
  );
}

/* ---------- stage ---------- */

export let renderer: THREE.WebGLRenderer;
export let envTex: THREE.Texture;
const gltf = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath(`${A}draco/`);
gltf.setDRACOLoader(draco);

export async function setup() {
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
  const all = Object.values(maps);
  for (let i = 0; i < 500 && !all.every((t) => t.image); i++)
    await new Promise((r) => setTimeout(r, 20));
  if (!all.every((t) => t.image)) throw new Error("textures did not load");
  await calibrate();
}

export async function prop(url: string, pos: THREE.Vector3, ry = 0, scale = 1) {
  try {
    const o = (await gltf.loadAsync(url)).scene;
    o.position.copy(pos);
    o.rotation.y = ry;
    o.scale.setScalar(scale);
    return shadowed(o);
  } catch (e) {
    console.error("prop failed", url, String(e));
    return null;
  }
}

export function keyLight(
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

export function finish(
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

/** Fit a camera on a direction so the box fills `fill` of the frame. */
export function frame(
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

/* ---------- background calibration ---------- */

// The pipeline tone-maps everything, the background included. Find the
// background colour that comes out as the page's stage colour exactly, so
// product images sit on the page without a visible edge.
export let STAGE_IN = new THREE.Color(STAGE);
async function calibrate() {
  const hex = parseInt(STAGE.slice(1), 16);
  const T = [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map(
    (v) => v / 255,
  );
  const s = [...T];
  for (let i = 0; i < 10; i++) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color().setRGB(
      s[0]!,
      s[1]!,
      s[2]!,
      THREE.SRGBColorSpace,
    );
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
    finish(scene, camera, 16, 16, 1);
    const gl = renderer.getContext();
    const px = new Uint8Array(4);
    gl.readPixels(8, 8, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const err = T.map((v, k) => v - px[k]! / 255);
    if (Math.max(...err.map(Math.abs)) < 0.6 / 255) break;
    for (let k = 0; k < 3; k++)
      s[k] = THREE.MathUtils.clamp(s[k]! + err[k]!, 0, 1);
  }
  STAGE_IN = new THREE.Color().setRGB(
    s[0]!,
    s[1]!,
    s[2]!,
    THREE.SRGBColorSpace,
  );
}

/** A studio stage: stage-coloured background, shadow catcher, key and fill. */
export function stageScene(subjectBox: THREE.Box3) {
  const scene = new THREE.Scene();
  scene.background = STAGE_IN;
  scene.environment = envTex;
  scene.environmentIntensity = 0.6;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ color: "#4a2a18", opacity: 0.28 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  keyLight(
    scene,
    new THREE.Vector3(-2.6, 3.4, 2.4),
    Math.max(2.5, subjectBox.getSize(new THREE.Vector3()).length()),
    2.1,
  );
  const fill = new THREE.DirectionalLight("#fff0e2", 0.55);
  fill.position.set(3, 1.5, 2);
  scene.add(fill);
  return scene;
}
