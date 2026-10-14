import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { heroSteps } from "@/data/hero";
import { arrangements, packs, products } from "@/data/products";
import { plateRows } from "./callouts";
import {
  FRAME_SRC,
  HERO,
  detailSrc,
  heroImage,
  heroKey,
  heroVariants,
  partsSrc,
  sceneSrc,
  stepSrc,
  studioSrc,
} from "./renders";

const onDisk = (src: string) =>
  existsSync(path.join(process.cwd(), "public", src));

describe("render names", () => {
  it("only names kits the spec draws", () => {
    expect(heroKey("desk", ["K-D2", "K-D1", "K-E4"])).toBe("desk-k-d1-k-d2");
    expect(heroKey("entry", ["K-E3"])).toBe("entry-std");
  });

  it("says what a picture can't show", () => {
    const i = heroImage({
      design: "entry",
      kits: ["K-E3"],
      face: "fabric",
      quantity: 1,
    });
    expect(i.src).toBe("/renders/hero/entry-std.webp");
    expect(i.missing).toEqual(["Door on the lower tier", "Fabric faces"]);
  });
});

describe("every picture the site uses exists", () => {
  it("products: studio and room", () => {
    for (const p of products) {
      expect(onDisk(studioSrc(p)), studioSrc(p)).toBe(true);
      expect(onDisk(sceneSrc(p.id)), sceneSrc(p.id)).toBe(true);
    }
  });

  it("launch pieces: variants, frame, steps, parts, close views, opening", () => {
    for (const v of heroVariants)
      expect(onDisk(`/renders/hero/${heroKey(v.design, v.kits)}.webp`)).toBe(
        true,
      );
    expect(onDisk(FRAME_SRC)).toBe(true);
    for (const h of ["entry", "desk", "bedside"] as const) {
      expect(onDisk(partsSrc(h))).toBe(true);
      for (const s of heroSteps(h))
        expect(onDisk(stepSrc(h, s.n)), stepSrc(h, s.n)).toBe(true);
    }
    expect(onDisk(detailSrc("edge")) && onDisk(detailSrc("base"))).toBe(true);
    expect(onDisk(HERO.wide.src) && onDisk(HERO.phone.src)).toBe(true);
  });

  it("packs and arrangements: earlier concept renders", () => {
    for (const k of packs)
      expect(onDisk(`/renders/object/${k.id}.webp`), k.id).toBe(true);
    for (const a of arrangements)
      expect(onDisk(`/renders/room/${a.id}.webp`), a.id).toBe(true);
  });

  it("every part on a construction plate has its callout", () => {
    for (const h of ["entry", "desk", "bedside"] as const)
      for (const r of plateRows(h)) expect(r.at, `${h} ${r.name}`).toBeTruthy();
  });
});
