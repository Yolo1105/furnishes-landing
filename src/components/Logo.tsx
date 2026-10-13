/**
 * The Furnishes mark: one panel seen from its edge, birch plies beside an
 * orange working face with two holes from the grid. The wordmark is set in
 * the same sans as the site.
 */
export function Logo({ className }: { className?: string | undefined }) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
    >
      <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden="true">
        <rect x="0" y="0" width="7" height="26" fill="#e3cfab" />
        {[2, 6, 10, 14, 18, 22].map((y) => (
          <rect key={y} x="0" y={y} width="7" height="1" fill="#b8946a" />
        ))}
        <rect x="7" y="0" width="15" height="26" fill="#c93c0a" />
        <circle cx="14.5" cy="8" r="1.6" fill="#5a1b04" />
        <circle cx="14.5" cy="18" r="1.6" fill="#5a1b04" />
      </svg>
      <span
        style={{
          fontWeight: 650,
          fontSize: "1.3rem",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        furnishes
      </span>
    </span>
  );
}
