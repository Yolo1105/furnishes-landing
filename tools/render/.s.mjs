import sharp from "sharp";
import fs from "fs";
import path from "path";
const [dir, out, cols = "4", W = "400"] = process.argv.slice(2);
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".webp"))
  .sort();
const w = +W,
  c = +cols;
const metas = await Promise.all(
  files.map((f) => sharp(path.join(dir, f)).metadata()),
);
const h = Math.round(w * Math.max(...metas.map((m) => m.height / m.width)));
const comps = await Promise.all(
  files.map(async (f, i) => ({
    input: await sharp(path.join(dir, f))
      .resize(w, h, { fit: "contain", background: "#fff" })
      .toBuffer(),
    left: (i % c) * w,
    top: Math.floor(i / c) * h,
  })),
);
await sharp({
  create: {
    width: c * w,
    height: Math.ceil(files.length / c) * h,
    channels: 3,
    background: "#fff",
  },
})
  .composite(comps)
  .jpeg({ quality: 82 })
  .toFile(out);
console.log(files.join(" "));
