"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Elevation } from "@/components/Elevation";
import { accessories, recipes } from "@/data/recipes";
import type { AccessoryId, Configuration, Finish } from "@/data/types";
import { configHref, finishName } from "@/lib/config";
import { compareParts, partCount, partsList } from "@/lib/parts";
import styles from "./VersionDemo.module.css";

const recipe = recipes.entry;
const standard: Configuration = {
  design: "entry",
  finish: "natural",
  front: "open",
  accessories: ["coat-hook", "key-tray"],
  quantity: 1,
};
const offered: AccessoryId[] = [
  ...recipe.defaultAccessories,
  ...recipe.optionalAccessories,
];

/** One real change on one real piece: the same part model the customizer uses. */
export function VersionDemo() {
  const [config, setConfig] = useState<Configuration>(standard);
  const base = useMemo(() => partsList(recipe, standard), []);
  const rows = useMemo(() => partsList(recipe, config), [config]);
  const diff = compareParts(base, rows);
  const added = diff
    .filter((d) => d.added)
    .map((d) => `${d.added} × ${d.name.toLowerCase()}`);
  const removed = diff
    .filter((d) => d.removed)
    .map((d) => `${d.removed} × ${d.name.toLowerCase()}`);

  const toggle = (a: AccessoryId) =>
    setConfig((c) => ({
      ...c,
      accessories: c.accessories.includes(a)
        ? c.accessories.filter((x) => x !== a)
        : [...c.accessories, a].sort(),
    }));

  return (
    <div className={styles.demo}>
      <div className={styles.drawing}>
        <Elevation
          recipe={recipe}
          config={config}
          uid="home-demo"
          title="Entry organiser, front"
        />
      </div>
      <div className={styles.controls}>
        <fieldset>
          <legend>Accessories</legend>
          {offered.map((a) => (
            <label key={a} className={styles.option}>
              <input
                type="checkbox"
                checked={config.accessories.includes(a)}
                onChange={() => toggle(a)}
              />
              {accessories[a].name}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Working face</legend>
          {(["natural", "orange"] as Finish[]).map((f) => (
            <label key={f} className={styles.option}>
              <input
                type="radio"
                name="demo-finish"
                checked={config.finish === f}
                onChange={() => setConfig((c) => ({ ...c, finish: f }))}
              />
              {finishName(f)}
            </label>
          ))}
        </fieldset>
        <div className={styles.result} aria-live="polite">
          <p className={styles.resultTitle}>
            Same piece, 60 × 120 × 40 cm, {partCount(rows)} parts
          </p>
          <p>
            {added.length || removed.length || config.finish !== "natural"
              ? [
                  added.length ? `Adds ${added.join(", ")}` : "",
                  removed.length ? `Leaves out ${removed.join(", ")}` : "",
                  config.finish !== "natural" ? "Orange working face" : "",
                ]
                  .filter(Boolean)
                  .join(". ") + "."
              : "This is the standard version."}
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
