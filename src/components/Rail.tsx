"use client";

import { useRef } from "react";
import styles from "./Rail.module.css";

/**
 * A horizontal row of items that scrolls, with labelled arrow buttons for
 * people who don't swipe. Every item stays a normal link in tab order.
 */
export function Rail({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string | undefined;
}) {
  const track = useRef<HTMLUListElement>(null);
  const move = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollBy({
      left: dir * el.clientWidth * 0.8,
      behavior: reduce ? "auto" : "smooth",
    });
  };
  return (
    <div className={`${styles.rail} ${className ?? ""}`}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => move(-1)}
          aria-label={`Scroll ${label} back`}
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => move(1)}
          aria-label={`Scroll ${label} on`}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <ul role="list" className={styles.track} ref={track} aria-label={label}>
        {children}
      </ul>
    </div>
  );
}
