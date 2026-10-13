import type { DesignStatus } from "./types";

/**
 * Every statement on the site that depends on a fact we do not have yet
 * lives here, with its current status. Pages read these strings; they do
 * not write their own promises. When a fact is confirmed, change it here.
 *
 * Source: the 13 planning documents (2026-10-02) mark price, lead time,
 * delivery, assembly time, fixing, load, returns and warranty as open.
 */
export const claims = {
  price: {
    status: "open",
    label: "Price on request",
    detail:
      "Prices are not set yet. Send a quote request and we reply with a price for the exact version you saved.",
  },
  leadTime: {
    status: "open",
    label: "Lead time confirmed with your quote",
  },
  delivery: {
    status: "open",
    label: "Delivery and assembly options confirmed with your quote",
    detail:
      "Pieces are planned to arrive flat-packed. Whether we deliver to your area, and whether assembly is included, is confirmed with your quote.",
  },
  assembly: {
    status: "illustrative",
    label: "Assembly steps are illustrative",
    detail:
      "The steps below follow the part model of this version. They are not final instructions; the real ones come with the order.",
  },
  parts: {
    status: "nominal",
    label: "Nominal parts list",
    detail:
      "Counted from the drawing of this version. Panel sizes are nominal and connectors are not all listed yet.",
  },
  fixing: {
    status: "open",
    label: "Wall fixing confirmed with your quote",
    detail:
      "Taller pieces may need fixing against tipping. We confirm what your version needs before you order.",
  },
  fit: {
    status: "open",
    label: "Fit requires confirmation",
    detail:
      "This check uses the nominal size of the piece. Skirting boards, doors and the way in to the room are confirmed with your quote.",
  },
  renders: {
    status: "concept-imagery",
    label: "Rendered images",
    detail:
      "These are 3D renders of the design, not photographs of a finished product. Objects shown on and around it are not included.",
  },
  quoteDraft: {
    status: "mail-draft",
    label: "Opens an email draft",
    detail:
      "This opens your email app with your saved designs written in. Nothing is sent until you send it, and we can only reply to emails we receive.",
  },
  saved: {
    status: "local",
    label: "Saved in this browser",
    detail:
      "Saved designs stay on this device and browser only. Clearing your browser data removes them; there is no account yet.",
  },
} as const;

export const statusInfo: Record<
  DesignStatus,
  { label: string; short: string; detail: string }
> = {
  configurable: {
    label: "Ready to configure",
    short: "Configurable",
    detail:
      "Parts and drawings are worked out. Adjust it within its options, save it, and ask for a quote. Price and lead time come with the quote.",
  },
  concept: {
    label: "Concept",
    short: "Concept",
    detail:
      "A direction we are still developing. Save it as an idea or ask about it. It cannot be configured or quoted as a product yet.",
  },
};
