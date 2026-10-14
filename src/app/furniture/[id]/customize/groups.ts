/** The configurator's four groups, in order; shared by the page and the client. */
export const GROUPS = ["fit", "function", "finish", "review"] as const;
export type Group = (typeof GROUPS)[number];

export const parseGroup = (v: unknown): Group =>
  typeof v === "string" && (GROUPS as readonly string[]).includes(v)
    ? (v as Group)
    : "fit";
