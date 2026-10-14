"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { claims } from "@/data/claims";
import { choosableKits, kitById, testingKits } from "@/data/hero";
import type { Configuration, FaceType, KitId } from "@/data/types";
import { fullSizeLabel, getProduct } from "@/lib/catalog";
import {
  configHref,
  configKey,
  configParams,
  configSummary,
  defaultConfig,
  facesFor,
  faceName,
  MAX_QUANTITY,
  swapPack,
} from "@/lib/config";
import { heroImage, STUDIO } from "@/lib/renders";
import { saveDesign, updateSaved, useSaved } from "@/lib/saved";
import { changes, partRows, partTotal } from "@/lib/version";
import styles from "./customize.module.css";

type Note = { key: string; text: "saved" | "updated" | "failed" };

/**
 * Select configuration for a launch piece. One stable picture of the
 * version (the camera never moves), the choices beside it, and what the
 * version is made of below. Every change is in the address bar, so a
 * refresh or a shared link restores it; undo and redo walk the history.
 */
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
  const product = getProduct(designId)!;
  const { items } = useSaved();
  const editing = savedId
    ? items.find((e) => e.id === savedId && e.design === designId)
    : undefined;
  const [history, setHistory] = useState({ list: [initial], at: 0 });
  const config = history.list[history.at]!;
  const [message, setMessage] = useState("");
  const [note, setNote] = useState<Note | null>(null);

  const kits = choosableKits(config.design);
  const testing = testingKits(config.design);
  const faces = facesFor(config.design);
  const img = heroImage(config);
  const rows = useMemo(() => partRows(config), [config]);
  const delta = useMemo(() => changes(config), [config]);
  const other = swapPack(config);
  const standard = defaultConfig(product)!;

  // the address bar holds the exact version
  useEffect(() => {
    const q = configParams(config);
    if (savedId) q.set("saved", savedId);
    const qs = q.toString();
    const href = `/furniture/${designId}/customize${qs ? `?${qs}` : ""}`;
    if (window.location.pathname + window.location.search !== href)
      window.history.replaceState(window.history.state, "", href);
  }, [config, designId, savedId]);

  const apply = (next: Configuration, said: string) => {
    if (
      configKey(next) === configKey(config) &&
      next.quantity === config.quantity
    )
      return;
    setMessage(said);
    setHistory((h) => ({
      list: [...h.list.slice(0, h.at + 1), next],
      at: h.at + 1,
    }));
  };
  const toggleKit = (k: KitId) => {
    const on = config.kits.includes(k);
    const kitsNext = on
      ? config.kits.filter((x) => x !== k)
      : [...config.kits, k].sort();
    let quantity = config.quantity;
    if (k === "K-B4" && !on && quantity < 2) quantity = 2;
    const name = kitById.get(k)!.name;
    apply(
      { ...config, kits: kitsNext, quantity },
      on
        ? `Removed: ${name}.`
        : `Added: ${name}.${quantity !== config.quantity ? " Quantity is now 2." : ""}`,
    );
  };
  const setFace = (f: FaceType) =>
    apply({ ...config, face: f }, `Faces: ${faceName(f).toLowerCase()}.`);
  const setQty = (n: number) =>
    apply(
      {
        ...config,
        quantity: Math.min(
          MAX_QUANTITY,
          Math.max(config.kits.includes("K-B4") ? 2 : 1, n),
        ),
      },
      `Quantity ${n}.`,
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

  const savedNote =
    note?.key === configKey(config) + config.quantity ? note.text : null;
  const save = (update: boolean) =>
    setNote({
      key: configKey(config) + config.quantity,
      text: update
        ? updateSaved(editing!.id, config)
          ? "updated"
          : "failed"
        : saveDesign(designId, config)
          ? "saved"
          : "failed",
    });

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.head}>
        <Link href={`/furniture/${designId}`} className={styles.back}>
          ← {product.name}
        </Link>
        <h1 className={styles.title}>Select configuration</h1>
        {issues.length > 0 && (
          <div className="notice" role="note">
            {issues.map((i) => (
              <p key={i}>{i}</p>
            ))}
          </div>
        )}
        {editing && (
          <p className={styles.editing}>
            You are changing a version saved on{" "}
            {new Date(editing.savedAt).toLocaleDateString("en-SG")}. Update it,
            or keep it as a new version.
          </p>
        )}
      </header>

      <div className={styles.layout}>
        <div className={styles.preview}>
          <figure className={styles.stage}>
            <Image
              key={img.src}
              src={img.src}
              alt={`${product.name}, ${configSummary(config).toLowerCase()}`}
              width={STUDIO.w}
              height={STUDIO.h}
              sizes="(max-width: 900px) 60vw, 40vw"
              preload
              className={styles.img}
            />
          </figure>
          {img.missing.length > 0 ? (
            <p className={styles.pending}>
              <strong>Picture pending for:</strong> {img.missing.join(", ")}.
              The picture shows the rest of this version; the parts below
              include them.
            </p>
          ) : (
            <p className={styles.caption}>
              Design render · {claims.accent.label.toLowerCase()}
            </p>
          )}
          <p className={styles.sentence} aria-live="polite">
            <span className="label">Your version</span>
            <strong>
              {product.name}: {configSummary(config).toLowerCase()}
            </strong>
            <span className="spec">
              {fullSizeLabel(product)} · {partTotal(rows)} parts · quantity{" "}
              {config.quantity}
            </span>
          </p>
        </div>

        <div className={styles.choices}>
          <div className={styles.toolbar}>
            <button
              type="button"
              onClick={undo}
              disabled={history.at === 0}
              className="btn btn-quiet"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={history.at >= history.list.length - 1}
              className="btn btn-quiet"
            >
              Redo
            </button>
            <p className={styles.live} role="status" aria-live="polite">
              {message}
            </p>
          </div>

          {other && (
            <section className={styles.group} aria-labelledby="g-pack">
              <h2 id="g-pack">Pack</h2>
              <p className={styles.help}>
                Same frame, another pack. Changing packs takes new parts and one
                assembly.
              </p>
              <div className={styles.seg} role="group" aria-label="Pack">
                <span className={styles.on} aria-current="true">
                  ✓ {product.name.split(", ")[1] ?? product.name}
                </span>
                <Link
                  href={configHref(other, "customize")}
                  className={styles.off}
                >
                  {getProduct(other.design)!.name.split(", ")[1]}
                </Link>
              </div>
            </section>
          )}

          <section className={styles.group} aria-labelledby="g-addons">
            <h2 id="g-addons">Add-ons</h2>
            <p className={styles.help}>
              They fit the ports made in the factory. Nothing is drilled at
              home.
            </p>
            <ul role="list" className={styles.options}>
              {kits.map((k) => {
                const on = config.kits.includes(k.id);
                return (
                  <li key={k.id}>
                    <label className={styles.option} data-on={on || undefined}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleKit(k.id)}
                      />
                      <span className={styles.box} aria-hidden="true">
                        {on ? "✓" : ""}
                      </span>
                      <span>
                        <strong>{k.name}</strong>
                        <span className={styles.what}>
                          {k.line} Adds {k.adds.join(", ").toLowerCase()}
                          {k.removes.length
                            ? `; takes off ${k.removes.join(", ").toLowerCase()}`
                            : ""}
                          .
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
              {testing.map((k) => (
                <li key={k.id}>
                  <div className={styles.option} data-testing>
                    <span className={styles.box} aria-hidden="true" />
                    <span>
                      <strong>{k.name}</strong>{" "}
                      <span className={styles.tag}>In testing</span>
                      <span className={styles.what}>{k.line}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {faces.length > 1 && (
            <section className={styles.group} aria-labelledby="g-face">
              <h2 id="g-face">Faces</h2>
              <p className={styles.help}>
                The three face panels slide out from the top; another face type
                slides in.
              </p>
              <div
                className={styles.seg}
                role="radiogroup"
                aria-labelledby="g-face"
              >
                {faces.map((f) => (
                  <label
                    key={f}
                    className={config.face === f ? styles.on : styles.off}
                  >
                    <input
                      type="radio"
                      name="face"
                      checked={config.face === f}
                      onChange={() => setFace(f)}
                      className="visually-hidden"
                    />
                    {config.face === f ? "✓ " : ""}
                    {faceName(f)}
                  </label>
                ))}
              </div>
            </section>
          )}

          <section className={styles.group} aria-labelledby="g-qty">
            <h2 id="g-qty">Quantity</h2>
            <div className={styles.qty}>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => setQty(config.quantity - 1)}
                aria-label="One fewer"
              >
                −
              </button>
              <output aria-live="polite" className="spec">
                {config.quantity}
              </output>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => setQty(config.quantity + 1)}
                aria-label="One more"
              >
                +
              </button>
            </div>
          </section>

          <section className={styles.group} aria-labelledby="g-change">
            <h2 id="g-change">What changes</h2>
            {delta.added.length + delta.removed.length === 0 ? (
              <p className={styles.help}>This is the standard version.</p>
            ) : (
              <ul className={styles.delta}>
                {delta.added.map((a) => (
                  <li key={`a-${a}`} data-kind="add">
                    Adds {a.toLowerCase()}
                  </li>
                ))}
                {delta.removed.map((r) => (
                  <li key={`r-${r}`} data-kind="remove">
                    Takes off {r.toLowerCase()}
                  </li>
                ))}
              </ul>
            )}
            {configKey(config) !== configKey(standard) && (
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  apply(
                    { ...standard, quantity: config.quantity },
                    "Back to the standard version.",
                  )
                }
              >
                Back to the standard version
              </button>
            )}
          </section>

          <div className={styles.save}>
            {editing ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => save(true)}
                >
                  Update this version
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => save(false)}
                >
                  Keep as a new version
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => save(false)}
              >
                Keep this version
              </button>
            )}
            <p role="status" aria-live="polite" className={styles.savedNote}>
              {savedNote === "failed" ? (
                "This browser won't let us save. Try a normal window, or copy the link."
              ) : savedNote ? (
                <>
                  {savedNote === "updated"
                    ? "Updated."
                    : "Kept in this browser."}{" "}
                  <Link href="/saved">See saved versions</Link>
                </>
              ) : (
                `${claims.saved.label}. ${claims.price.label}.`
              )}
            </p>
          </div>
        </div>
      </div>

      <section className={styles.parts} aria-labelledby="g-parts">
        <h2 id="g-parts">What this version is made of</h2>
        <p className={styles.help}>
          {claims.parts.detail} For each of {config.quantity}.
        </p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col">Qty</th>
              <th scope="col">Material</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} data-from={r.from}>
                <td>{r.name}</td>
                <td className="spec">{r.quantity}</td>
                <td>{r.material}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
