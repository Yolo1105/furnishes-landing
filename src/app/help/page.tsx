import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/prose/prose.module.css";
import { market } from "@/data/market";
import { PlanForm } from "./PlanForm";

export const metadata: Metadata = {
  title: "Help",
  description:
    "Answers about choosing, packs and add-ons, sizes, prices and delivery, and how to ask Furnishes about a room.",
  alternates: { canonical: "/help" },
};

const faq: { q: string; a: React.ReactNode }[] = [
  {
    q: "Does Furnishes sell furniture or parts?",
    a: (
      <p>
        Furniture. Each piece starts as a complete answer for one place, and you
        can choose it as it is. Accessories and add-ons that fit a piece come
        with it. You don&apos;t need to learn a parts system first.
      </p>
    ),
  },
  {
    q: "Does every piece need configuring?",
    a: (
      <p>
        No. The standard version is already complete. Choose a pack, add-ons or
        face type only where they make a real difference for you.
      </p>
    ),
  },
  {
    q: "Can it work with the furniture I already have?",
    a: (
      <p>
        Yes, that&apos;s the idea of the desk-side pack: it stands beside the
        desk you keep. It stands on its own and doesn&apos;t lean on your desk;
        anything that connects or carries load only does so in ways we support.
      </p>
    ),
  },
  {
    q: "Can the entry piece become the desk-side one later?",
    a: (
      <p>
        Yes. They are the same frame with a different pack. Changing packs takes
        the new pack&apos;s parts and one assembly; we list what stays,
        what&apos;s added and what comes off, and the parts that come off are
        yours to keep.
      </p>
    ),
  },
  {
    q: "Why are the accessories a different colour?",
    a: (
      <p>
        On purpose. Hooks, trays and add-ons come in one agreed accent colour,
        so a part added later looks meant rather than slightly off. The colour
        is chosen with the samples; the site shows orange for now.
      </p>
    ),
  },
  {
    q: "What does a piece cost?",
    a: (
      <p>
        Prices aren&apos;t set yet. They come after factory quotes and
        conversations with buyers, and we won&apos;t show an estimate before
        then. Keep the version you want and email us about it from{" "}
        <Link href="/saved">Kept versions</Link>.
      </p>
    ),
  },
  {
    q: "Is everything in the pictures included?",
    a: (
      <p>
        No. The pictures are design renders, and the desk, chair, lamp, books
        and bags around a piece are not included. Each product page lists every
        part of the piece.
      </p>
    ),
  },
  {
    q: "Will it fit my space?",
    a: (
      <p>
        Every product page has a quick check against its nominal size, including
        the base when it reaches further forward than the body. A picture alone
        can&apos;t tell; before you buy, the key sizes, the way into the room
        and room to assemble are checked.
      </p>
    ),
  },
  {
    q: "Do I need to drill? Can it move?",
    a: (
      <p>
        Add-ons fix to ports made in the factory, so you don&apos;t drill the
        furniture. The full-height function face stands on a widened base with a
        counterweight and comes with a wall strap: within the stated hanging
        range it can stand unfixed, and you can fix it whenever you want. Low
        pieces like the bedside block simply stand. A caster version is only
        offered after a stability test.
      </p>
    ),
  },
  {
    q: "How is it delivered, and how long does it take?",
    a: (
      <p>
        Pieces are planned to arrive flat-packed, with the assembly steps shown
        on each launch piece&apos;s page. Delivery, assembly help and timing are
        confirmed before you buy; we don&apos;t give a number of days until we
        can keep it.
      </p>
    ),
  },
  {
    q: "Do the dividers block sound?",
    a: (
      <p>
        No. Shelves and screens give two parts of a room their own side and a
        visual line; they are not sound insulation and don&apos;t replace a
        wall.
      </p>
    ),
  },
  {
    q: "Where are my kept versions?",
    a: (
      <p>
        In this browser, on this device. There are no accounts yet, so clearing
        your browser data removes them. Copy the address of a configured piece
        to keep it elsewhere.
      </p>
    ),
  },
];

export default function HelpPage() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.head}>
        <h1>Questions, and how to reach us.</h1>
        <p className="lede">
          Short answers to what people ask most, and a way to tell us about a
          room. Email: <a href={`mailto:${market.email}`}>{market.email}</a>.
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

      <section
        id="plan"
        className={styles.section}
        aria-labelledby="plan-title"
      >
        <div className={styles.body}>
          <h2 id="plan-title">Ask about a room</h2>
          <p>
            For a room-sized idea (shelves between two beds, something behind
            the sofa, a corner to work in), tell us what you&apos;d like and
            what stays. We reply by email.
          </p>
          <p className="muted">
            Dividers and room arrangements come after the launch pieces, so the
            answer may be a launch piece, a piece coming soon, or an honest
            &quot;not yet&quot;.
          </p>
        </div>
        <PlanForm />
      </section>
    </div>
  );
}
