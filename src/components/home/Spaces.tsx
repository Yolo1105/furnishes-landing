"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { ProductStatus } from "@/data/types";
import { StatusBadge } from "@/components/bits";
import { SCENE, STUDIO } from "@/lib/renders";
import styles from "./Spaces.module.css";

export type Space = {
  use: string;
  label: string;
  job: string;
  count: number;
  scene: string;
  piece: {
    id: string;
    name: string;
    status: ProductStatus;
    size: string;
    use: string;
    studio: string;
  };
};

/**
 * "Where does it need to work?" Three rooms, unequal. Choosing one updates
 * the piece beside them in place; the links carry the room into Explore.
 */
export function Spaces({
  spaces,
  others,
}: {
  spaces: Space[];
  others: { use: string; label: string; count: number }[];
}) {
  const [pick, setPick] = useState(0);
  const tiles = useRef<HTMLUListElement>(null);
  const s = spaces[pick]!;
  const go = (i: number) => {
    const n = (i + spaces.length) % spaces.length;
    setPick(n);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    tiles.current?.children[n]?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
      inline: "start",
    });
  };
  return (
    <div className={styles.wrap}>
      <div className={styles.step}>
        <button
          type="button"
          onClick={() => go(pick - 1)}
          aria-label="Previous space"
        >
          <span aria-hidden="true">←</span>
        </button>
        <span className="spec">
          {pick + 1} / {spaces.length} · {s.label}
        </span>
        <button
          type="button"
          onClick={() => go(pick + 1)}
          aria-label="Next space"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <ul role="list" className={styles.tiles} ref={tiles}>
        {spaces.map((sp, i) => (
          <li key={sp.use} data-lead={i === 0 || undefined}>
            <button
              type="button"
              className={styles.tile}
              aria-pressed={i === pick}
              onClick={() => setPick(i)}
            >
              <Image
                src={sp.scene}
                alt=""
                width={SCENE.w}
                height={SCENE.h}
                sizes={
                  i === 0
                    ? "(max-width: 900px) 100vw, 50vw"
                    : "(max-width: 900px) 80vw, 25vw"
                }
                className={styles.tileImg}
              />
              <span className={styles.tileText}>
                <span className={styles.tileRoom}>{sp.label}</span>
                <span className={styles.tileJob}>{sp.job}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.feature} aria-live="polite">
        <div className={styles.featureImg}>
          <Image
            key={s.piece.studio}
            src={s.piece.studio}
            alt={`${s.piece.name}, standard version, design render`}
            width={STUDIO.w}
            height={STUDIO.h}
            sizes="(max-width: 900px) 50vw, 22vw"
          />
        </div>
        <div className={styles.featureText}>
          <p className="label">{s.label}</p>
          <h3 className={styles.featureName}>{s.piece.name}</h3>
          <p className={styles.featureUse}>{s.piece.use}</p>
          <p className={styles.featureMeta}>
            <span className="spec">{s.piece.size}</span>
            <StatusBadge status={s.piece.status} long />
          </p>
          <div className={styles.featureLinks}>
            <Link href={`/furniture/${s.piece.id}`} className="btn btn-primary">
              View this piece
            </Link>
            <Link href={`/explore?room=${s.use}`} className="text-link">
              All {s.count} pieces: {s.label.toLowerCase()}
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.others}>
        <p className="label">More spaces</p>
        <ul role="list">
          {others.map((o) => (
            <li key={o.use}>
              <Link href={`/explore?room=${o.use}`}>
                {o.label} <span className="spec">{o.count}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/explore" className={styles.allSpaces}>
              See all spaces →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
