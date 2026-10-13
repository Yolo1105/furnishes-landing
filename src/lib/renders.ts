import { recipes } from "@/data/recipes";
import type {
  AccessoryId,
  Configuration,
  Design,
  Finish,
  Front,
  Recipe,
  RecipeId,
} from "@/data/types";
import { allowedAccessories } from "./config";

/**
 * Names of the rendered product images. The renderer (tools/render) and the
 * site both use these, so a configuration always finds its own picture.
 *
 * Studio images exist for every supported combination of finish, front and
 * accessories of every configurable recipe; they are rendered from the same
 * part model as the drawings and parts lists.
 */
const ACC_CODE: Record<AccessoryId, string> = {
  "coat-hook": "c",
  "key-tray": "t",
  "headphone-hook": "u",
  "kitchen-rail": "k",
  "clothes-rail": "r",
};

type Options = Pick<Configuration, "finish" | "front" | "accessories">;

export function renderKey(recipe: RecipeId, c: Options) {
  const acc =
    [...c.accessories]
      .map((a) => ACC_CODE[a])
      .sort()
      .join("") || "x";
  return `${recipe}-${c.finish === "orange" ? "o" : "n"}${c.front === "doors" ? "d" : "o"}-${acc}`;
}

export const studioSrc = (recipe: RecipeId, c: Options) =>
  `/renders/studio/${renderKey(recipe, c)}.webp`;

/** Size of every studio image, in pixels (4:5). */
export const STUDIO = { w: 1200, h: 1500 } as const;

/** Every combination a recipe supports, in a stable order. */
export function variants(r: Recipe): Options[] {
  const finishes: Finish[] = r.orangeFace ? ["natural", "orange"] : ["natural"];
  const fronts: Front[] = r.doors ? ["open", "doors"] : ["open"];
  const acc = allowedAccessories(r);
  const subsets: AccessoryId[][] = [];
  for (let m = 0; m < 1 << acc.length; m++)
    subsets.push(acc.filter((_, i) => m & (1 << i)).sort());
  return finishes.flatMap((finish) =>
    fronts.flatMap((front) =>
      subsets.map((accessories) => ({ finish, front, accessories })),
    ),
  );
}

/** Recipes that have studio images: those behind a configurable design. */
export function renderedRecipes(all: Design[]): Recipe[] {
  const ids = new Set(
    all
      .filter((d) => d.status === "configurable" && d.recipe)
      .map((d) => d.recipe!),
  );
  return [...ids].map((id) => recipes[id]);
}
