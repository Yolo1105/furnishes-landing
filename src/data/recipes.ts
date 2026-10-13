import type { AccessoryId, Recipe, RecipeId } from "./types";

/**
 * The thirteen parts recipes carried over from the prototype catalogue.
 * Geometry is nominal (600 x 400 x 400 unit, 18 mm panels) and drawn from
 * the transformation record. None of it is a released specification.
 */
const base = {
  doors: false,
  orangeFace: true,
  defaultAccessories: [] as AccessoryId[],
  optionalAccessories: [] as AccessoryId[],
};

export const recipes: Record<RecipeId, Recipe> = {
  entry: {
    ...base,
    id: "entry",
    structure: "full-height",
    shape: "organiser",
    size: { w: 600, h: 1200, d: 400 },
    tiers: 3,
    bays: 1,
    use: "Hang, set down, head out.",
    description:
      "A freestanding landing place for bags, keys and everyday shoes. Hooks at hand height on the working face, a small tray for the things that travel with you, and a shoe shelf below.",
    space:
      "Measure the full base, and leave room in front to reach the hooks and the shoe shelf.",
    defaultAccessories: ["coat-hook", "key-tray"],
    optionalAccessories: ["headphone-hook"],
  },
  desk: {
    ...base,
    id: "desk",
    structure: "full-height",
    shape: "organiser",
    size: { w: 600, h: 1200, d: 400 },
    tiers: 3,
    bays: 1,
    use: "Your things, an arm's reach from the desk.",
    description:
      "An organiser that stands on its own beside the desk you already have. Open shelves and a working face keep the everyday in view without using the desktop.",
    space:
      "Allow room for your chair and for reaching the shelves. Your desk stays as it is; this piece does not attach to it.",
    defaultAccessories: ["headphone-hook"],
    optionalAccessories: ["key-tray", "coat-hook"],
  },
  bedside: {
    ...base,
    id: "bedside",
    structure: "stacked",
    shape: "cabinet",
    size: { w: 600, h: 400, d: 400 },
    tiers: 1,
    bays: 1,
    use: "Last thing at night. First thing in the morning.",
    description:
      "One top for the lamp and the phone, and a compartment below for what you keep close. Leave it open or close it with a door.",
    space:
      "Compare the top height with your mattress, and allow room for a door to open if you choose one.",
    doors: true,
    optionalAccessories: ["key-tray"],
  },
  kitchen: {
    ...base,
    id: "kitchen",
    structure: "stacked",
    shape: "trolley",
    size: { w: 600, h: 800, d: 400 },
    tiers: 2,
    bays: 1,
    use: "A little more counter, where you are cooking.",
    description:
      "Two tiers of storage under a worktop, on casters. Everyday supplies stay close and the trolley moves to where the work is.",
    space:
      "Check the worktop height against your counter, and leave a clear path for the casters.",
    defaultAccessories: ["kitchen-rail"],
    optionalAccessories: ["key-tray"],
  },
  "work-cart": {
    ...base,
    id: "work-cart",
    structure: "stacked",
    shape: "trolley",
    size: { w: 600, h: 800, d: 400 },
    tiers: 2,
    bays: 1,
    use: "Bring the useful things closer. Roll them away after.",
    description:
      "Two tiers on casters for the printer, paper and tools. It sits beside the desk while you work and rolls under or away when you are done.",
    space:
      "Allow room to move the trolley and to open any doors, clear of your chair.",
    doors: true,
    defaultAccessories: ["headphone-hook"],
    optionalAccessories: ["key-tray"],
  },
  sideboard: {
    ...base,
    id: "sideboard",
    structure: "stacked",
    shape: "cabinet",
    size: { w: 1800, h: 800, d: 400 },
    tiers: 2,
    bays: 3,
    use: "One long place for the everyday.",
    description:
      "Three connected bays under one long top, for a living room, a hallway or under the television. Keep the compartments open or close them with doors.",
    space:
      "Check the full 180 cm width, the base footprint and room in front to open doors.",
    doors: true,
  },
  bookcase: {
    ...base,
    id: "bookcase",
    structure: "stacked",
    shape: "shelf",
    size: { w: 1200, h: 1600, d: 400 },
    tiers: 4,
    bays: 2,
    use: "Shelves on both sides. A line between two parts of a room.",
    description:
      "Two segments, four tiers, with a centre panel and shallower shelves on each side, so both sides of the room get their own shelves.",
    space:
      "Each side's shelves are about half the full depth. Keep both sides reachable. At 160 cm tall it may need fixing against tipping; this is confirmed with your quote.",
  },
  workstation: {
    ...base,
    id: "workstation",
    structure: "full-height",
    shape: "desk",
    size: { w: 1200, h: 1600, d: 1000 },
    tiers: 4,
    bays: 1,
    use: "A desk with everything around it.",
    description:
      "An upright organiser with a desk surface and its own support. Unlike the desk-side organiser, this design includes the desk.",
    space:
      "Allow for the chair and legroom in front of the desk, and reach to the organiser. At 160 cm tall it may need fixing against tipping; this is confirmed with your quote.",
    defaultAccessories: ["headphone-hook"],
    optionalAccessories: ["key-tray"],
  },
  "mobile-screen": {
    ...base,
    id: "mobile-screen",
    structure: "full-height",
    shape: "screen",
    size: { w: 600, h: 1200, d: 400 },
    tiers: 3,
    bays: 1,
    use: "One piece. Two sides to your day.",
    description:
      "A full-height body on casters: shelves and a working face on one side, a quieter face on the other. Use it as a background, or as a light line between two parts of a room.",
    space:
      "Check the base footprint and keep the storage side reachable. It does not fold, and a visual screen does not block sound.",
    optionalAccessories: ["coat-hook", "headphone-hook"],
  },
  "folding-screen": {
    ...base,
    id: "folding-screen",
    structure: "folding",
    shape: "folding",
    size: { w: 1800, h: 1200, d: 400 },
    tiers: 3,
    bays: 3,
    use: "A little separation, when you want it.",
    description:
      "Three framed leaves on continuous hinges. It folds flat when it is not needed and carries no storage.",
    space:
      "The 180 cm width is fully unfolded; folding it changes both width and depth.",
    orangeFace: false,
  },
  island: {
    ...base,
    id: "island",
    structure: "stacked",
    shape: "island",
    size: { w: 1200, h: 800, d: 400 },
    tiers: 2,
    bays: 2,
    use: "Two trolleys. One shared top.",
    description:
      "Two trolley bodies under one long worktop. The joining parts and the stability of the pair are still being worked out.",
    space:
      "Check the shared top, the worktop height and room to walk around both bases.",
  },
  bench: {
    ...base,
    id: "bench",
    structure: "seating",
    shape: "bench",
    size: { w: 1200, h: 450, d: 400 },
    tiers: 1,
    bays: 2,
    use: "Sit to tie your shoes. The shoes live underneath.",
    description:
      "A storage bench study with a dedicated seat surface. Seat height and seating strength are not yet tested; an ordinary cabinet top is not a seat.",
    space: "Seat height and seating load are still being validated.",
  },
  "coat-rack": {
    ...base,
    id: "coat-rack",
    structure: "full-height",
    shape: "organiser",
    size: { w: 600, h: 1600, d: 400 },
    tiers: 4,
    bays: 1,
    use: "Make room for what you wear.",
    description:
      "A taller organiser for clothes and bags, with a hanging rail and a lower shelf.",
    space:
      "Compare the hanging height with your longest clothes. At 160 cm tall it may need fixing against tipping.",
    defaultAccessories: ["clothes-rail"],
    optionalAccessories: ["coat-hook"],
  },
};

export const accessories: Record<
  AccessoryId,
  { name: string; description: string }
> = {
  "coat-hook": {
    name: "Coat hooks (set of 3)",
    description: "Three hooks that hang on the holes of the working face.",
  },
  "key-tray": {
    name: "Small tray",
    description:
      "A shallow tray for keys, post and the things in your pockets.",
  },
  "headphone-hook": {
    name: "Utility hook",
    description: "One hook for headphones, a bag or a cable.",
  },
  "kitchen-rail": {
    name: "Side rail",
    description: "A rail on the side of the worktop for a towel or utensils.",
  },
  "clothes-rail": {
    name: "Clothes rail",
    description: "A hanging rail and its two supports.",
  },
};
