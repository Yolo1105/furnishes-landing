"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSaved } from "@/lib/saved";
import { Logo } from "./Logo";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "/furniture", label: "Furniture" },
  { href: "/explore", label: "Explore" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/help", label: "Help" },
];

export function SiteHeader() {
  const path = usePathname();
  const { items } = useSaved();
  // the menu belongs to the page it was opened on, so navigating closes it
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;
  const count = items.length;

  const current = (href: string) =>
    path === href || path.startsWith(`${href}/`);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link href="/" className={styles.logo} aria-label="Furnishes, home">
          <Logo />
        </Link>
        <nav
          aria-label="Main"
          className={styles.nav}
          data-open={open || undefined}
          id="site-nav"
        >
          <ul role="list">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={current(n.href) ? "page" : undefined}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.end}>
          <Link
            href="/saved"
            className={styles.saved}
            aria-current={current("/saved") ? "page" : undefined}
          >
            <span>Saved designs</span>
            <span className={styles.count} aria-label={`${count} saved`}>
              {count}
            </span>
          </Link>
          <button
            type="button"
            className={styles.menu}
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpenOn(open ? null : path)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
    </header>
  );
}
