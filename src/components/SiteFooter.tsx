import Link from "next/link";
import { market } from "@/data/market";
import { Logo } from "./Logo";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <p className={styles.logo}>
            <Logo />
          </p>
          <p className="muted">
            Birch plywood furniture for homes in {market.country}: white matte
            faces, birch edges, and one family of parts.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul role="list" className={styles.links}>
            <li>
              <Link href="/furniture">All furniture</Link>
            </li>
            <li>
              <Link href="/explore">Start with what you love</Link>
            </li>
            <li>
              <Link href="/how-it-works">How it works</Link>
            </li>
            <li>
              <Link href="/saved">Kept versions</Link>
            </li>
            <li>
              <Link href="/help">Help and questions</Link>
            </li>
          </ul>
        </nav>
        <div className={styles.note}>
          <p>
            <a href={`mailto:${market.email}`}>{market.email}</a>
          </p>
          <p className="muted">
            Images are design renders, not photographs. Prices, timing and
            delivery are not set yet; they come after samples and quotes.
          </p>
        </div>
      </div>
    </footer>
  );
}
