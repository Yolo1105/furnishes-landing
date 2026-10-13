"use client";

import Link from "next/link";
import { useState } from "react";
import { claims } from "@/data/claims";
import type { Configuration } from "@/data/types";
import { configKey } from "@/lib/config";
import { saveDesign, useLastResults, useSaved } from "@/lib/saved";
import styles from "./ProductActions.module.css";

type SaveState = "idle" | "saved" | "failed";

/** Save the exact version on screen (or the idea, for a concept). */
export function SaveButton({
  design,
  config,
  label,
  className = "btn btn-secondary",
}: {
  design: string;
  config: Configuration | null;
  label: string;
  className?: string;
}) {
  const { items } = useSaved();
  const [result, setResult] = useState<{
    key: string;
    state: SaveState;
  } | null>(null);
  const already = items.find(
    (e) =>
      e.design === design &&
      (config
        ? e.config && configKey(e.config) === configKey(config)
        : e.kind === "idea"),
  );

  // a confirmation belongs to the version it was given for
  const key = config ? configKey(config) : design;
  const state: SaveState = result?.key === key ? result.state : "idle";

  return (
    <div className={styles.save}>
      <button
        type="button"
        className={className}
        onClick={() =>
          setResult({
            key,
            state: saveDesign(design, config) ? "saved" : "failed",
          })
        }
      >
        {already ? "Save another copy" : label}
      </button>
      <p className={styles.status} role="status" aria-live="polite">
        {state === "failed" ? (
          "This browser won't let us save. Try a normal (not private) window, or copy the link."
        ) : state === "saved" || already ? (
          <>
            {state === "saved"
              ? "Saved in this browser. "
              : "This version is in your saved designs. "}
            <Link href="/saved">View saved designs</Link>
          </>
        ) : (
          <span className="muted">
            {claims.saved.label}. No account needed.
          </span>
        )}
      </p>
    </div>
  );
}

/** "Back to your results", when the visitor arrived from Explore or a filtered list. */
export function BackToResults({ design }: { design: string }) {
  const r = useLastResults();
  const back = r && r.designId === design ? r : null;
  if (!back) return null;
  return (
    <Link href={back.href} className={styles.back}>
      ← Back to your results <span className="muted">({back.label})</span>
    </Link>
  );
}
