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
            Finished birch plywood furniture for homes in {market.country},
            built from one family of panels and set up for where it stands.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul role="list" className={styles.links}>
            <li>
              <Link href="/furniture">All furniture</Link>
            </li>
            <li>
              <Link href="/explore">Explore by room or use</Link>
            </li>
            <li>
              <Link href="/how-it-works">How it works</Link>
            </li>
            <li>
              <Link href="/saved">Saved designs</Link>
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
            Images are 3D renders of designs, not product photographs. Prices,
            lead times and delivery are confirmed with each quote.
          </p>
        </div>
      </div>
    </footer>
  );
}
