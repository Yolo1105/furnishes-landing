"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./Gallery.module.css";

export type GalleryImage = {
  src: string;
  w: number;
  h: number;
  alt: string;
};

export type GalleryView = {
  key: string;
  label: string;
  /** shown under the picture: what it is and what's not included */
  caption: string;
  image?: GalleryImage;
  /** a server-rendered drawing instead of a picture */
  node?: React.ReactNode;
  /** how the frame holds the picture */
  fit?: "cover" | "contain";
};

/**
 * Views of one product. "A piece", "A corner" and "A room" widen the view
 * of the same piece (doc 13); the camera of each picture stays put, and
 * switching only swaps the picture. Buttons work with keyboard and touch;
 * the selected view is marked by aria-pressed and a border, not colour.
 */
export function Gallery({
  views,
  start,
  label,
}: {
  views: GalleryView[];
  start: string;
  label: string;
}) {
  const [key, setKey] = useState(start);
  const v = views.find((x) => x.key === key) ?? views[0]!;
  return (
    <div className={styles.gallery}>
      <figure className={styles.frame} data-fit={v.fit ?? "cover"}>
        {v.image ? (
          <Image
            key={v.image.src}
            src={v.image.src}
            alt={v.image.alt}
            width={v.image.w}
            height={v.image.h}
            sizes="(max-width: 900px) 100vw, 60vw"
            preload={v.key === start}
            className={styles.img}
          />
        ) : (
          <div className={styles.node}>{v.node}</div>
        )}
        <figcaption className={styles.caption}>{v.caption}</figcaption>
      </figure>
      <div className={styles.views} role="group" aria-label={label}>
        {views.map((x) => (
          <button
            key={x.key}
            type="button"
            className={styles.view}
            aria-pressed={x.key === v.key}
            onClick={() => setKey(x.key)}
          >
            {x.label}
          </button>
        ))}
      </div>
    </div>
  );
}
