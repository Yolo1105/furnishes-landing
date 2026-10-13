"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { Design } from "@/data/types";
import { images } from "@/lib/catalog";
import styles from "./Gallery.module.css";

export type GalleryView = "object" | "room" | "before" | "drawing";

type Props = {
  design: Design;
  /** A server-rendered drawing for the "drawing" view, when there is one. */
  drawing?: React.ReactNode;
};

const LABEL: Record<GalleryView, string> = {
  object: "On its own",
  room: "In a room",
  before: "Before and after",
  drawing: "Measured drawing",
};

/**
 * Object, room, before/after and drawing views of one design. Thumbnails
 * are buttons (keyboard and touch); the selected view is marked by a
 * border and aria-pressed, not by colour alone.
 */
export function Gallery({ design, drawing }: Props) {
  const views: GalleryView[] = ["object"];
  if (design.image.room) views.push("room");
  if (design.image.before) views.push("before");
  if (drawing) views.push("drawing");
  const [view, setView] = useState<GalleryView>("object");
  const [split, setSplit] = useState(50);
  const sliderId = useId();

  return (
    <div className={styles.gallery}>
      <div className={styles.frame} data-view={view}>
        {view === "object" && (
          <Image
            src={images.object(design.id)}
            alt={`${design.name}, rendered on its own`}
            width={design.image.object.w}
            height={design.image.object.h}
            sizes="(max-width: 900px) 80vw, 40vw"
            preload
            className={styles.object}
          />
        )}
        {view === "room" && (
          <Image
            src={images.room(design.id)}
            alt={`${design.name} in a room, ${design.room}`}
            width={960}
            height={600}
            sizes="(max-width: 900px) 100vw, 60vw"
            className={styles.room}
          />
        )}
        {view === "before" && (
          <div className={styles.compare} style={{ "--split": `${split}%` } as React.CSSProperties}>
            <Image
              src={images.room(design.id)}
              alt={`The same spot with the ${design.name.toLowerCase()}`}
              width={960}
              height={600}
              sizes="(max-width: 900px) 100vw, 60vw"
              className={styles.room}
            />
            <div className={styles.beforeLayer} aria-hidden="true">
              <Image
                src={images.before(design.id)}
                alt=""
                width={960}
                height={600}
                sizes="(max-width: 900px) 100vw, 60vw"
                className={styles.room}
              />
            </div>
            <span className={`${styles.tag} ${styles.tagLeft}`}>Before</span>
            <span className={`${styles.tag} ${styles.tagRight}`}>With the {design.name.toLowerCase()}</span>
          </div>
        )}
        {view === "drawing" && <div className={styles.drawing}>{drawing}</div>}
      </div>

      {view === "before" && (
        <div className={styles.slider}>
          <label htmlFor={sliderId}>Compare before and after</label>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
          />
        </div>
      )}

      {views.length > 1 && (
        <div className={styles.thumbs} role="group" aria-label="Views">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              className={styles.thumb}
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {LABEL[v]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
