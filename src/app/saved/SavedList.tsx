"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { StatusBadge } from "@/components/bits";
import { Elevation } from "@/components/Elevation";
import { claims } from "@/data/claims";
import { market } from "@/data/market";
import { getDesign, images, recipeOf, sizeLabel } from "@/lib/catalog";
import {
  configHref,
  configParams,
  configSummary,
  MAX_QUANTITY,
} from "@/lib/config";
import { quoteMail } from "@/lib/mail";
import {
  duplicateSaved,
  recordDraft,
  removeSaved,
  setQuantity,
  useSaved,
  type SavedDesign,
} from "@/lib/saved";
import styles from "./saved.module.css";

const date = (iso: string) =>
  new Date(iso).toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function editHref(e: SavedDesign) {
  if (!e.config) return `/furniture/${e.design}`;
  const q = configParams(e.config);
  q.set("saved", e.id);
  return `/furniture/${e.design}/customize?${q.toString()}`;
}

function Entry({
  e,
  drafted,
  selected,
  onSelect,
}: {
  e: SavedDesign;
  drafted: string | null;
  selected: boolean;
  onSelect: (v: boolean) => void;
}) {
  const d = getDesign(e.design)!;
  const r = recipeOf(d);
  const [confirm, setConfirm] = useState(false);
  const id = useId();
  return (
    <li className={styles.entry}>
      <label className={styles.pick}>
        <input
          type="checkbox"
          checked={selected}
          onChange={(ev) => onSelect(ev.target.checked)}
        />
        <span className="visually-hidden">
          Include {d.name} in the quote request
        </span>
      </label>
      <div className={styles.thumbs}>
        <span className={styles.thumb}>
          <Image
            src={images.object(d.id)}
            alt=""
            width={d.image.object.w}
            height={d.image.object.h}
            sizes="90px"
          />
        </span>
        {e.config && r && (
          <span className={styles.thumbDrawing}>
            <Elevation
              recipe={r}
              config={e.config}
              uid={`sv-${e.id}`}
              showDimensions={false}
              title={`${d.name}, your version`}
            />
          </span>
        )}
      </div>
      <div className={styles.info}>
        <p className={styles.kind}>
          {e.kind === "configuration" ? "Saved version" : "Saved idea"}
          <StatusBadge status={d.status} />
        </p>
        <h2 className={styles.name}>
          <Link
            href={
              e.config ? configHref(e.config, "product") : `/furniture/${d.id}`
            }
          >
            {d.name}
          </Link>
        </h2>
        <p className={styles.summary}>
          {e.config
            ? configSummary(e.config)
            : "Concept: saved as an idea, not a configuration."}
        </p>
        <p className={`${styles.meta} num`}>
          {sizeLabel(d.size)} nominal · Saved {date(e.savedAt)}
          {e.updatedAt !== e.savedAt ? ` · Updated ${date(e.updatedAt)}` : ""}
        </p>
        {drafted && (
          <p className={styles.drafted}>
            In a quote request drafted {date(drafted)} (sending not confirmed)
          </p>
        )}
      </div>
      <div className={styles.side}>
        {e.config && (
          <div className={styles.qty} role="group" aria-labelledby={`${id}-q`}>
            <span id={`${id}-q`} className={styles.qtyLabel}>
              Quantity
            </span>
            <button
              type="button"
              aria-label={`One fewer ${d.name}`}
              disabled={e.config.quantity <= 1}
              onClick={() => setQuantity(e.id, e.config!.quantity - 1)}
            >
              −
            </button>
            <output className="num" aria-live="polite">
              {e.config.quantity}
            </output>
            <button
              type="button"
              aria-label={`One more ${d.name}`}
              disabled={e.config.quantity >= MAX_QUANTITY}
              onClick={() => setQuantity(e.id, e.config!.quantity + 1)}
            >
              +
            </button>
          </div>
        )}
        <div className={styles.actions}>
          <Link href={editHref(e)} className="btn btn-quiet">
            {e.config ? "Edit" : "View"}
          </Link>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => duplicateSaved(e.id)}
          >
            Duplicate
          </button>
          {confirm ? (
            <>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => removeSaved(e.id)}
              >
                Yes, remove
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => setConfirm(false)}
              >
                Keep
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => setConfirm(true)}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export function SavedList() {
  const { items, drafts, available, ready } = useSaved();
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [opened, setOpened] = useState<string | null>(null);
  const [copied, setCopied] = useState<"" | "ok" | "failed">("");
  const noteId = useId();

  const chosen = items.filter((e) => !excluded.has(e.id));
  const mail = useMemo(
    () =>
      quoteMail(
        chosen.map((e) => ({ design: getDesign(e.design)!, config: e.config })),
        note,
      ),
    [chosen, note],
  );
  const lastDraft = (id: string) =>
    drafts.find((d) => d.ids.includes(id))?.draftedAt ?? null;
  const configs = chosen.filter((e) => e.kind === "configuration").length;

  return (
    <div className="container">
      <header className={styles.head}>
        <p className="eyebrow">Saved designs</p>
        <h1>Your saved designs</h1>
        <p className="lede">
          Each one keeps the exact version you chose. Edit or copy one without
          changing the others, then prepare a quote request for the ones you
          want.
        </p>
        <p className="muted">{claims.saved.detail}</p>
      </header>

      {!ready ? (
        <p className="muted" role="status">
          Loading your saved designs…
        </p>
      ) : !available ? (
        <div className={styles.empty}>
          <p>
            This browser isn&apos;t letting the site store anything (a private
            window can do this), so designs can&apos;t be saved here. You can
            still copy the address of a customized piece to keep it.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p>
            Nothing saved in this browser yet. When you save a piece, it appears
            here with its finish, accessories and quantity.
          </p>
          <div className={styles.emptyActions}>
            <Link href="/furniture" className="btn btn-primary">
              Browse furniture
            </Link>
            <Link href="/explore" className="btn btn-secondary">
              Explore by room or use
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.layout}>
          <section aria-label="Saved designs">
            <p className={styles.count}>
              {items.length} saved · {chosen.length} in the quote request
            </p>
            <ul role="list" className={styles.list}>
              {items.map((e) => (
                <Entry
                  key={e.id}
                  e={e}
                  drafted={lastDraft(e.id)}
                  selected={!excluded.has(e.id)}
                  onSelect={(v) =>
                    setExcluded((s) => {
                      const n = new Set(s);
                      if (v) n.delete(e.id);
                      else n.add(e.id);
                      return n;
                    })
                  }
                />
              ))}
            </ul>
          </section>

          <aside className={styles.quote} aria-labelledby="quote-title">
            <h2 id="quote-title" className={styles.quoteTitle}>
              Ask for a quote
            </h2>
            <p>
              We reply with a price, lead time and delivery options for the
              exact versions you include. Prices are not published yet.
            </p>
            <label htmlFor={noteId} className={styles.noteLabel}>
              About your space and timing{" "}
              <span className="muted">(optional)</span>
            </label>
            <textarea
              id={noteId}
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Where it will go, the way in to the room, when you need it…"
            />
            <a
              href={chosen.length ? mail.href : undefined}
              aria-disabled={chosen.length === 0}
              className="btn btn-primary"
              onClick={(ev) => {
                if (!chosen.length) {
                  ev.preventDefault();
                  return;
                }
                recordDraft(chosen.map((e) => e.id));
                setOpened(new Date().toISOString());
              }}
            >
              Prepare quote request ({chosen.length})
            </a>
            <p className={styles.small}>
              <strong>{claims.quoteDraft.label}.</strong>{" "}
              {claims.quoteDraft.detail}
            </p>
            {opened && (
              <p className={styles.opened} role="status">
                We opened an email draft at {date(opened)}. It is not sent until
                you send it. If no email app opened, copy the text below and
                send it to <a href={`mailto:${market.email}`}>{market.email}</a>
                .
              </p>
            )}
            <details className={styles.preview}>
              <summary>See the request text</summary>
              <pre>{mail.body}</pre>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(mail.body);
                    setCopied("ok");
                  } catch {
                    setCopied("failed");
                  }
                }}
              >
                Copy the text
              </button>
              <span role="status" className={styles.small}>
                {copied === "ok"
                  ? " Copied."
                  : copied === "failed"
                    ? " Copy didn't work; select the text instead."
                    : ""}
              </span>
            </details>
            {configs < chosen.length && (
              <p className={styles.small}>
                Concepts are sent as questions, not as items to price.
              </p>
            )}
            <div className={styles.states}>
              <h3>What each step means</h3>
              <dl>
                <dt>Saved</dt>
                <dd>Kept in this browser. Nobody at Furnishes can see it.</dd>
                <dt>Request drafted</dt>
                <dd>An email written for you. Only sent if you send it.</dd>
                <dt>Request received</dt>
                <dd>When we reply to your email.</dd>
                <dt>Order</dt>
                <dd>
                  Not available on this site yet. Orders are confirmed with your
                  quote.
                </dd>
              </dl>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
