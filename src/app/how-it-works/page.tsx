import type { Metadata } from "next";
import Link from "next/link";
import { Elevation } from "@/components/Elevation";
import styles from "@/components/prose/prose.module.css";
import { claims } from "@/data/claims";
import { recipes } from "@/data/recipes";
import { defaultConfig } from "@/lib/config";
import { getDesign } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Finished pieces from one family of birch panels: what you choose, what can change, and how a saved design becomes a quote.",
  alternates: { canonical: "/how-it-works" },
};

const show = ["bedside", "kitchen", "entry", "bookwall"] as const;

export default function HowItWorks() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.head}>
        <p className="eyebrow">How it works</p>
        <h1>Start with a finished piece. Change only what it supports.</h1>
        <p className="lede">
          You don&apos;t need to learn the panel system to choose a piece. This
          page explains it for anyone who wants to know what is behind the
          pieces, and what is still being decided.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="pieces">
        <h2 id="pieces">Finished pieces first</h2>
        <div className={styles.body}>
          <p>
            Every design starts as a complete piece with a clear use: a landing
            place by the door, a top beside the bed, more counter by the stove.
            The standard version is already whole; you can choose it as it is.
          </p>
          <p>
            Each design is marked <strong>Ready to configure</strong> or{" "}
            <strong>Concept</strong>. Configurable pieces have their parts and
            drawings worked out, so you can adjust and save them and ask for a
            quote. Concepts are directions we are still developing: you can save
            them as ideas and ask about them, but not configure or quote them
            yet.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="system">
        <h2 id="system">One family of panels</h2>
        <div className={styles.body}>
          <p>
            Pieces are 18 mm birch plywood on one grid: 60 cm wide, 40 cm deep,
            in 40 cm steps of height. Some pieces stack 40 cm sections; others
            use one full-height side panel. They stand on a base with adjustable
            pads, or on casters.
          </p>
          <div className={styles.figureRow}>
            {show.map((id) => {
              const d = getDesign(id)!;
              const r = recipes[d.recipe!];
              return (
                <figure key={id}>
                  <Elevation
                    recipe={r}
                    config={defaultConfig(d)!}
                    uid={`how-${id}`}
                    showDimensions={false}
                    title={d.name}
                  />
                  <figcaption>
                    {d.name}
                    <br />
                    {r.size.w / 10} × {r.size.h / 10} cm
                  </figcaption>
                </figure>
              );
            })}
          </div>
          <p>
            The panel with the grid of holes is the{" "}
            <strong>working face</strong>. Hooks, a small tray and rails hang on
            it, which is why accessories can be added or left off without
            changing the piece itself.
          </p>
          <p className="muted">
            Sizes, panel thickness and connectors are nominal design values from
            our records. They are confirmed for your exact version with the
            quote.
          </p>
        </div>
      </section>

      <section
        id="change"
        className={styles.section}
        aria-labelledby="change-title"
      >
        <h2 id="change-title">What can change</h2>
        <div className={styles.body}>
          <ul>
            <li>
              <strong>Finish:</strong> natural birch, or birch with the working
              face in orange.
            </li>
            <li>
              <strong>Front:</strong> open, or closed with doors, on pieces that
              take doors.
            </li>
            <li>
              <strong>Accessories:</strong> the hooks, tray and rails made for
              that piece.
            </li>
            <li>
              <strong>Quantity:</strong> one to ten of the same version.
            </li>
          </ul>
          <p>
            <strong>Not offered yet:</strong> other sizes, extra sections,
            seats, or anything that needs new parts or new support. If you need
            one of those, ask us; we will tell you honestly whether it can be
            made.
          </p>
          <p>
            Designs on the same frame share most of their parts. Product pages
            show how many parts stay, come off and go on between them, counted
            from the drawings. Turning one into another is still a concept: no
            conversion kit is offered.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="after">
        <h2 id="after">From saved design to quote</h2>
        <div className={styles.body}>
          <ol>
            <li>
              <strong>Save this version.</strong> {claims.saved.detail}
            </li>
            <li>
              <strong>Prepare quote request.</strong> On Saved designs, we write
              an email listing every version you include.{" "}
              {claims.quoteDraft.detail}
            </li>
            <li>
              <strong>We reply with a quote</strong> for the exact versions:
              price, lead time, delivery and assembly options for your address
              in Singapore.
            </li>
            <li>
              <strong>Order</strong> is confirmed with that quote. This site
              does not take payment.
            </li>
          </ol>
          <p>
            <Link href="/saved" className="text-link">
              Go to saved designs
            </Link>
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="open">
        <h2 id="open">What we haven&apos;t confirmed yet</h2>
        <div className={styles.body}>
          <p>
            We would rather say &quot;not yet&quot; than promise something we
            can&apos;t keep. These are not stated anywhere on the site until
            they are true:
          </p>
          <ul>
            <li>Prices, delivery areas, lead times and assembly service.</li>
            <li>Assembly time, returns and warranty terms.</li>
            <li>
              Whether a piece needs fixing to the wall. Taller pieces may; we
              confirm it for your version.
            </li>
            <li>
              Load ratings, and anything about seating, children or wet rooms.
            </li>
          </ul>
          <p className="muted">
            Images on this site are 3D renders of designs, not photographs of
            finished products.
          </p>
        </div>
      </section>
    </div>
  );
}
