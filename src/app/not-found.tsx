import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container section">
      <div className="section-head">
        <p className="eyebrow">Not found</p>
        <h1>We couldn&apos;t find that page.</h1>
        <p className="lede">
          The design or page may have moved. Everything we make is on the
          furniture page.
        </p>
      </div>
      <p style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/furniture" className="btn btn-primary">
          See all furniture
        </Link>
        <Link href="/" className="btn btn-secondary">
          Go to the home page
        </Link>
      </p>
    </div>
  );
}
