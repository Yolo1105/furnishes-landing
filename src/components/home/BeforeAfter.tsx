"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { images } from "@/lib/catalog";
import styles from "./BeforeAfter.module.css";

/** The same spot, without and with a piece. The slider is a real range input. */
export function BeforeAfter({ id, name }: { id: string; name: string }) {
  const [split, setSplit] = useState(45);
  const sliderId = useId();
  return (
    <figure className={styles.figure}>
      <div className={styles.frame} style={{ "--split": `${split}%` } as React.CSSProperties}>
        <Image src={images.room(id)} alt={`The spot with the ${name.toLowerCase()}`} width={960} height={600} sizes="(max-width: 900px) 100vw, 60vw" />
        <div className={styles.before} aria-hidden="true">
          <Image src={images.before(id)} alt="" width={960} height={600} sizes="(max-width: 900px) 100vw, 60vw" />
        </div>
        <span className={`${styles.tag} ${styles.left}`}>Before</span>
        <span className={`${styles.tag} ${styles.right}`}>With the {name.toLowerCase()}</span>
      </div>
      <label htmlFor={sliderId} className={styles.label}>
        Slide to compare
      </label>
      <input
        id={sliderId}
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        className={styles.range}
      />
    </figure>
  );
}
