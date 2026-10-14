"use client";

import { useState, useSyncExternalStore } from "react";

const QUERY = "(max-width: 900px)";
const subscribe = (fn: () => void) => {
  const m = window.matchMedia(QUERY);
  m.addEventListener("change", fn);
  return () => m.removeEventListener("change", fn);
};

/**
 * Filters beside the list on wide screens; a drawer you open on phones,
 * closed until asked for.
 */
export function FiltersDrawer({
  summary,
  className,
  summaryClassName,
  children,
}: {
  summary: string;
  className?: string | undefined;
  summaryClassName?: string | undefined;
  children: React.ReactNode;
}) {
  const narrow = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  const [asked, setAsked] = useState(false);
  const open = !narrow || asked;
  return (
    <details
      className={className}
      open={open}
      onToggle={(e) => {
        if (narrow) setAsked(e.currentTarget.open);
      }}
    >
      <summary className={summaryClassName}>{summary}</summary>
      {children}
    </details>
  );
}
