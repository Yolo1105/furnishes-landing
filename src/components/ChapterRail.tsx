"use client";

import { useEffect, useState } from "react";
import styles from "./ChapterRail.module.css";

/**
 * Jump links for a long page. The chapter on screen is marked, so the rail
 * also says where you are.
 */
export function ChapterRail({
  chapters,
  label = "On this page",
}: {
  chapters: { id: string; label: string }[];
  label?: string;
}) {
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const first = chapters.find((c) => seen.get(c.id));
        setCurrent(first ? first.id : null);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const c of chapters) {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [chapters]);
  return (
    <nav className={styles.rail} aria-label={label}>
      <ul role="list">
        {chapters.map((c) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              aria-current={current === c.id ? "location" : undefined}
            >
              {c.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
