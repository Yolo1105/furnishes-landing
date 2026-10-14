# Design decisions

A short record of why the site looks and behaves the way it does. The art
direction blueprint, the reference-site notes and the latest brief were the
inputs; where they disagreed with the catalogue decisions of 2026-10-13/14, the
catalogue decisions won (see the last section).

## Principles taken from the references

- **One subject per section.** Each home chapter has its own composition
  (full-bleed scene, tiles, a stepper on a band, a macro, an exploded plate,
  three columns of plans, an atlas, an elevation, a closing field) so the page
  reads as a sequence, not a repeated card grid.
- **Plan views for things that stand in a room.** Walls, screens and
  arrangements are compared from above at one shared scale (`PlanGlyph`),
  because their footprint is the decision.
- **The picture doesn't move while you choose.** The configurator keeps one
  camera; only the parts change. When a choice isn't drawn, the picture says
  so instead of pretending.
- **Breadth is visible, depth is earned.** All 42 designs are one click from
  the catalogue and the home page; only the three launch pieces open into a
  configurator.
- **Motion only for real change.** A short fade when the configured picture
  changes and a chevron turn on the groups. Nothing animates on scroll;
  `prefers-reduced-motion` removes both.

## Colour

The original landing palette, used as is: paper `#ffeddf`, cream `#fff6e9`,
brown `#6e1810`, orange `#e7551a`, strong `#e83200`, mid `#ff9c18`, soft
`#f6c485`, on-orange `#fbf0dc`.

Proportions matter more than the colours (revised after review, 2026-10-14:
the first pass used the palette as wallpaper and the furniture got lost):

- Cream is the page. Cards are a lighter cream (`#fffbf5`).
- Peach appears once on the home page (the pack-swap band), in the footer and
  on hover; nowhere else.
- Orange is an accent: main buttons, selected states, and the one closing
  field. No gradients.
- The product renders sit on a warm stone stage, `#e0d7cc`, calibrated in the
  renderer, so white matte pieces stand out from the page.

Contrast rules (all in `src/app/globals.css`):

- Body text is brown on paper or cream (10.2:1 and 10.9:1). Secondary text is
  `#7d3a22`; the lightest text is `#8a4426` (at least 5.8:1).
- Cream on strong orange is 4.0:1, so it is used only for large text: orange
  buttons are 19px bold, and links on the closing field are 19px bold.
- Selected states are a soft orange fill with brown text and an orange border,
  never colour alone: a tick is always added.
- On orange fields the main button is brown (`btn-ink`).

## Type

- **Archivo** at its normal width throughout: headings at weight 650 with
  tight tracking, reading text and controls at 400 to 600. (Condensed headings
  were dropped in the review: they made the site read like a technical
  poster.)
- **Space Mono** only for dimensions (`.spec`). Labels, captions and step
  numbers are set in Archivo.

## Images

- Launch and coming-soon pieces: renders from the hero model spec and the early
  recipes, with white matte faces, birch edges, steel bases and accessories in
  orange (the accent colour isn't chosen yet, and every picture says so). The
  widened base is always drawn (D13).
- Room views: one per product at eye level, the piece doing its job.
- Other uses and arrangements: earlier concept renders, multiplied onto the
  stage colour and labelled "earlier concept render", because they show
  finishes from before the materials were decided.
- Measured drawings (front and side) come from the same model as the renders.

## Pages

- **Home**, six chapters: opening scene (caption under the picture, never on
  it) → where (rooms) → one frame, two packs (the swap, step by step) → white
  faces, birch edges (materials) → coming soon → next step (explore, keep a
  version, ask or quote, the full index). The parts list, plans,
  arrangements and measured drawings live on the catalogue and product
  pages, not here.
- **Catalogue**: three modes in the URL, `?view=family|room|all`. The full
  index lists every record with its kind, family, plan and size; filters stay
  in the URL.
- **Explore**: choices beside the results, or a four-step guide
  (`?step=1..4`) where every step can be skipped. Every result says why it
  fits. The choices are the URL, so Back and refresh keep them, and the
  product page offers "Back to your results".
- **Product**: the gallery is wider than the decision column (7:4); chapters
  below for the pack swap, add-ons, other uses, arrangements, building it and
  the fit check.
- **Configurator**: four groups, one open at a time.
  - Fit: floor space from the drawn model (the base sets the depth), the add-ons
    that change it, quantity.
  - Function: pack and add-ons. Add-ons still in testing are shown disabled
    with the reason.
  - Finish: face panels (fabric explained where it isn't offered) and the fixed
    launch materials.
  - Review: what is added and taken off, parts, price and timing states, then
    keep or update.

  A closed group shows its current choice. On phones the picture shrinks to
  a thumbnail beside the version sentence, and the next action stays at the
  bottom of the screen.

- **Kept versions**: each is an independent snapshot (design, kits, faces,
  quantity) with its thumbnail. Editing one doesn't touch the others.

## State

- A version is `{design, kits, face, quantity}`. It is encoded in the URL
  (`?kits=K-D1,K-E4&face=fabric&qty=2`), and the open group is `?open=`. A
  refresh or a shared link restores both. Kits that can't be chosen are
  dropped from a link and explained, never swapped.
- Kept versions live in `localStorage` (`furnishes:saved:v2`). The way back to
  Explore results lives in `sessionStorage`.
- Claims that depend on unconfirmed facts are written once in
  `src/data/claims.ts` and read everywhere.

## Catalogue reconciliation

The latest brief asked for "all 64 discoverable, concepts labelled". The
catalogue decisions that came with the updated furniture list say otherwise:

- show A and B products only;
- C uses only on their parents;
- D only as arrangements;
- E and F not on the site (D11).

The site follows the decisions: 42 records are visible (14 products, 14 other
uses, 14 arrangements). The 18 E/F records can be added to the full index as
"Concept / in development" if that decision changes. The index and its kind
chips are built to take them.
