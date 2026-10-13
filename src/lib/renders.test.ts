import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { designs } from "@/data/designs";
import { recipes } from "@/data/recipes";
import { renderKey, renderedRecipes, variants } from "./renders";

describe("rendered product images", () => {
  it("names a version by recipe, finish, front and accessories", () => {
    expect(
      renderKey("entry", {
        finish: "natural",
        front: "open",
        accessories: ["key-tray", "coat-hook"],
      }),
    ).toBe("entry-no-ct");
    expect(
      renderKey("bedside", {
        finish: "orange",
        front: "doors",
        accessories: [],
      }),
    ).toBe("bedside-od-x");
  });

  it("enumerates every supported combination", () => {
    // 2 finishes x 1 front x 2^3 accessory sets
    expect(variants(recipes.entry)).toHaveLength(16);
    // folding screen: natural only, open only, no accessories
    expect(variants(recipes["folding-screen"])).toHaveLength(1);
  });

  it("has a studio image for every version of every configurable recipe", () => {
    const missing = renderedRecipes(designs).flatMap((r) =>
      variants(r)
        .map((c) => renderKey(r.id, c))
        .filter(
          (k) =>
            !existsSync(
              path.join(process.cwd(), "public/renders/studio", `${k}.webp`),
            ),
        ),
    );
    expect(missing).toEqual([]);
  });
});
