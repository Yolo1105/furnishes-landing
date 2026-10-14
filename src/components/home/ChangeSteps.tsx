"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import styles from "./ChangeSteps.module.css";

export type Step = {
  title: string;
  text: string;
  /** what physically changed, from the parts list */
  delta: string;
  src: string;
  alt: string;
  href: string;
  label: string;
};

/**
 * Choose, add, change: one piece in one room, one camera. Picking a step
 * swaps only the picture of the piece's state; nothing else moves.
 */
export function ChangeSteps({
  steps,
  size,
  caption,
}: {
  steps: Step[];
  size: { w: number; h: number };
  caption: string;
}) {
  const [at, setAt] = useState(0);
  const s = steps[at]!;
  return (
    <div className={styles.wrap}>
      <div
        className={styles.stage}
        style={{ aspectRatio: `${size.w} / ${size.h}` }}
      >
        {steps.map((st, i) => (
          <Image
            key={st.src}
            src={st.src}
            alt={i === at ? st.alt : ""}
            aria-hidden={i === at ? undefined : true}
            width={size.w}
            height={size.h}
            sizes="(max-width: 900px) 100vw, 45vw"
            className={styles.img}
            data-on={i === at || undefined}
          />
        ))}
        <p className={styles.caption}>{caption}</p>
      </div>
      <ol className={styles.steps}>
        {steps.map((st, i) => (
          <li key={st.title}>
            <button
              type="button"
              className={styles.step}
              aria-pressed={i === at}
              onClick={() => setAt(i)}
            >
              <span className={styles.num} aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={styles.stepTitle}>{st.title}</span>
              <span className={styles.stepText}>{st.text}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className={styles.result} role="status">
        <p className={styles.activeText}>{s.text}</p>
        <p className="spec">{s.delta}</p>
        <Link href={s.href} className="btn btn-primary">
          {s.label}
        </Link>
      </div>
    </div>
  );
}
