# Furnishes

The customer website for Furnishes: finished birch plywood furniture for homes in
Singapore, built from one family of panels. A visitor can browse every design or
explore by room, activity, object or situation, open a piece, customize only what
it supports, save the exact version and prepare a quote request.

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

## Product images

Product images are rendered from the same part model as the drawings and
parts lists, so a picture always shows the version it is labelled with.

```bash
pnpm render              # everything (about 15 minutes in software WebGL)
pnpm render scene/       # only the room view and close-ups
pnpm render entry-       # only the entry organiser
```

- `tools/render/scene.ts` builds each piece from `src/lib/parts.ts`: birch
  veneer faces, 13-ply edges, the working face's 40 mm hole grid, steel hooks
  and rails. It runs in headless Chromium via `tools/render/render.mjs`.
- `public/renders/studio/<recipe>-<finish><front>-<accessories>.webp`: every
  supported version of every configurable recipe, three-quarter view on the
  chalk backdrop (`--stage`). Names come from `src/lib/renders.ts`; a test
  fails if any version is missing.
- `public/renders/scene/`: the entry organiser at eye level beside a door, a
  close-up of its edge and working face, and a straight front view.
- Textures, lighting and props are CC0 (see `tools/render/assets/LICENSES.md`).
  The chair, plant and shoes are scene dressing, not products.

The older renders in `public/renders/{object,room,before}` (from the
furnishes-house prototype) are still used for concepts.

## Pages

| Route                       | What it does                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                         | Landing: a finished piece in a room, Browse and Explore, room starting points, a live "one piece, your version" demo, how choosing works |
| `/furniture`                | Every design, grouped by room; filters for room, type, status, width and search, all in the URL                                          |
| `/furniture/[id]`           | Product detail: gallery (object, room, before/after, measured drawing), decision column, size check, parts list, steps, same-frame uses  |
| `/furniture/[id]/customize` | Customize a configurable piece: Fit, Function, Finish, Review; live drawing, undo/redo, the version kept in the URL                      |
| `/explore`                  | Start from a room, an activity, things that need a place, or a situation; results say why they fit; Back restores the choices            |
| `/saved`                    | Saved designs (independent snapshots in this browser): edit, duplicate, remove, quantity, and an email quote-request draft               |
| `/how-it-works`, `/help`    | The system in plain words, what is not confirmed yet, FAQ, and "ask about a room"                                                        |

## Where things live

- `src/data/designs.ts`: all 64 designs (60 records in the transformation record)
  with status, nominal size, rooms, activities, objects and images, plus the 53
  everyday situations. Generated once from the furnishes-house prototype, then
  maintained by hand.
- `src/data/recipes.ts`: the 13 parts recipes and the accessories.
- `src/data/claims.ts`: every statement that depends on an unconfirmed fact
  (price, lead time, delivery, assembly, fixing, fit, renders, saving, email
  drafts). Change wording or status here, not in pages.
- `src/data/market.ts`: Singapore, SGD, contact email, and `prices` (empty on
  purpose until real prices exist).
- `src/lib/parts.ts`: the part model. One configured recipe becomes positioned
  parts; the parts list, steps, kept/added/removed comparison and the SVG
  drawing (`src/components/Elevation.tsx`) all come from it.
- `src/lib/config.ts`: the configuration type's URL encoding and validation.
  Unsupported options in a link are dropped and explained, never swapped.
- `src/lib/explore.ts`: Explore matching and listing filters.
- `src/lib/saved.ts`: saved designs and quote-draft records in localStorage.
- `public/renders/`: object (`object/`), room (`room/`) and before (`before/`)
  renders for every design, copied from furnishes-house.

## Status of designs

- **Ready to configure** (11): parts and drawings are worked out. They can be
  customized within their options, saved and put in a quote request.
- **Concept** (53): shown with a clear label. They can be saved as ideas and
  asked about, never configured or quoted.

## Not connected yet

These are shown as honest states on the site, and need real data before they
become claims:

- Prices in SGD (add to `prices` in `src/data/market.ts`), lead times, delivery
  areas, assembly service, returns and warranty.
- Which designs are actually manufactured, and their final dimensions, panels
  and connectors (sizes and parts are nominal values from the records).
- Wall fixing, load ratings, and anything about seating, children or wet rooms.
- A service that receives quote requests. Today the site opens an email draft to
  hello@furnish-es.com; it cannot confirm that anything was sent.
- Accounts and cross-device saving (saved designs live in one browser).
- Payment and orders.
- Photography: all images are 3D renders of designs, labelled as such.
- Transformations between designs: part counts are computed from the drawings,
  but no conversion kit is offered, so they are shown as concepts.
