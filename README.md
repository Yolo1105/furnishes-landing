# Furnishes

The customer website for Furnishes: furniture for homes in Singapore built from
one family of boards, with white matte faces, birch edges and accent-coloured
accessories. A visitor can browse every design, explore by room, activity,
object, width or situation, open a piece, configure the three launch pieces
within what they support, keep exact versions in the browser and email them for
a quote.

The design decisions behind the pages are in [`docs/DESIGN.md`](docs/DESIGN.md).

## Run it

Requires Node 20.9+ (tested on 22) and pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build && pnpm start
pnpm check          # typecheck, lint, unit tests, formatting
```

Search engines are blocked until `NEXT_PUBLIC_ALLOW_INDEXING=1` is set at build
time. Set `NEXT_PUBLIC_SITE_URL` for absolute links in metadata and quote emails
(default `https://furnish-es.com`).

## The catalogue

Follows the decision record of 2026-10-13/14 (D1 to D16) and the hero model
spec v0 (`docs/source/hero-spec-v0/`):

- **Launch pieces** (layer A, 3): the function face with the entry pack, the
  function face with the desk-side pack, and the bedside block. These are the
  only pieces that can be configured, kept as versions and quoted.
- **Coming soon** (layer B, 11): second-batch pieces with their own page and
  "register interest". No price, no estimate.
- **Other uses** (layer C, 14): a pack on a parent piece (a coffee corner, a
  record wall…). Shown on the parent's page, never as products.
- **Arrangements** (layer D, 14): pieces standing together (an L, a bed head
  with two bedsides…). Shown as plans and earlier concept renders, never as
  products.
- Layers E and F (18 records) are not on the site (D11).

All 42 visible records are listed at `/furniture?view=all`.

## Pages

| Route                       | What it does                                                                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                         | Opening scene, rooms, one frame with two packs, materials, coming soon, next steps (explore, keep a version, ask or quote, the full index)               |
| `/furniture`                | By family, by room, or all 42 designs; filters for room, type, status, width and search, all in the URL                                                  |
| `/furniture/[id]`           | Gallery (corner, piece, room, close up, base, measured) beside the decision column; pack swap, add-ons, other uses, arrangements, build steps, fit check |
| `/furniture/[id]/customize` | Launch pieces only: Fit, Function, Finish, Review; one stable picture, undo/redo, the version and open group kept in the URL                             |
| `/explore`                  | Start from a room, an activity, things, a width or a situation, or follow the four-step guide; results say why they fit; Back restores the choices       |
| `/saved`                    | Kept versions (independent snapshots in this browser): edit, duplicate, remove, quantity, and an email quote request                                     |
| `/how-it-works`, `/help`    | The system in plain words, what is not confirmed yet, FAQ, and "ask about a room"                                                                        |

## Where things live

- `src/data/products.ts`: the 14 products (A and B), 14 other uses and 14
  arrangements, in English.
- `src/data/hero.ts` and `src/data/hero-model.json`: the launch pieces' parts,
  steps, ports and kits from the hero model spec v0.
- `src/data/claims.ts`: every statement that depends on an unconfirmed fact
  (price, timing, delivery, assembly, stability, fit, renders, accent colour,
  hanging face, saving). Change wording or status here, not in pages.
- `src/data/vocabulary.ts`: objects, activities and the three families.
- `src/lib/config.ts`: a launch piece's configuration and its URL encoding.
  Kits that can't be chosen today are dropped from a link and explained.
- `src/lib/version.ts`: what a version is made of, what changes, and its floor
  space.
- `src/lib/explore.ts`: Explore matching and the listing filters.
- `src/lib/records.ts`: the 42 visible records for the full index.
- `src/lib/saved.ts`: kept versions and quote drafts in localStorage.

## Product images

Product images are rendered from the same model as the drawings and parts
lists, so a picture shows the version it is labelled with, or says what it
can't show yet.

```bash
pnpm render              # everything (software WebGL; slow)
pnpm render hero/        # only the launch pieces in the studio
pnpm render scene/       # only the room views
```

`tools/render/` builds each piece in three.js inside headless Chromium:
`hero/` (launch pieces and drawn kits), `studio/` (coming-soon pieces),
`scene/` (each piece in a room), `steps/`, `parts/` and `detail/`. The older
`object/` and `room/` renders are earlier concepts, used only for other uses and
arrangements and labelled as such. Textures, lighting and props are CC0 (see
`tools/render/assets/LICENSES.md`).

## Not connected yet

Shown as honest states on the site, and need real data before they become
claims:

- Prices in SGD, timing, delivery areas, assembly service, returns, warranty.
- The accent colour and the hanging face (both still being chosen on samples).
- Tip-over and strength tests; add-ons marked "In testing" wait on them.
- Pictures of add-ons that aren't drawn in the spec (doors, drawers, a second
  segment, fabric faces): the configurator marks the picture as pending.
- A service that receives quote requests. Today the site opens an email draft to
  hello@furnish-es.com; it cannot confirm that anything was sent.
- Accounts and cross-device saving (kept versions live in one browser).
