"use client";

import { useId, useState } from "react";
import { claims } from "@/data/claims";
import type { Size } from "@/data/types";
import styles from "./FitCheck.module.css";

const DIMS = [
  { key: "w", label: "Width of the space" },
  { key: "h", label: "Height available" },
  { key: "d", label: "Depth available" },
] as const;

/**
 * A quick check of the nominal size against the visitor's space. It only
 * compares numbers; the answer is always "fit requires confirmation".
 */
export function FitCheck({ size, name }: { size: Size; name: string }) {
  const id = useId();
  const [space, setSpace] = useState<Record<"w" | "h" | "d", string>>({
    w: "",
    h: "",
    d: "",
  });
  const filled = DIMS.filter(
    (d) => space[d.key] !== "" && Number(space[d.key]) > 0,
  );

  return (
    <div className={styles.fit}>
      <fieldset className={styles.fields}>
        <legend>Your space, in centimetres</legend>
        {DIMS.map((d) => (
          <label key={d.key} htmlFor={`${id}-${d.key}`}>
            <span>{d.label}</span>
            <input
              id={`${id}-${d.key}`}
              type="number"
              inputMode="decimal"
              min={1}
              max={1000}
              value={space[d.key]}
              onChange={(e) =>
                setSpace((s) => ({ ...s, [d.key]: e.target.value }))
              }
            />
          </label>
        ))}
      </fieldset>
      <div className={styles.result} aria-live="polite">
        {filled.length === 0 ? (
          <p className="muted">
            Enter any of the three to compare with the {name.toLowerCase()} (
            {size.w / 10} × {size.h / 10} × {size.d / 10} cm).
          </p>
        ) : (
          <ul role="list">
            {filled.map((d) => {
              const have = Number(space[d.key]);
              const need = size[d.key] / 10;
              const diff = Math.round((have - need) * 10) / 10;
              const ok = diff >= 0;
              return (
                <li key={d.key} data-ok={ok}>
                  <strong>{ok ? "Room to spare" : "Too small"}:</strong>{" "}
                  {d.label.toLowerCase()} {have} cm, piece {need} cm
                  {ok
                    ? ` (${diff} cm left over)`
                    : ` (${Math.abs(diff)} cm short)`}
                </li>
              );
            })}
          </ul>
        )}
        <p className={styles.note}>
          <strong>{claims.fit.label}.</strong> {claims.fit.detail}
        </p>
      </div>
    </div>
  );
}
