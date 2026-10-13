import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/prose/prose.module.css";
import { market } from "@/data/market";
import { PlanForm } from "./PlanForm";

export const metadata: Metadata = {
  title: "Help",
  description:
    "Answers about choosing, sizes, prices and delivery, and how to ask Furnishes about a room.",
  alternates: { canonical: "/help" },
};

const faq: { q: string; a: React.ReactNode }[] = [
  {
    q: "Do you sell furniture or parts?",
    a: (
      <p>
        Furniture. Each design is a complete piece with a use, and you can choose it as it is.
        Accessories that fit a piece can be added to it. Whether single parts can be bought on
        their own is confirmed per piece with your quote.
      </p>
    ),
  },
  {
    q: "Does every piece need customizing?",
    a: (
      <p>
        No. The standard version of every configurable piece is already complete. Customize only
        if you want a different finish, a door, or other accessories.
      </p>
    ),
  },
  {
    q: "What does a piece cost?",
    a: (
      <p>
        Prices are not published yet. Save the version you want and prepare a quote request from{" "}
        <Link href="/saved">Saved designs</Link>; we reply with a price for that exact version, and
        delivery and assembly costs listed separately.
      </p>
    ),
  },
  {
    q: "Is everything in the pictures included?",
    a: (
      <p>
        No. The pictures are 3D renders, and the lamps, books, bags and other objects in them are
        not included. Each product page lists what is included, part by part.
      </p>
    ),
  },
  {
    q: "Will it fit my space?",
    a: (
      <p>
        Every product page has a quick size check against the nominal size. Before you order, we
        confirm the fit for your space, including skirting boards, doors and the way into the
        room.
      </p>
    ),
  },
  {
    q: "Do I need to drill? Can it move?",
    a: (
      <p>
        That depends on the piece. Taller pieces may need fixing to the wall; pieces on casters can
        be moved, within limits we confirm for each one. We don&apos;t promise &quot;no
        drilling&quot; for the whole range.
      </p>
    ),
  },
  {
    q: "How is it delivered, and how long does it take?",
    a: (
      <p>
        Pieces are planned to arrive flat-packed. Delivery areas, lead times and whether assembly
        is included are confirmed with your quote. We don&apos;t quote a number of days until we
        can keep it.
      </p>
    ),
  },
  {
    q: "Can I add to a piece later?",
    a: (
      <p>
        Often, yes: an accessory or a door can be added to a piece that takes it. Bigger changes
        need checking against the exact version you have. Changing one design into another is a
        concept for now.
      </p>
    ),
  },
  {
    q: "Do the room dividers block sound?",
    a: (
      <p>
        No. Shelving and screens give two sides of a room their own space and a visual line; they
        are not sound insulation and don&apos;t replace a wall.
      </p>
    ),
  },
  {
    q: "Where are my saved designs?",
    a: (
      <p>
        In this browser, on this device. There are no accounts yet, so clearing your browser data
        removes them. Copy the address of a customized piece to keep it elsewhere.
      </p>
    ),
  },
];

export default function HelpPage() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.head}>
        <p className="eyebrow">Help</p>
        <h1>Questions, and how to reach us.</h1>
        <p className="lede">
          Short answers to what people ask most, and a way to tell us about a room. Email:{" "}
          <a href={`mailto:${market.email}`}>{market.email}</a>.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="faq">
        <h2 id="faq">Common questions</h2>
        <div className={styles.faq}>
          {faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <div>{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      <section id="plan" className={styles.section} aria-labelledby="plan-title">
        <div className={styles.body}>
          <h2 id="plan-title">Ask about a room</h2>
          <p>
            For a room-sized idea (shelving between two beds, a wall behind the sofa, a corner to
            work in), tell us what you&apos;d like and what stays. We reply by email.
          </p>
          <p className="muted">
            Room pieces are concepts today, so the answer may be a configurable piece, a direction
            we are developing, or an honest &quot;not yet&quot;.
          </p>
        </div>
        <PlanForm />
      </section>
    </div>
  );
}
