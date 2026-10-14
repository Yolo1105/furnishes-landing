// Renders the product images in public/renders/{studio,scene,detail,parts} from the part
// model. Usage: node tools/render/render.mjs [filter]
//   filter: optional substring of the output name, e.g. "scene/" or "entry-"
// Needs Chromium (PLAYWRIGHT_BROWSERS_PATH or CHROMIUM_PATH). Software WebGL
// is fine; it is slow, not wrong.
import { build } from "esbuild";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
// RENDER_OUT and RENDER_SCALE make quick previews somewhere else
const outDir = process.env.RENDER_OUT ?? path.join(root, "public/renders");
const scale = Number(process.env.RENDER_SCALE ?? 1);
const filter = process.argv[2] ?? "";

const bundle = await build({
  entryPoints: [path.join(here, "scene.ts")],
  bundle: true,
  format: "esm",
  write: false,
  alias: { "@": path.join(root, "src") },
  target: "es2022",
  logLevel: "warning",
});
const js = bundle.outputFiles[0].text;
const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#000}canvas{display:block}</style><script type="module">${js}</script>`;

const types = {
  ".webp": "image/webp",
  ".hdr": "application/octet-stream",
  ".glb": "model/gltf-binary",
  ".bin": "application/octet-stream",
};
const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  if (url === "/") {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(html);
  }
  const file = path.join(here, url);
  if (!file.startsWith(here) || !existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, {
    "content-type": types[path.extname(file)] ?? "application/octet-stream",
  });
  res.end(await readFile(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", e.message));
page.on(
  "console",
  (m) => m.type() === "error" && console.error("console:", m.text()),
);
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForFunction(() => typeof window.furnishesRender === "function");
const jobs = (await page.evaluate(() => window.furnishesJobs()))
  .filter((j) => j.out.includes(filter))
  .map((j) => ({
    ...j,
    width: Math.round(j.width * scale),
    height: Math.round(j.height * scale),
  }));
console.log(`${jobs.length} images to render`);

// where each part lands in the exploded views, for the numbered callouts
const calloutsFile = path.join(root, "src/data/callouts.json");
const callouts = existsSync(calloutsFile)
  ? JSON.parse(await readFile(calloutsFile, "utf8"))
  : {};

let n = 0;
for (const job of jobs) {
  const t = Date.now();
  const { url: dataUrl, meta } = await page.evaluate(
    (j) => window.furnishesRender(j),
    job,
  );
  if (job.kind === "parts") callouts[job.id] = meta;
  const png = Buffer.from(dataUrl.split(",")[1], "base64");
  const file = path.join(outDir, `${job.out}.webp`);
  await mkdir(path.dirname(file), { recursive: true });
  await sharp(png).webp({ quality: 82, effort: 5 }).toFile(file);
  console.log(`${++n}/${jobs.length} ${job.out} ${Date.now() - t} ms`);
}
if (jobs.some((j) => j.kind === "parts"))
  await writeFile(
    calloutsFile,
    JSON.stringify(
      Object.fromEntries(Object.entries(callouts).sort()),
      null,
      2,
    ) + "\n",
  );
await browser.close();
server.close();
