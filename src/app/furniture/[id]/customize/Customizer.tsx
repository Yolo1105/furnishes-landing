"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { claims } from "@/data/claims";
import { choosableKits, kitById, testingKits, type Kit } from "@/data/hero";
import type { Configuration, FaceType, HeroId, KitId } from "@/data/types";
import { getProduct } from "@/lib/catalog";
import {
  configHref,
  configKey,
  configParams,
  configSummary,
  defaultConfig,
  faceName,
  MAX_QUANTITY,
  swapPack,
} from "@/lib/config";
import { heroImage, STUDIO } from "@/lib/renders";
import { saveDesign, updateSaved, useSaved } from "@/lib/saved";
import { changes, footprint, partRows, partTotal } from "@/lib/version";
import styles from "./customize.module.css";
import { GROUPS, type Group } from "./groups";

type Note = { key: string; text: "saved" | "updated" | "failed" | "copied" };

const TITLE: Record<Group, string> = {
  fit: "Fit",
  function: "Function",
  finish: "Finish",
  review: "Review",
};

/** Add-ons that change the floor space a version takes: chosen under Fit. */
const FIT_KITS: KitId[] = ["K-E2", "K-D1", "K-B4"];

const cm = (mm: number) => `${Math.round(mm / 10)}`;
const packName = (design: HeroId) => {
  const name = getProduct(design)!.name;
  const pack = name.split(", ")[1] ?? name;
  return pack.charAt(0).toUpperCase() + pack.slice(1);
};

/**
 * Select configuration for a launch piece, in four groups: Fit (floor
 * space and how many), Function (pack and add-ons), Finish (faces and the
 * fixed materials) and Review (what changes, then keep it). One group is
 * open at a time; a closed group still says what is chosen in it. The
 * picture keeps one camera and says when it can't show a choice. Every
 * change and the open group are in the address bar, so a refresh or a
 * shared link restores both.
 */
export function Customizer({
  designId,
  initial,
  initialGroup,
  issues,
  savedId,
}: {
  designId: string;
  initial: Configuration;
  initialGroup: Group;
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
  const [open, setOpen] = useState<Group | null>(initialGroup);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState<Note | null>(null);

  const kits = choosableKits(config.design);
  const fitKits = kits.filter((k) => FIT_KITS.includes(k.id));
  const useKits = kits.filter((k) => !FIT_KITS.includes(k.id));
  const testing = testingKits(config.design);
  const img = heroImage(config);
  const rows = useMemo(() => partRows(config), [config]);
  const delta = useMemo(() => changes(config), [config]);
  const space = footprint(config);
  const other = swapPack(config);
  const standard = defaultConfig(product)!;
  const minQty = config.kits.includes("K-B4") ? 2 : 1;
  const isStandard = configKey(config) === configKey(standard);

  // the address bar holds the exact version and the open group
  useEffect(() => {
    const q = configParams(config);
    if (savedId) q.set("saved", savedId);
    if (open && open !== "fit") q.set("open", open);
    const qs = q.toString();
    const href = `/furniture/${designId}/customize${qs ? `?${qs}` : ""}`;
    if (window.location.pathname + window.location.search !== href)
      window.history.replaceState(window.history.state, "", href);
  }, [config, designId, savedId, open]);

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
  const setQty = (n: number) => {
    const q = Math.min(MAX_QUANTITY, Math.max(minQty, n));
    apply({ ...config, quantity: q }, `Quantity ${q}.`);
  };
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

  const versionKey = configKey(config) + config.quantity;
  const shown = note?.key === versionKey ? note.text : null;
  const save = (update: boolean) =>
    setNote({
      key: versionKey,
      text: update
        ? updateSaved(editing!.id, config)
          ? "updated"
          : "failed"
        : saveDesign(designId, config)
          ? "saved"
          : "failed",
    });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNote({ key: versionKey, text: "copied" });
    } catch {
      setMessage("Copy the address from the address bar to share it.");
    }
  };

  const chosen = (list: Kit[]) =>
    list.filter((k) => config.kits.includes(k.id)).map((k) => k.name);
  const summary: Record<Group, string> = {
    fit: `${cm(space.w)} × ${cm(space.d)} cm of floor · ${config.quantity === 1 ? "1 piece" : `${config.quantity} pieces`}${chosen(fitKits).length ? ` · ${chosen(fitKits).join(", ").toLowerCase()}` : ""}`,
    function: [
      other ? `${packName(config.design)}` : null,
      chosen(useKits).length ? chosen(useKits).join(", ") : "nothing added",
    ]
      .filter(Boolean)
      .join(" · "),
    finish: `${faceName(config.face)} in white matte · birch edges`,
    review: isStandard
      ? "The standard version"
      : `${delta.added.length + delta.removed.length} changes from the standard version`,
  };
  const at = open ? GROUPS.indexOf(open) : -1;
  const next = at >= 0 && at < GROUPS.length - 1 ? GROUPS[at + 1]! : null;
  const go = (g: Group) => {
    setOpen(g);
    requestAnimationFrame(() =>
      document
        .getElementById(`g-${g}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
    );
  };

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
          <figure
            className={styles.stage}
            data-pending={img.missing.length ? true : undefined}
          >
            <Image
              key={img.src}
              src={img.src}
              alt={`${product.name}, ${configSummary(config).toLowerCase()}`}
              width={STUDIO.w}
              height={STUDIO.h}
              sizes="(max-width: 900px) 34vw, 45vw"
              preload
              className={styles.img}
            />
            {img.missing.length > 0 && (
              <span className={styles.badge}>Picture pending</span>
            )}
          </figure>
          {img.missing.length > 0 ? (
            <p className={styles.pending}>
              <strong>Not drawn yet:</strong> {img.missing.join(", ")}. The
              picture shows the rest; the parts list includes{" "}
              {img.missing.length === 1 ? "it" : "them"}.
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
              {cm(space.w)} × {cm(space.d)} cm · {partTotal(rows)} parts · ×
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

          <ol className={styles.groups} role="list">
            <Section
              group="fit"
              n={1}
              open={open === "fit"}
              summary={summary.fit}
              onToggle={() => setOpen(open === "fit" ? null : "fit")}
            >
              <dl className={styles.space}>
                <div>
                  <dt>Floor space</dt>
                  <dd>
                    <strong className="spec">
                      {cm(space.w)} × {cm(space.d)} cm
                    </strong>{" "}
                    wide × deep
                    {config.design === "bedside"
                      ? ""
                      : ", with the widened base"}
                  </dd>
                </div>
                <div>
                  <dt>Height</dt>
                  <dd className="spec">{cm(product.size.h)} cm</dd>
                </div>
              </dl>
              <p className={styles.help}>
                {config.design === "bedside"
                  ? "Measure the space beside the bed or sofa."
                  : `${claims.stability.label}. Keep the base's depth clear of door swings.`}{" "}
                <Link href={`/furniture/${designId}#fit`}>
                  Check it against your space
                </Link>
              </p>
              {fitKits.length > 0 && (
                <ul role="list" className={styles.options}>
                  {fitKits.map((k) => (
                    <KitOption
                      key={k.id}
                      kit={k}
                      on={config.kits.includes(k.id)}
                      onToggle={() => toggleKit(k.id)}
                    />
                  ))}
                </ul>
              )}
              <div className={styles.qtyRow}>
                <span id="qty-label" className={styles.subhead}>
                  How many
                </span>
                <div
                  className={styles.qty}
                  role="group"
                  aria-labelledby="qty-label"
                >
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => setQty(config.quantity - 1)}
                    disabled={config.quantity <= minQty}
                    aria-label="One fewer"
                  >
                    −
                  </button>
                  <output className="spec">{config.quantity}</output>
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => setQty(config.quantity + 1)}
                    disabled={config.quantity >= MAX_QUANTITY}
                    aria-label="One more"
                  >
                    +
                  </button>
                </div>
                <span className={styles.why}>
                  {minQty === 2
                    ? "At least 2 while two blocks are joined."
                    : config.quantity >= MAX_QUANTITY
                      ? `Up to ${MAX_QUANTITY} here; ask us for more.`
                      : "Each is the same version."}
                </span>
              </div>
            </Section>

            <Section
              group="function"
              n={2}
              open={open === "function"}
              summary={summary.function}
              onToggle={() => setOpen(open === "function" ? null : "function")}
            >
              {other && (
                <div className={styles.block}>
                  <span className={styles.subhead} id="pack-label">
                    Pack
                  </span>
                  <div
                    className={styles.seg}
                    role="group"
                    aria-labelledby="pack-label"
                  >
                    <span className={styles.on} aria-current="true">
                      ✓ {packName(config.design)}
                    </span>
                    <Link
                      href={configHref(other, "customize")}
                      className={styles.off}
                    >
                      {packName(other.design)}
                    </Link>
                  </div>
                  <p className={styles.help}>
                    Same frame, another pack: new parts and one assembly. The
                    parts taken off are yours to keep for changing back.
                  </p>
                </div>
              )}
              <div className={styles.block}>
                <span className={styles.subhead}>Add-ons</span>
                <p className={styles.help}>
                  They fit ports made in the factory. Nothing is drilled at
                  home.
                </p>
                <ul role="list" className={styles.options}>
                  {useKits.map((k) => (
                    <KitOption
                      key={k.id}
                      kit={k}
                      on={config.kits.includes(k.id)}
                      onToggle={() => toggleKit(k.id)}
                    />
                  ))}
                  {testing.map((k) => (
                    <KitOption key={k.id} kit={k} on={false} testing />
                  ))}
                </ul>
              </div>
            </Section>

            <Section
              group="finish"
              n={3}
              open={open === "finish"}
              summary={summary.finish}
              onToggle={() => setOpen(open === "finish" ? null : "finish")}
            >
              <div className={styles.block}>
                <span className={styles.subhead} id="face-label">
                  Face panels
                </span>
                <div
                  className={styles.seg}
                  role="radiogroup"
                  aria-labelledby="face-label"
                >
                  {(["solid", "fabric"] as FaceType[]).map((f) => {
                    const offered =
                      f === "solid" || config.design !== "bedside";
                    return (
                      <label
                        key={f}
                        className={
                          !offered
                            ? styles.no
                            : config.face === f
                              ? styles.on
                              : styles.off
                        }
                      >
                        <input
                          type="radio"
                          name="face"
                          checked={config.face === f}
                          disabled={!offered}
                          onChange={() => setFace(f)}
                          className="visually-hidden"
                        />
                        {config.face === f ? "✓ " : ""}
                        {faceName(f)}
                      </label>
                    );
                  })}
                </div>
                <p className={styles.help}>
                  {config.design === "bedside"
                    ? "Fabric faces are offered on the function face only, not on the bedside block."
                    : "The three face panels slide out from the top and another type slides in. Fabric faces aren't drawn yet."}
                </p>
              </div>
              <div className={styles.block}>
                <span className={styles.subhead}>Fixed for launch</span>
                <dl className={styles.fixed}>
                  <div>
                    <dt>Faces</dt>
                    <dd>White, matte</dd>
                  </div>
                  <div>
                    <dt>Edges</dt>
                    <dd>Birch plywood, left visible</dd>
                  </div>
                  <div>
                    <dt>Base</dt>
                    <dd>Steel</dd>
                  </div>
                  <div>
                    <dt>Accessories</dt>
                    <dd>{claims.accent.label}</dd>
                  </div>
                  {config.design !== "bedside" && (
                    <div>
                      <dt>Hanging face</dt>
                      <dd>{claims.hangingFace.label}</dd>
                    </div>
                  )}
                </dl>
                <p className={styles.help}>
                  These are the decided materials (white matte faces, birch
                  edges); other colours aren&apos;t offered.
                </p>
              </div>
            </Section>

            <Section
              group="review"
              n={4}
              open={open === "review"}
              summary={summary.review}
              onToggle={() => setOpen(open === "review" ? null : "review")}
            >
              {isStandard ? (
                <p className={styles.help}>
                  Nothing added or taken off: this is the standard version.
                </p>
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
              <dl className={styles.fixed}>
                <div>
                  <dt>Parts</dt>
                  <dd>
                    {partTotal(rows)} for each ·{" "}
                    <a href="#g-parts">see the list</a>
                  </dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{claims.price.label}</dd>
                </div>
                <div>
                  <dt>Delivery</dt>
                  <dd>{claims.leadTime.label}</dd>
                </div>
              </dl>
              <div className={styles.reviewLinks}>
                {!isStandard && (
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
                <button type="button" className="text-link" onClick={copy}>
                  Copy a link to this version
                </button>
              </div>
            </Section>
          </ol>

          {/* the next step is always in reach; on phones it stays on screen */}
          <div className={styles.next}>
            {open === "review" ? (
              <div className={styles.saveRow}>
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
                      Keep as new
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
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => go(next ?? "review")}
              >
                Next: {TITLE[next ?? "review"]} →
              </button>
            )}
            <p role="status" aria-live="polite" className={styles.savedNote}>
              {shown === "failed" ? (
                "This browser won't let us save. Try a normal window, or copy the link."
              ) : shown === "copied" ? (
                "Link copied."
              ) : shown ? (
                <>
                  {shown === "updated" ? "Updated." : "Kept in this browser."}{" "}
                  <Link href="/saved">See kept versions</Link>
                </>
              ) : open === "review" ? (
                `${claims.saved.label}.`
              ) : (
                `Step ${Math.max(at, 0) + 1} of 4 · nothing is ordered here`
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

/** One group: a heading button that keeps the current choice in view. */
function Section({
  group,
  n,
  open,
  summary,
  onToggle,
  children,
}: {
  group: Group;
  n: number;
  open: boolean;
  summary: string;
  onToggle: () => void;
  children: ReactNode;
}) {
  const panel = useId();
  return (
    <li
      className={styles.group}
      id={`g-${group}`}
      data-open={open || undefined}
    >
      <h2 className={styles.groupHead}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={onToggle}
        >
          <span className={styles.n} aria-hidden="true">
            {n}
          </span>
          <span className={styles.groupTitle}>{TITLE[group]}</span>
          <span className={styles.groupNow}>{summary}</span>
          <span className={styles.chev} aria-hidden="true" />
        </button>
      </h2>
      <div id={panel} className={styles.panel} hidden={!open}>
        {children}
      </div>
    </li>
  );
}

/** A choosable add-on, or one in testing with the reason it can't be picked. */
function KitOption({
  kit,
  on,
  onToggle,
  testing,
}: {
  kit: Kit;
  on: boolean;
  onToggle?: () => void;
  testing?: boolean;
}) {
  const what = `Adds ${kit.adds.join(", ").toLowerCase()}${
    kit.removes.length
      ? `; takes off ${kit.removes.join(", ").toLowerCase()}`
      : ""
  }.`;
  if (testing)
    return (
      <li>
        <label className={styles.option} data-testing>
          <input type="checkbox" disabled aria-describedby={`why-${kit.id}`} />
          <span className={styles.box} aria-hidden="true" />
          <span>
            <strong>{kit.name}</strong>{" "}
            <span className={styles.tag}>In testing</span>
            <span className={styles.what} id={`why-${kit.id}`}>
              Can&apos;t be chosen yet. {kit.line}
            </span>
          </span>
        </label>
      </li>
    );
  return (
    <li>
      <label className={styles.option} data-on={on || undefined}>
        <input type="checkbox" checked={on} onChange={onToggle} />
        <span className={styles.box} aria-hidden="true">
          {on ? "✓" : ""}
        </span>
        <span>
          <strong>{kit.name}</strong>
          <span className={styles.what}>
            {kit.line} {what}
          </span>
        </span>
      </label>
    </li>
  );
}
