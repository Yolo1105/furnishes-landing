import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeroDrawing } from "@/components/HeroDrawing";
import styles from "@/components/prose/prose.module.css";
import { claims } from "@/data/claims";
import { PORTS } from "@/data/hero";
import { FRAME_SRC, STUDIO, detailSrc, SQUARE } from "@/lib/renders";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "One full-height frame with two packs, a low block beside the bed, factory-made ports for add-ons, white matte faces with birch edges, and what is still being tested.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorks() {
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.head}>
        <h1>A finished piece first. Then only what it supports.</h1>
        <p className="lede">
          You don&apos;t need to learn a system to choose a piece. This page is
          for anyone who wants to know what&apos;s behind the pieces, and what
          is still being decided.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="frame">
        <h2 id="frame">One frame, two packs</h2>
        <div className={styles.body}>
          <p>
            The first piece is a full-height <strong>function face</strong>: two
            full-height sides, three face panels that slide in from the top, a
            structural base beam, a top, and a widened steel base. By the door
            it carries the <Link href="/furniture/entry">entry pack</Link>{" "}
            (hooks, a key tray, an umbrella ring, a slanted shoe shelf). Beside
            a desk it carries the{" "}
            <Link href="/furniture/desk">desk-side pack</Link> (two full-depth
            shelves, a cable tray, a pen pot, a bookend, and an optional
            aluminium rail).
          </p>
          <p>
            Changing from one pack to the other keeps the frame and swaps the
            pack. It takes new parts and one assembly; the parts that come off
            are yours to keep. The{" "}
            <Link href="/furniture/bedside">bedside block</Link> is the smaller
            companion: one low tier on a steel leg frame.
          </p>
          <div className={styles.figureRow}>
            <figure>
              <Image
                src={FRAME_SRC}
                alt="The bare frame both packs share"
                width={STUDIO.w}
                height={STUDIO.h}
                sizes="(max-width: 700px) 50vw, 240px"
              />
              <figcaption>The frame both packs share</figcaption>
            </figure>
            <figure>
              <HeroDrawing design="entry" title="Entry pack" uid="how-entry" />
              <figcaption>Entry pack, front and side</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="materials">
        <h2 id="materials">Materials</h2>
        <div className={styles.body}>
          <p>
            18 mm birch plywood is the face of Furnishes. Large faces are a
            quiet white matte; the edges show the layers of the birch. White
            laminate and white paint are being compared on sample panels for
            wear, humidity and colour.
          </p>
          <p>
            Steel does the jobs steel is good at: the base and legs, hidden
            connectors, and the stiffener under a long top. Aluminium appears
            only as the optional rail beside the desk.
          </p>
          <p>
            Accessories and add-ons come in one agreed accent colour, so a piece
            added later looks meant, not mismatched. {claims.accent.detail}
          </p>
          <div className={styles.figureRow}>
            <figure>
              <Image
                src={detailSrc("edge")}
                alt="White matte faces with the layered birch edge and a coat hook"
                width={SQUARE.w}
                height={SQUARE.h}
                sizes="(max-width: 700px) 50vw, 300px"
              />
              <figcaption>White faces, birch edges</figcaption>
            </figure>
            <figure>
              <Image
                src={detailSrc("base")}
                alt="The widened steel base with a levelling foot and the counterweight plate"
                width={SQUARE.w}
                height={SQUARE.h}
                sizes="(max-width: 700px) 50vw, 300px"
              />
              <figcaption>The widened steel base</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="stand">
        <h2 id="stand">Standing steady</h2>
        <div className={styles.body}>
          <p>{claims.stability.detail}</p>
          <p className="muted">
            A rough static calculation from the modelling spec (a 10 kg load
            hung at the front, pulled forward at 1.1 m) puts the widened base
            well above our planning target and a base without it below; it is
            not a test, and the tip-over tests come with the samples.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="ports">
        <h2 id="ports">Ports made in the factory</h2>
        <div className={styles.body}>
          <p>
            Each launch piece has its ports fixed at the factory. Add-ons only
            use those ports, so nothing is drilled at home. Heavy things (a
            mirror, a monitor arm, a desk top) fix to structural inserts, never
            to the hanging face.
          </p>
          <ul>
            {Object.entries(PORTS).map(([n, p]) => (
              <li key={n}>
                <strong>{p.name}</strong>{" "}
                <span className="muted">· {p.where}</span>
              </li>
            ))}
          </ul>
          <p className="muted">
            Exact positions are being set with the first samples.{" "}
            {claims.hangingFace.detail}
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="addons">
        <h2 id="addons">Add-ons, in three tiers</h2>
        <div className={styles.body}>
          <ul>
            <li>
              <strong>Available with the piece:</strong> accessory packs, extra
              shelves, a door, a drawer module, the desk top kit with its steel
              leg, swapping legs for casters on the low block, a second segment
              beside the first.
            </li>
            <li>
              <strong>After a test:</strong> a mirror, an upstand on a top, a
              seat, stacking the low block (up to three tiers, with a wall strap
              at three). Shown, but not offered until each passes its test.
            </li>
            <li>
              <strong>Research:</strong> deeper or taller versions, bridges and
              platforms. Not on this site.
            </li>
          </ul>
          <p>
            Turning one kind of furniture into a very different one is no longer
            something we offer. A change happens on the same piece, with the
            parts it supports.
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="after">
        <h2 id="after">From a kept version to an order</h2>
        <div className={styles.body}>
          <ol>
            <li>
              <strong>Keep this version.</strong> {claims.saved.detail}
            </li>
            <li>
              <strong>Email us about it.</strong> On Kept versions we write an
              email listing every version you include. {claims.draft.detail}
            </li>
            <li>
              <strong>Prices and ordering</strong> open for the launch pieces
              once their samples, quotes and tests are done. Until then we
              don&apos;t show a price or an estimate. Pieces coming soon follow
              one by one.
            </li>
          </ol>
          <p>
            <Link href="/saved" className="text-link">
              Go to kept versions
            </Link>
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="open">
        <h2 id="open">What we haven&apos;t confirmed yet</h2>
        <div className={styles.body}>
          <p>
            We would rather say &quot;not yet&quot; than promise something we
            can&apos;t keep:
          </p>
          <ul>
            <li>Prices, delivery areas, lead times and assembly service.</li>
            <li>Assembly time, returns and warranty terms.</li>
            <li>
              Depth of the entry pack (about 30 or 40 cm) and the bedside height
              (about 57 cm).
            </li>
            <li>
              The hanging face, the face-panel fixing, and the exact port
              positions.
            </li>
            <li>Load ratings.</li>
          </ul>
          <p className="muted">{claims.renders.detail}</p>
        </div>
      </section>
    </div>
  );
}
