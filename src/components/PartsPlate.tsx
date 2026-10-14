"use client";

import Image from "next/image";
import { useState } from "react";
import { SQUARE as DETAIL } from "@/lib/renders";
import styles from "./PartsPlate.module.css";

export type PlateItem = {
  partId: string;
  name: string;
  quantity: number;
  spec: string;
  /** where the part lands in the picture; absent for parts not drawn */
  at?: { u: number; v: number } | undefined;
};

/**
 * The construction plate: the standard version pulled apart, with a
 * numbered, focusable callout on each kind of part and the same numbers in
 * the list beside it. Positions come from the renderer, not by hand.
 */
export function PartsPlate({
  src,
  alt,
  items,
  note,
}: {
  src: string;
  alt: string;
  items: PlateItem[];
  note?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const numbered = items.map((it, i) => ({ ...it, n: i + 1 }));
  const on = (id: string | null) => () => setActive(id);
  return (
    <div className={styles.plate}>
      <div className={styles.figure}>
        <Image
          src={src}
          alt={alt}
          width={DETAIL.w}
          height={DETAIL.h}
          sizes="(max-width: 900px) 100vw, 55vw"
          className={styles.img}
        />
        {numbered
          .filter((it) => it.at)
          .map((it) => (
            <button
              key={it.partId}
              type="button"
              className={styles.marker}
              style={{ left: `${it.at!.u * 100}%`, top: `${it.at!.v * 100}%` }}
              data-active={active === it.partId || undefined}
              aria-label={`${it.n}: ${it.name}, ${it.quantity} ${it.quantity === 1 ? "part" : "parts"}, ${it.spec}`}
              onMouseEnter={on(it.partId)}
              onMouseLeave={on(null)}
              onFocus={on(it.partId)}
              onBlur={on(null)}
            >
              {it.n}
            </button>
          ))}
      </div>
      <div className={styles.legend}>
        <ol className={styles.list}>
          {numbered.map((it) => (
            <li
              key={it.partId}
              data-active={active === it.partId || undefined}
              onMouseEnter={on(it.partId)}
              onMouseLeave={on(null)}
            >
              <span className={styles.n} aria-hidden="true">
                {it.at ? it.n : "–"}
              </span>
              <span className={styles.name}>
                {it.name}
                {!it.at && <span className={styles.hidden}> (not drawn)</span>}
              </span>
              <span className={styles.qty}>× {it.quantity}</span>
              <span className={styles.spec}>{it.spec}</span>
            </li>
          ))}
        </ol>
        {note && <p className={styles.note}>{note}</p>}
      </div>
    </div>
  );
}
