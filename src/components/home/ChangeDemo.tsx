"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { recipes } from "@/data/recipes";
import type { Configuration, Finish, Front } from "@/data/types";
import { configHref } from "@/lib/config";
import { changeTotals, compareParts, partCount, partsList } from "@/lib/parts";
import { STUDIO, studioSrc } from "@/lib/renders";
import styles from "./ChangeDemo.module.css";

const recipe = recipes.bedside;
const standard: Configuration = {
  design: "bedside",
  finish: "natural",
  front: "open",
  accessories: [],
  quantity: 1,
};

/**
 * One supported change on one piece, shown on a fixed camera: the image
 * crossfades between renders of the two versions, and the text says exactly
 * which parts the change adds or takes away.
 */
export function ChangeDemo() {
  const [config, setConfig] = useState(standard);
  const src = studioSrc("bedside", config);
  // keep every version's image mounted so the change crossfades in place
  const all = useMemo(
    () =>
      (["open", "doors"] as Front[]).flatMap((front) =>
        (["natural", "orange"] as Finish[]).map((finish) => ({
          finish,
          front,
          src: studioSrc("bedside", { finish, front, accessories: [] }),
        })),
      ),
    [],
  );
  const base = partsList(recipe, standard);
  const now = partsList(recipe, config);
  const t = changeTotals(compareParts(base, now));
  const changes = [
    config.front === "doors" ? "adds 1 door with its hinges" : null,
    config.finish === "orange" ? "turns the working face orange" : null,
  ].filter(Boolean);

  return (
    <div className={styles.demo}>
      <div className={styles.stage} aria-live="polite">
        {all.map((v) => (
          <Image
            key={v.src}
            src={v.src}
            alt={
              v.src === src
                ? `Bedside cabinet, ${v.front === "doors" ? "with a door" : "open front"}, ${v.finish === "orange" ? "orange" : "natural birch"} working face`
                : ""
            }
            width={STUDIO.w}
            height={STUDIO.h}
            sizes="(max-width: 900px) 90vw, 45vw"
            className={styles.img}
            data-on={v.src === src || undefined}
          />
        ))}
      </div>
      <div className={styles.panel}>
        <p className="label">Bedside cabinet · 60 × 40 × 40 cm</p>
        <fieldset className={styles.group}>
          <legend>Front</legend>
          <div className={styles.seg}>
            {(["open", "doors"] as Front[]).map((f) => (
              <label key={f}>
                <input
                  type="radio"
                  name="demo-front"
                  checked={config.front === f}
                  onChange={() => setConfig((c) => ({ ...c, front: f }))}
                />
                <span>{f === "open" ? "Open" : "With a door"}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.group}>
          <legend>Working face</legend>
          <div className={styles.seg}>
            {(["natural", "orange"] as Finish[]).map((f) => (
              <label key={f}>
                <input
                  type="radio"
                  name="demo-finish"
                  checked={config.finish === f}
                  onChange={() => setConfig((c) => ({ ...c, finish: f }))}
                />
                <span>
                  <span
                    className={styles.swatch}
                    data-finish={f}
                    aria-hidden="true"
                  />
                  {f === "natural" ? "Birch" : "Orange"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={styles.result} role="status">
          <p className={styles.resultLine}>
            {changes.length
              ? `This change ${changes.join(" and ")}.`
              : "The standard version."}
          </p>
          <p className="spec">
            {partCount(now)} parts · {t.kept} unchanged
            {t.added ? ` · ${t.added} added` : ""} · same size, same frame
          </p>
        </div>
        <Link
          href={configHref(config, "customize")}
          className="btn btn-primary"
        >
          Customize this version
        </Link>
      </div>
    </div>
  );
}
