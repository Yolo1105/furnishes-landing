import { describe, expect, it } from "vitest";
import { heroParts, heroSteps, kits, packSwap } from "@/data/hero";
import { arrangements, packs, products } from "@/data/products";
import { arrangementsWith, getProduct, packsFor } from "./catalog";
import { configParams, configSummary, parseConfig, swapPack } from "./config";
import {
  explore,
  filterProducts,
  parseFilters,
  reasonSentence,
} from "./explore";
import { changes, partRows } from "./version";

/** Records in layers E (research) and F (parked): never on the site (D11). */
const HIDDEN = [
  "2.7",
  "2.8",
  "2.10",
  "2.14",
  "2.15",
  "2.25",
  "2.26",
  "3.3",
  "1.8",
  "1.12",
  "1.13",
  "1.19",
  "1.20",
  "2.13",
  "2.21",
  "2.27",
  "2.28",
  "3.8",
];

describe("catalogue by layer", () => {
  it("has 3 launch pieces and 11 coming soon, launch first", () => {
    expect(
      products.filter((p) => p.layer === "A").map((p) => p.record),
    ).toEqual(["1.1", "1.2", "1.3"]);
    expect(
      products
        .filter((p) => p.layer === "B")
        .map((p) => p.record)
        .sort(),
    ).toEqual(
      [
        "1.4",
        "1.6",
        "1.10",
        "1.14",
        "1.16",
        "1.17",
        "2.1",
        "2.2",
        "2.9",
        "2.12",
        "3.1",
      ].sort(),
    );
  });

  it("has 14 packs and 14 arrangements, all pointing at real products", () => {
    expect(packs).toHaveLength(14);
    expect(arrangements).toHaveLength(14);
    for (const k of packs)
      for (const id of k.parents) expect(getProduct(id), k.id).toBeTruthy();
    for (const a of arrangements)
      for (const m of a.members)
        expect(getProduct(m.product), a.id).toBeTruthy();
  });

  it("shows no research or parked record anywhere", () => {
    const records = [...products, ...packs, ...arrangements].map(
      (x) => x.record,
    );
    for (const r of HIDDEN) expect(records).not.toContain(r);
  });

  it("puts packs and arrangements on their products", () => {
    expect(
      packsFor(getProduct("mobile-screen")!).length,
    ).toBeGreaterThanOrEqual(6);
    expect(arrangementsWith(getProduct("bedside")!).map((a) => a.id)).toContain(
      "shape-t",
    );
  });

  it("launch pieces are built from the model, the rest from recipes", () => {
    for (const p of products)
      expect(Boolean(p.hero) !== Boolean(p.recipe), p.id).toBe(true);
  });
});

describe("hero model (spec v0)", () => {
  it("matches the spec's part and step counts", () => {
    expect(heroParts("entry")).toHaveLength(17);
    expect(heroParts("desk")).toHaveLength(15);
    expect(heroParts("bedside")).toHaveLength(7);
    expect(heroSteps("entry")).toHaveLength(13);
    expect(heroSteps("desk")).toHaveLength(12);
    expect(heroSteps("bedside")).toHaveLength(7);
  });

  it("places every part in exactly one step", () => {
    for (const h of ["entry", "desk", "bedside"] as const) {
      const inSteps = heroSteps(h).flatMap((s) => s.parts);
      expect(new Set(inSteps).size).toBe(inSteps.length);
      expect(inSteps.sort()).toEqual(
        heroParts(h)
          .map((p) => p.id)
          .sort(),
      );
    }
  });

  it("names everything in English", () => {
    const cjk = /[\u3000-\u9fff\uff00-\uffef]/;
    for (const h of ["entry", "desk", "bedside"] as const) {
      for (const p of heroParts(h))
        expect(cjk.test(p.name + p.material), p.id).toBe(false);
      for (const s of heroSteps(h))
        expect(cjk.test(s.title + s.check + s.tool), `${h} ${s.n}`).toBe(false);
    }
    for (const k of kits)
      expect(cjk.test(k.name + k.adds.join() + k.removes.join()), k.id).toBe(
        false,
      );
  });

  it("swaps packs on one frame: 9 kept, 8 off, 5 on", () => {
    const s = packSwap("entry", "desk");
    expect(s.kept).toHaveLength(9);
    expect(s.removed).toHaveLength(8);
    expect(s.added).toHaveLength(5);
    expect(s.kept.every((p) => p.shared)).toBe(true);
  });
});

describe("configuration", () => {
  it("round-trips through the URL", () => {
    const { config } = parseConfig(
      "desk",
      new URLSearchParams("kits=K-D2,K-D1&face=fabric&qty=3"),
    );
    expect(config).toEqual({
      design: "desk",
      kits: ["K-D1", "K-D2"],
      face: "fabric",
      quantity: 3,
    });
    expect(parseConfig("desk", configParams(config!)).config).toEqual(config);
  });

  it("drops kits a piece can't take today, and says so", () => {
    const { config, issues } = parseConfig(
      "entry",
      new URLSearchParams("kits=K-E3,K-E6,K-D1"),
    );
    expect(config!.kits).toEqual(["K-E3"]);
    expect(issues[0]).toMatch(/Mirror/);
  });

  it("joining two blocks needs two of them", () => {
    const { config, issues } = parseConfig(
      "bedside",
      new URLSearchParams("kits=K-B4"),
    );
    expect(config!.quantity).toBe(2);
    expect(issues.length).toBe(1);
  });

  it("has no configuration for pieces coming soon", () => {
    expect(parseConfig("kitchen", new URLSearchParams()).config).toBeNull();
  });

  it("keeps shared add-ons when changing packs", () => {
    const next = swapPack({
      design: "entry",
      kits: ["K-E3", "K-E4"],
      face: "fabric",
      quantity: 1,
    });
    expect(next).toEqual({
      design: "desk",
      kits: ["K-E4"],
      face: "fabric",
      quantity: 1,
    });
    expect(
      swapPack({ design: "bedside", kits: [], face: "solid", quantity: 1 }),
    ).toBeNull();
  });

  it("says the version in words", () => {
    expect(
      configSummary({ design: "entry", kits: [], face: "solid", quantity: 1 }),
    ).toBe("Standard version");
    expect(
      configSummary({
        design: "desk",
        kits: ["K-D1"],
        face: "fabric",
        quantity: 1,
      }),
    ).toBe("Desk top kit, fabric faces");
  });
});

describe("version parts", () => {
  it("adds the desk top kit's drawn parts", () => {
    const rows = partRows({
      design: "desk",
      kits: ["K-D1"],
      face: "solid",
      quantity: 1,
    });
    expect(rows.map((r) => r.name)).toContain("Full-height steel desk leg");
    expect(rows.map((r) => r.name)).not.toContain("Aluminium rail");
  });

  it("lists what a version adds and takes off", () => {
    const c = changes({
      design: "bedside",
      kits: ["K-B3"],
      face: "solid",
      quantity: 1,
    });
    expect(c.added).toContain("Caster base with brakes");
    expect(c.removed).toContain("Steel leg frame");
    const rows = partRows({
      design: "bedside",
      kits: ["K-B3"],
      face: "solid",
      quantity: 1,
    });
    expect(
      rows.map((r) => r.name).some((n) => n.startsWith("Steel leg frame")),
    ).toBe(false);
  });

  it("replaces solid faces with fabric ones", () => {
    const rows = partRows({
      design: "entry",
      kits: [],
      face: "fabric",
      quantity: 1,
    });
    expect(rows.find((r) => r.name === "Face panel in fabric")?.quantity).toBe(
      3,
    );
  });
});

describe("explore and filters", () => {
  it("matches across kinds, launch pieces first, nothing cut", () => {
    const m = explore({ rooms: ["entryway"], things: ["bag-coat"] });
    expect(m.map((x) => x.product.id)).toEqual(["entry", "coat-stand"]);
    expect(m.every((x) => x.exact)).toBe(true);
  });

  it("falls back to the closest when nothing fits both", () => {
    const m = explore({ rooms: ["kitchen"], things: ["records"] });
    expect(m.length).toBeGreaterThan(0);
    expect(m[0]!.exact).toBe(false);
  });

  it("writes one plain sentence of reasons", () => {
    expect(reasonSentence(["By the door", "hooks for a bag and a coat"])).toBe(
      "By the door: hooks for a bag and a coat.",
    );
  });

  it("filters the index", () => {
    expect(
      filterProducts(parseFilters(new URLSearchParams("status=launch"))),
    ).toHaveLength(3);
    expect(
      filterProducts(parseFilters(new URLSearchParams("type=dividers"))).length,
    ).toBe(5);
    expect(
      filterProducts(parseFilters(new URLSearchParams("q=coat"))).map(
        (p) => p.id,
      ),
    ).toContain("coat-stand");
  });
});
