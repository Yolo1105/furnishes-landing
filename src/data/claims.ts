import type { ProductStatus } from "./types";

/**
 * Every statement on the site that depends on a fact we do not have yet
 * lives here, with its current status. Pages read these strings; they do
 * not write their own promises. When a fact is confirmed, change it here.
 *
 * Source: the 13 documents of 2026-10-13/14 (decisions D1-D16). Price,
 * lead time, delivery, assembly time, load, returns and warranty are open
 * until the launch pieces' sample dossier holds real quotes and tests.
 */
export const claims = {
  price: {
    status: "open",
    label: "Price not set yet",
    detail:
      "Prices come after factory quotes and conversations with real buyers. Until then we don't show a price or an estimate.",
  },
  leadTime: {
    status: "open",
    label: "Timing not set yet",
  },
  delivery: {
    status: "open",
    label: "Delivery and assembly to be confirmed",
    detail:
      "Pieces are planned to arrive flat-packed with the steps shown here. Delivery, assembly help and timing are confirmed before you buy.",
  },
  assembly: {
    status: "model",
    label: "Steps from the modelling spec",
    detail:
      "These steps come from the launch pieces' modelling spec (v0). Sizes marked as assumptions there are replaced as samples are made, so the final instructions may differ.",
  },
  parts: {
    status: "model",
    label: "Parts from the modelling spec",
    detail:
      "Every part of this version, from the modelling spec (v0). Sizes are nominal; some are assumptions until the first samples are measured.",
  },
  stability: {
    status: "decided",
    label: "Widened base, counterweight and wall strap included",
    detail:
      "Pieces 1.2 m and taller that you hang things on come with a 60 cm deep steel base and a counterweight, and a wall strap in the box. Used within the stated hanging range they can stand without fixing; fix them with the strap whenever you want. Tip-over tests are still to come.",
  },
  fit: {
    status: "open",
    label: "Fit needs checking",
    detail:
      "This check uses nominal sizes. Skirting boards, doors and the way into the room are checked before you buy.",
  },
  renders: {
    status: "render",
    label: "Design renders",
    detail:
      "3D renders from the design model, not photographs. Things around the piece are not included. Real photographs replace them once samples exist.",
  },
  conceptRenders: {
    status: "earlier-render",
    label: "Earlier concept render",
    detail:
      "Drawn before the finishes were decided, so colours and materials differ from the launch pieces.",
  },
  accent: {
    status: "open",
    label: "Accent colour to be confirmed",
    detail:
      "Accessories and add-ons come in one agreed accent colour, shown here in orange. The final colour is chosen with the samples.",
  },
  hangingFace: {
    status: "testing",
    label: "Hanging face being chosen",
    detail:
      "Two ways to hang things are being compared on samples: locking pegs in the thick board, or a thin perforated face on spacers. Until then the face is drawn plain.",
  },
  draft: {
    status: "mail-draft",
    label: "Opens an email draft",
    detail:
      "This opens your email app with your saved versions written in. Nothing is sent until you send it, and we can only reply to emails we receive.",
  },
  saved: {
    status: "local",
    label: "Saved in this browser",
    detail:
      "Saved versions stay on this device and browser only. Clearing your browser data removes them; there is no account yet.",
  },
} as const;

export const statusInfo: Record<
  ProductStatus,
  { label: string; short: string; detail: string }
> = {
  launch: {
    label: "Launch piece",
    short: "Launch piece",
    detail:
      "One of the first three pieces, being made and tested now. Choose its version and save it. A price, what's in the box and ordering arrive once its samples, quotes and tests are done.",
  },
  soon: {
    label: "Coming soon",
    short: "Coming soon",
    detail:
      "Comes after the launch pieces, reusing a frame they prove. Explore it, save it, and register interest. No price or date yet.",
  },
};
