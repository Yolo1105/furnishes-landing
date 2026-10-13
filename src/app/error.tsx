"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container section">
      <div className="section-head">
        <p className="eyebrow">Something went wrong</p>
        <h1>This page didn&apos;t load.</h1>
        <p className="lede">
          Your saved designs are kept in this browser and are not affected. Try
          again, or go back to the furniture.
        </p>
      </div>
      <p style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => reset()}
        >
          Try again
        </button>
        <Link href="/furniture" className="btn btn-secondary">
          See all furniture
        </Link>
      </p>
    </div>
  );
}
