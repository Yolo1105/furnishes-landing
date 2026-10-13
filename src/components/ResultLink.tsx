"use client";

import Link from "next/link";
import { rememberResults } from "@/lib/saved";

/**
 * A link into a product that remembers the page it came from, so the
 * product page can offer "Back to your results" with the same filters.
 */
export function ResultLink({
  href,
  designId,
  resultsLabel,
  className,
  children,
}: {
  href: string;
  designId: string;
  resultsLabel?: string;
  className?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (resultsLabel)
          rememberResults(
            window.location.pathname + window.location.search,
            resultsLabel,
            designId,
          );
      }}
    >
      {children}
    </Link>
  );
}
