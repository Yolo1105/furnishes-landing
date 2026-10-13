import { describe, expect, it } from "vitest";
import { designs, problems } from "@/data/designs";
import { recipes } from "@/data/recipes";
import { prices } from "@/data/market";
import { getDesign, isConfigurable, recipeOf, sizeLabel } from "./catalog";
import {
  configHref,
  configKey,
  configParams,
  configSummary,
  defaultConfig,
  parseConfig,
} from "./config";
import {
  emptyExplore,
  explore,
  exploreParams,
  filterDesigns,
  parseExplore,
  parseFilters,
} from "./explore";
import { compareParts, changeTotals, partCount, partsList, steps } from "./parts";

describe("catalogue", () => {
  it("has all 64 designs with unique ids and an object render each", () => {
    expect(designs).toHaveLength(64);
    expect(new Set(designs.map((d) => d.id)).size).toBe(64);
    for (const d of designs) expect(d.image.object.w).toBeGreaterThan(0);
  });

  it("only configurable designs with a recipe can be configured", () => {
    const configurable = designs.filter(isConfigurable).map((d) => d.id);
    expect(configurable).toHaveLength(11);
    expect(configurable).toContain("entry");
    expect(isConfigurable(getDesign("island")!)).toBe(false);
  });

  it("every problem points at a real design", () => {
    expect(problems).toHaveLength(53);
    for (const p of problems) expect(getDesign(p.design)).toBeDefined();
  });

  it("publishes no prices until they are confirmed", () => {
    expect(Object.keys(prices)).toHaveLength(0);
  });

  it("prints sizes as W x H x D in centimetres", () => {
    expect(sizeLabel({ w: 600, h: 1200, d: 400 })).toBe("60 × 120 × 40 cm");
  });
});

describe("part model", () => {
  const entry = recipes.entry;
  const base = { finish: "natural" as const, front: "open" as const };

  it("counts the entry organiser's parts from its drawing", () => {
    const rows = partsList(entry, { ...base, accessories: ["coat-hook", "key-tray"] });
    const qty = (id: string) => rows.find((r) => r.partId === id)?.quantity ?? 0;
    expect(qty("side-full-1200")).toBe(2);
    expect(qty("working-face")).toBe(3);
    expect(qty("coat-hook")).toBe(3);
    expect(qty("key-tray")).toBe(1);
    expect(partCount(rows)).toBe(14);
  });

  it("adds doors only where the recipe takes them", () => {
    const withDoors = partsList(recipes.bedside, { ...base, front: "doors", accessories: [] });
    expect(withDoors.some((r) => r.group === "Doors")).toBe(true);
    const noDoors = partsList(entry, { ...base, front: "doors", accessories: [] });
    expect(noDoors.some((r) => r.group === "Doors")).toBe(false);
  });

  it("reports what stays, comes off and goes on between two versions", () => {
    const from = partsList(recipes.bedside, { ...base, accessories: [] });
    const to = partsList(recipes.bedside, { ...base, front: "doors", accessories: ["key-tray"] });
    const t = changeTotals(compareParts(from, to));
    expect(t).toEqual({ kept: partCount(from), added: 2, removed: 0 });
  });

  it("orders the build steps and skips steps with no parts", () => {
    const s = steps(entry, { ...base, accessories: [] });
    expect(s[0]!.title).toMatch(/base/i);
    expect(s.some((x) => x.title === "Hang the doors")).toBe(false);
  });
});

describe("configuration links", () => {
  const entry = getDesign("entry")!;

  it("round-trips through URL parameters", () => {
    const c = { ...defaultConfig(entry)!, finish: "orange" as const, accessories: ["headphone-hook" as const], quantity: 2 };
    const back = parseConfig("entry", configParams(c));
    expect(back.issues).toEqual([]);
    expect(configKey(back.config!)).toBe(configKey(c));
  });

  it("keeps an explicit 'no accessories' apart from the defaults", () => {
    const none = { ...defaultConfig(entry)!, accessories: [] };
    expect(parseConfig("entry", configParams(none)).config!.accessories).toEqual([]);
    expect(parseConfig("entry", new URLSearchParams()).config!.accessories).toEqual(["coat-hook", "key-tray"]);
  });

  it("drops unsupported options and says so", () => {
    const r = parseConfig("entry", new URLSearchParams("front=doors&acc=kitchen-rail&qty=99"));
    expect(r.config!.front).toBe("open");
    expect(r.config!.accessories).toEqual([]);
    expect(r.config!.quantity).toBe(1);
    expect(r.issues).toHaveLength(3);
  });

  it("builds short links and a readable summary", () => {
    expect(configHref(defaultConfig(entry)!, "customize")).toBe("/furniture/entry/customize");
    expect(configSummary(defaultConfig(entry)!)).toBe("Natural birch · Coat hooks (set of 3), Small tray");
  });

  it("has no configuration for a concept", () => {
    expect(parseConfig("pet-door", new URLSearchParams()).config).toBeNull();
    expect(recipeOf(getDesign("pet-door")!)).toBeUndefined();
  });
});

describe("explore and filters", () => {
  it("restores answers from the URL and ignores unknown values", () => {
    const s = parseExplore(new URLSearchParams("room=entryway,nope&things=shoes&example=entry"));
    expect(s).toEqual({ rooms: ["entryway"], doing: [], things: ["shoes"], example: "entry" });
    expect(parseExplore(exploreParams(s))).toEqual(s);
  });

  it("matches across kinds of answer and explains why", () => {
    const m = explore({ ...emptyExplore, rooms: ["entryway"], things: ["shoes"] });
    expect(m[0]!.exact).toBe(true);
    expect(m.map((x) => x.design.id)).toContain("entry");
    expect(m[0]!.reasons.join(" ")).toMatch(/shoes|entryway/);
  });

  it("falls back to the closest designs when nothing matches everything", () => {
    const m = explore({ ...emptyExplore, rooms: ["bath"], things: ["books"] });
    expect(m.length).toBeGreaterThan(0);
    expect(m.every((x) => !x.exact)).toBe(true);
  });

  it("filters the listing from URL parameters", () => {
    const f = parseFilters(new URLSearchParams("use=kitchen&status=configurable"));
    expect(filterDesigns(f).map((d) => d.id).sort()).toEqual(["kitchen"]);
    expect(filterDesigns(parseFilters(new URLSearchParams("q=shoes"))).map((d) => d.id)).toContain("entry");
  });
});
