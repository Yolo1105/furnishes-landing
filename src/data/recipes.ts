import type { Recipe, RecipeId } from "./types";

/**
 * Early geometry for the second-batch pieces (layer B), from the nominal
 * sizes in the furniture record (600 / 400 / 400 unit, 18 mm panels). It
 * is only used to draw them. Their full parts lists are still open (doc 12
 * v2.0, ch. 09), so the site shows no parts list or configuration for them.
 */
export const recipes: Record<RecipeId, Recipe> = {
  kitchen: {
    id: "kitchen",
    structure: "stacked",
    shape: "trolley",
    size: { w: 600, h: 800, d: 400 },
    tiers: 2,
    bays: 1,
    doors: false,
    rail: true,
  },
  "work-cart": {
    id: "work-cart",
    structure: "stacked",
    shape: "trolley",
    size: { w: 600, h: 800, d: 400 },
    tiers: 2,
    bays: 1,
    doors: false,
  },
  "low-cabinet": {
    id: "low-cabinet",
    structure: "full-height",
    shape: "cabinet",
    size: { w: 1800, h: 800, d: 400 },
    tiers: 2,
    bays: 3,
    doors: true,
  },
  device: {
    id: "device",
    structure: "full-height",
    shape: "cabinet",
    size: { w: 600, h: 800, d: 400 },
    tiers: 2,
    bays: 1,
    doors: true,
  },
  console: {
    id: "console",
    structure: "full-height",
    shape: "cabinet",
    size: { w: 1200, h: 800, d: 400 },
    tiers: 2,
    bays: 2,
    doors: false,
  },
  "coat-stand": {
    id: "coat-stand",
    structure: "full-height",
    shape: "organiser",
    size: { w: 600, h: 1600, d: 400 },
    tiers: 4,
    bays: 1,
    doors: false,
    rail: true,
  },
  partition: {
    id: "partition",
    structure: "full-height",
    shape: "shelf",
    size: { w: 1200, h: 1600, d: 400 },
    tiers: 4,
    bays: 2,
    doors: false,
  },
  "sofa-back": {
    id: "sofa-back",
    structure: "full-height",
    shape: "shelf",
    size: { w: 1800, h: 1200, d: 400 },
    tiers: 3,
    bays: 3,
    doors: false,
  },
  "bed-head": {
    id: "bed-head",
    structure: "full-height",
    shape: "shelf",
    size: { w: 1200, h: 1200, d: 400 },
    tiers: 3,
    bays: 2,
    doors: false,
  },
  "mobile-screen": {
    id: "mobile-screen",
    structure: "full-height",
    shape: "screen",
    size: { w: 600, h: 1200, d: 400 },
    tiers: 3,
    bays: 1,
    doors: false,
  },
};
