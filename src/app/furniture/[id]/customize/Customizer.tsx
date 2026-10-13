"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PriceState } from "@/components/bits";
import { Elevation } from "@/components/Elevation";
import { claims } from "@/data/claims";
import { accessories } from "@/data/recipes";
import type { AccessoryId, Configuration, Finish, Front } from "@/data/types";
import { getDesign, images, recipeOf, sizeLabel } from "@/lib/catalog";
import {
  allowedAccessories,
  configHref,
  configKey,
  configParams,
  configSummary,
  defaultConfig,
  finishName,
  MAX_QUANTITY,
} from "@/lib/config";
import {
  compareParts,
  isMobile,
  partCount,
  partsList,
  type PartChange,
} from "@/lib/parts";
import { saveDesign, updateSaved, useSaved } from "@/lib/saved";
import styles from "./customize.module.css";

type Group = "fit" | "function" | "finish" | "review";
const GROUPS: { id: Group; label: string }[] = [
  { id: "fit", label: "Fit" },
  { id: "function", label: "Function" },
  { id: "finish", label: "Finish" },
  { id: "review", label: "Review" },
];

function describeChanges(changes: PartChange[]) {
  const on = changes
    .filter((c) => c.added)
    .map((c) => `${c.added} × ${c.name.toLowerCase()}`);
  const off = changes
    .filter((c) => c.removed)
    .map((c) => `${c.removed} × ${c.name.toLowerCase()}`);
  return { on, off };
}

export function Customizer({
  designId,
  initial,
  issues,
  savedId,
}: {
  designId: string;
  initial: Configuration;
  issues: string[];
  savedId: string | null;
}) {
  const design = getDesign(designId)!;
  const recipe = recipeOf(design)!;
  const { items } = useSaved();
  const editing = savedId
    ? items.find((e) => e.id === savedId && e.design === designId)
    : undefined;

  const [history, setHistory] = useState<{ list: Configuration[]; at: number }>(
    {
      list: [initial],
      at: 0,
    },
  );
  const config = history.list[history.at]!;
  const previous = history.at > 0 ? history.list[history.at - 1]! : null;
  const [group, setGroup] = useState<Group>("function");
  const [message, setMessage] = useState<string>("");
  const [note, setNote] = useState<{
    key: string;
    text: "saved" | "updated" | "failed";
  } | null>(null);

  const standard = useMemo(() => defaultConfig(design)!, [design]);
  const rows = useMemo(() => partsList(recipe, config), [recipe, config]);
  const vsStandard = useMemo(
    () => describeChanges(compareParts(partsList(recipe, standard), rows)),
    [recipe, standard, rows],
  );
  const fresh = useMemo(() => {
    if (!previous) return [];
    return compareParts(partsList(recipe, previous), rows)
      .filter((c) => c.added > 0)
      .map((c) => c.partId);
  }, [previous, recipe, rows]);

  // keep the address bar on the exact version, so refresh and sharing restore it
  useEffect(() => {
    const q = configParams(config);
    if (savedId) q.set("saved", savedId);
    const qs = q.toString();
    const href = `/furniture/${designId}/customize${qs ? `?${qs}` : ""}`;
    // the native history API keeps Next's router in sync without a server round trip
    if (window.location.pathname + window.location.search !== href)
      window.history.replaceState(window.history.state, "", href);
  }, [config, designId, savedId]);

  // a save confirmation belongs to the version it was given for
  const savedNote = note?.key === configKey(config) ? note.text : "";
  const setSavedNote = (text: "saved" | "updated" | "failed") =>
    setNote({ key: configKey(config), text });

  const apply = useCallback(
    (next: Configuration) => {
      if (configKey(next) === configKey(config)) return;
      const { on, off } = describeChanges(
        compareParts(partsList(recipe, config), partsList(recipe, next)),
      );
      const parts = [
        on.length ? `Added ${on.join(", ")}` : "",
        off.length ? `Removed ${off.join(", ")}` : "",
        next.finish !== config.finish
          ? `Finish: ${finishName(next.finish).toLowerCase()}`
          : "",
        next.quantity !== config.quantity ? `Quantity ${next.quantity}` : "",
      ].filter(Boolean);
      setMessage(parts.join(". ") + ".");
      setHistory((h) => ({
        list: [...h.list.slice(0, h.at + 1), next],
        at: h.at + 1,
      }));
    },
    [config, recipe],
  );

  const undo = () => {
    if (history.at === 0) return;
    setHistory((h) => ({ ...h, at: h.at - 1 }));
    setMessage("Undone.");
  };
  const redo = () => {
    if (history.at >= history.list.length - 1) return;
    setHistory((h) => ({ ...h, at: h.at + 1 }));
    setMessage("Redone.");
  };

  const setFinish = (finish: Finish) => apply({ ...config, finish });
  const setFront = (front: Front) => apply({ ...config, front });
  const toggleAccessory = (a: AccessoryId) =>
    apply({
      ...config,
      accessories: config.accessories.includes(a)
        ? config.accessories.filter((x) => x !== a)
        : [...config.accessories, a].sort(),
    });
  const setQty = (quantity: number) =>
    apply({
      ...config,
      quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)),
    });

  const isStandard =
    configKey({ ...config, quantity: 1 }) === configKey(standard);
  const offered = allowedAccessories(recipe);
  const notOffered = (Object.keys(accessories) as AccessoryId[]).filter(
    (a) => !offered.includes(a),
  );
  const groupIndex = GROUPS.findIndex((g) => g.id === group);

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.headRow}>
        <Link href={configHref(config, "product")} className={styles.back}>
          ← Back to the {design.name.toLowerCase()}
        </Link>
        <div className={styles.history}>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={undo}
            disabled={history.at === 0}
          >
            Undo
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={redo}
            disabled={history.at >= history.list.length - 1}
          >
            Redo
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => apply({ ...standard, quantity: config.quantity })}
            disabled={isStandard}
          >
            Reset to standard
          </button>
        </div>
      </div>

      <div className={styles.layout}>
        <section className={styles.preview} aria-label="Preview">
          <div className={styles.drawing}>
            <Elevation
              recipe={recipe}
              config={config}
              uid="cz"
              fresh={fresh}
              title={`${design.name}, your version, front`}
            />
          </div>
          <div className={styles.previewMeta}>
            <div>
              <p className="eyebrow">Customizing</p>
              <h1 className={styles.title}>{design.name}</h1>
              <p className={styles.summary}>{configSummary(config)}</p>
              <p className={`${styles.summary} num`}>
                {sizeLabel(design.size)} nominal · {partCount(rows)} parts
                {config.quantity > 1 ? ` · × ${config.quantity}` : ""}
              </p>
            </div>
            <figure className={styles.ref}>
              <Image
                src={images.object(design.id)}
                alt={`${design.name}, standard version render`}
                width={design.image.object.w}
                height={design.image.object.h}
                sizes="96px"
              />
              <figcaption>Render shows the standard version</figcaption>
            </figure>
          </div>
          <p className={styles.live} role="status" aria-live="polite">
            {message || "Your changes show in the drawing as you choose."}
          </p>
        </section>

        <section className={styles.controls} aria-label="Choices">
          {issues.length > 0 && (
            <div className="notice" role="status">
              {issues.map((i) => (
                <p key={i}>{i}</p>
              ))}
            </div>
          )}
          {editing && (
            <p className={styles.editing}>
              Editing a saved design from{" "}
              {new Date(editing.savedAt).toLocaleDateString("en-SG")}. Changes
              are kept only when you update it or save a copy.
            </p>
          )}

          <div
            className={styles.tabs}
            role="tablist"
            aria-label="Choice groups"
          >
            {GROUPS.map((g, i) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                id={`tab-${g.id}`}
                aria-selected={group === g.id}
                aria-controls={`panel-${g.id}`}
                tabIndex={group === g.id ? 0 : -1}
                className={styles.tab}
                onClick={() => setGroup(g.id)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  const next =
                    GROUPS[
                      (i + (e.key === "ArrowRight" ? 1 : GROUPS.length - 1)) %
                        GROUPS.length
                    ]!;
                  setGroup(next.id);
                  document.getElementById(`tab-${next.id}`)?.focus();
                }}
              >
                <span className={styles.tabNum}>{i + 1}</span> {g.label}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`panel-${group}`}
            aria-labelledby={`tab-${group}`}
            className={styles.panel}
            tabIndex={0}
          >
            {group === "fit" && (
              <div className={styles.group}>
                <h2 className={styles.groupTitle}>Fit</h2>
                <dl className={styles.facts}>
                  <div>
                    <dt>Size</dt>
                    <dd className="num">
                      {sizeLabel(design.size)} (W × H × D, nominal)
                    </dd>
                  </div>
                  <div>
                    <dt>Base</dt>
                    <dd>
                      {isMobile(recipe)
                        ? "On four casters"
                        : "On adjustable pads"}
                    </dd>
                  </div>
                </dl>
                <div className={styles.unavailable}>
                  <p>
                    <strong>Other sizes aren&apos;t offered yet.</strong> This
                    piece comes in one size while its parts are being finalised.
                  </p>
                </div>
                <p className="muted">{recipe.space}</p>
                <p className="muted">
                  {claims.fit.label}. {claims.fit.detail}
                </p>
              </div>
            )}

            {group === "function" && (
              <div className={styles.group}>
                <h2 className={styles.groupTitle}>Function</h2>
                <fieldset className={styles.fieldset}>
                  <legend>Front</legend>
                  <div className={styles.choices}>
                    {(["open", "doors"] as Front[]).map((f) => {
                      const ok = f === "open" || recipe.doors;
                      return (
                        <label
                          key={f}
                          className={styles.choice}
                          data-disabled={!ok || undefined}
                        >
                          <input
                            type="radio"
                            name="front"
                            value={f}
                            checked={config.front === f}
                            disabled={!ok}
                            onChange={() => setFront(f)}
                          />
                          <span>
                            <strong>
                              {f === "open" ? "Open front" : "With doors"}
                            </strong>
                            <span className={styles.hint}>
                              {f === "open"
                                ? "Everything in view and in reach."
                                : ok
                                  ? "One door per bay, hinged on the side panels."
                                  : "Not offered on this piece: there are no door parts for it yet."}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset className={styles.fieldset}>
                  <legend>Accessories</legend>
                  {offered.length === 0 && (
                    <p className="muted">
                      No accessories are offered on this piece yet.
                    </p>
                  )}
                  <div className={styles.choices}>
                    {offered.map((a) => (
                      <label key={a} className={styles.choice}>
                        <input
                          type="checkbox"
                          checked={config.accessories.includes(a)}
                          onChange={() => toggleAccessory(a)}
                        />
                        <span>
                          <strong>{accessories[a].name}</strong>
                          <span className={styles.hint}>
                            {accessories[a].description}
                            {recipe.defaultAccessories.includes(a)
                              ? " Part of the standard version."
                              : ""}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {notOffered.length > 0 && (
                    <p className={styles.notOffered}>
                      Not for this piece:{" "}
                      {notOffered.map((a) => accessories[a].name).join(", ")}.
                      They are made for other frames.
                    </p>
                  )}
                </fieldset>
              </div>
            )}

            {group === "finish" && (
              <div className={styles.group}>
                <h2 className={styles.groupTitle}>Finish</h2>
                <fieldset className={styles.fieldset}>
                  <legend>Working face</legend>
                  <div className={styles.swatches}>
                    {(["natural", "orange"] as Finish[]).map((f) => {
                      const ok = f === "natural" || recipe.orangeFace;
                      return (
                        <label
                          key={f}
                          className={styles.swatch}
                          data-disabled={!ok || undefined}
                        >
                          <input
                            type="radio"
                            name="finish"
                            value={f}
                            checked={config.finish === f}
                            disabled={!ok}
                            onChange={() => setFinish(f)}
                          />
                          <span
                            className={styles.chip}
                            data-finish={f}
                            aria-hidden="true"
                          />
                          <span>
                            <strong>{finishName(f)}</strong>
                            <span className={styles.hint}>
                              {f === "natural"
                                ? "Birch plywood throughout."
                                : ok
                                  ? "The panel with the holes in orange; the rest stays birch."
                                  : "Not offered: this piece has no working face."}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <p className="muted">
                  Screens show colour differently. Finish samples are not
                  available to order yet.
                </p>
              </div>
            )}

            {group === "review" && (
              <div className={styles.group}>
                <h2 className={styles.groupTitle}>Review</h2>
                <dl className={styles.facts}>
                  <div>
                    <dt>Piece</dt>
                    <dd>
                      {design.name}{" "}
                      <span className="muted">design {design.record}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Size</dt>
                    <dd className="num">{sizeLabel(design.size)} nominal</dd>
                  </div>
                  <div>
                    <dt>Finish</dt>
                    <dd>
                      {finishName(config.finish)}{" "}
                      <button
                        type="button"
                        className={styles.edit}
                        onClick={() => setGroup("finish")}
                      >
                        Edit
                      </button>
                    </dd>
                  </div>
                  <div>
                    <dt>Function</dt>
                    <dd>
                      {configSummary(config).split(" · ").slice(1).join(" · ")}{" "}
                      <button
                        type="button"
                        className={styles.edit}
                        onClick={() => setGroup("function")}
                      >
                        Edit
                      </button>
                    </dd>
                  </div>
                  <div>
                    <dt>Compared with standard</dt>
                    <dd>
                      {isStandard
                        ? "This is the standard version."
                        : [
                            vsStandard.on.length
                              ? `Adds ${vsStandard.on.join(", ")}`
                              : "",
                            vsStandard.off.length
                              ? `Leaves out ${vsStandard.off.join(", ")}`
                              : "",
                            config.finish !== standard.finish
                              ? "Orange working face"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(". ")}
                    </dd>
                  </div>
                  <div>
                    <dt>Included</dt>
                    <dd>
                      {partCount(rows)} parts, listed on the product page.{" "}
                      <span className="muted">
                        Objects in the images are not included.
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Quantity</dt>
                    <dd>
                      <div className={styles.qty}>
                        <button
                          type="button"
                          aria-label="One fewer"
                          onClick={() => setQty(config.quantity - 1)}
                          disabled={config.quantity <= 1}
                        >
                          −
                        </button>
                        <output aria-live="polite" className="num">
                          {config.quantity}
                        </output>
                        <button
                          type="button"
                          aria-label="One more"
                          onClick={() => setQty(config.quantity + 1)}
                          disabled={config.quantity >= MAX_QUANTITY}
                        >
                          +
                        </button>
                      </div>
                    </dd>
                  </div>
                  <div>
                    <dt>Price</dt>
                    <dd>
                      <PriceState design={design} />{" "}
                      <span className="muted">· {claims.leadTime.label}</span>
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {groupIndex < GROUPS.length - 1 && (
              <button
                type="button"
                className={`btn btn-secondary ${styles.next}`}
                onClick={() => setGroup(GROUPS[groupIndex + 1]!.id)}
              >
                Next: {GROUPS[groupIndex + 1]!.label}
              </button>
            )}
          </div>

          <div className={styles.outcome}>
            <p className={styles.outcomePrice}>
              <PriceState design={design} />
              <span className="muted">
                {" "}
                · Save this version, then ask for a quote from Saved designs.
              </span>
            </p>
            <div className={styles.outcomeActions}>
              {editing ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      setSavedNote(
                        updateSaved(editing.id, config) ? "updated" : "failed",
                      )
                    }
                  >
                    Update saved design
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setSavedNote(
                        saveDesign(design.id, config) ? "saved" : "failed",
                      )
                    }
                  >
                    Save as a new copy
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    setSavedNote(
                      saveDesign(design.id, config) ? "saved" : "failed",
                    )
                  }
                >
                  Save this version
                </button>
              )}
            </div>
            <p className={styles.savedNote} role="status" aria-live="polite">
              {savedNote === "saved" && (
                <>
                  Saved in this browser.{" "}
                  <Link href="/saved">Go to saved designs</Link> to compare or
                  ask for a quote.
                </>
              )}
              {savedNote === "updated" && (
                <>
                  Saved design updated.{" "}
                  <Link href="/saved">Go to saved designs</Link>
                </>
              )}
              {savedNote === "failed" &&
                "This browser won't let us save. Try a normal window, or copy the address of this page."}
              {savedNote === "" && (
                <span className="muted">{claims.saved.detail}</span>
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
