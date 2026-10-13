import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/bits";
import { BeforeAfter } from "@/components/home/BeforeAfter";
import { VersionDemo } from "@/components/home/VersionDemo";
import { designs } from "@/data/designs";
import { market } from "@/data/market";
import { uses } from "@/data/vocabulary";
import { getDesign, images, sizeLabel } from "@/lib/catalog";
import styles from "./home.module.css";

const hero = getDesign("entry")!;
const configurable = designs.filter((d) => d.status === "configurable").length;

const realRooms = ["desk", "kitchen", "bookwall", "bedside"].map(
  (id) => getDesign(id)!,
);

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: market.siteName,
    url: market.siteUrl,
    email: market.email,
    areaServed: market.country,
  };
  return (
    <>
      <script
        type="application/ld+json"
        // static, trusted object; no user input
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroText}>
            <p className="eyebrow">
              Birch furniture for homes in {market.country}
            </p>
            <h1>A finished piece for the spot you have in mind.</h1>
            <p className="lede">
              By the door, beside the bed, next to the desk. Choose a piece as
              it is, adjust what it supports, and keep the exact version you
              want.
            </p>
            <div className={styles.ctas}>
              <Link href="/furniture" className="btn btn-primary">
                Browse furniture
              </Link>
              <Link href="/explore" className="btn btn-secondary">
                Explore possibilities
              </Link>
            </div>
            <Link href="/how-it-works" className="text-link">
              How choosing and customizing works
            </Link>
          </div>
          <figure className={styles.heroMedia}>
            <Image
              src={images.room(hero.id)}
              alt="An entry organiser beside the front door, holding a coat, a bag and shoes"
              width={960}
              height={600}
              sizes="(max-width: 900px) 100vw, 56vw"
              preload
              className={styles.heroImg}
            />
            <figcaption className={styles.heroCaption}>
              <Link href={`/furniture/${hero.id}`} className={styles.heroLink}>
                <span>
                  <strong>{hero.name}</strong> ·{" "}
                  <span className="num">{sizeLabel(hero.size)}</span>
                </span>
                <StatusBadge status={hero.status} long />
              </Link>
              <span className="muted">
                A 3D render of the design, not a photograph.
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="section" aria-labelledby="start">
        <div className="container">
          <div className="section-head">
            <h2 id="start">Start with a room</h2>
            <p className="lede">
              Each room opens the pieces made for it, with the ones you can
              configure first.
            </p>
          </div>
          <ul role="list" className={styles.rooms}>
            {uses.map((u) => {
              const example = getDesign(u.cover)!;
              return (
                <li key={u.id}>
                  <Link href={`/furniture?use=${u.id}`} className={styles.room}>
                    <Image
                      src={images.room(u.cover)}
                      alt=""
                      width={960}
                      height={600}
                      sizes="(max-width: 700px) 50vw, 320px"
                    />
                    <span className={styles.roomText}>
                      <strong>{u.name}</strong>
                      <span>{u.line}</span>
                      <span className="muted">For example: {example.name}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className={`section ${styles.band}`} aria-labelledby="version">
        <div className="container">
          <div className="section-head">
            <h2 id="version">One piece, your version</h2>
            <p className="lede">
              Every piece starts complete. Change what it supports, and the
              drawing, the parts and the summary change with it. Try it on the
              entry organiser.
            </p>
          </div>
          <VersionDemo />
        </div>
      </section>

      <section className="section" aria-labelledby="provide">
        <div className="container">
          <div className="section-head">
            <h2 id="provide">What Furnishes provides</h2>
          </div>
          <ul role="list" className={styles.provide}>
            <li>
              <h3>Finished pieces</h3>
              <p>
                {configurable} designs are ready to configure: complete pieces
                with their base and every part counted, for the entryway,
                bedside, desk, kitchen and living room.
              </p>
              <p className={styles.boundary}>
                <strong>Not yet:</strong> published prices and delivery times.
                Both come with your quote.
              </p>
              <Link href="/furniture?status=configurable" className="text-link">
                See the configurable pieces
              </Link>
            </li>
            <li>
              <h3>Changes each piece supports</h3>
              <p>
                Finish of the working face, an open front or doors, and the
                accessories that fit: hooks, a tray, rails. Only what that piece
                supports is offered.
              </p>
              <p className={styles.boundary}>
                <strong>Not yet:</strong> other sizes, or changes that need new
                parts.
              </p>
              <Link href="/how-it-works#change" className="text-link">
                What can change
              </Link>
            </li>
            <li>
              <h3>Help with bigger ideas</h3>
              <p>
                Shelving between two beds, a wall behind the sofa, a corner to
                work in. These room pieces are concepts; tell us about your room
                and we reply by email.
              </p>
              <p className={styles.boundary}>
                <strong>Not yet:</strong> online planning of a whole room.
              </p>
              <Link href="/help#plan" className="text-link">
                Ask about a room
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="rooms">
        <div className="container">
          <div className="section-head">
            <h2 id="rooms">In real rooms</h2>
            <p className="lede">
              The same spot, before and after. Every picture leads to the piece
              in it.
            </p>
          </div>
          <div className={styles.realGrid}>
            <BeforeAfter id="entry" name="Entry organiser" />
            <ul role="list" className={styles.realList}>
              {realRooms.map((d) => (
                <li key={d.id}>
                  <Link href={`/furniture/${d.id}`} className={styles.real}>
                    <Image
                      src={images.room(d.id)}
                      alt={`${d.name}, ${d.room}`}
                      width={960}
                      height={600}
                      sizes="(max-width: 900px) 50vw, 20vw"
                    />
                    <span>
                      <strong>{d.name}</strong>{" "}
                      <span className="muted">· {d.room}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={`section ${styles.band}`} aria-labelledby="choose">
        <div className="container">
          <div className="section-head">
            <h2 id="choose">How choosing works</h2>
          </div>
          <ol className={styles.steps}>
            <li>
              <span className={styles.stepNum}>1</span>
              <h3>Choose a piece</h3>
              <p>
                Browse by room or explore by what you need. Each piece shows its
                size and status.
              </p>
            </li>
            <li>
              <span className={styles.stepNum}>2</span>
              <h3>Customize this piece</h3>
              <p>
                Change only what it supports. The drawing and parts update as
                you go, and you can undo.
              </p>
            </li>
            <li>
              <span className={styles.stepNum}>3</span>
              <h3>Save this version</h3>
              <p>
                Saved designs keep the exact version in this browser. Edit or
                copy one any time.
              </p>
            </li>
            <li>
              <span className={styles.stepNum}>4</span>
              <h3>Prepare a quote request</h3>
              <p>
                We write the email for you with every saved version. You send
                it; we reply with price, lead time and delivery.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="system">
        <div className={`container ${styles.system}`}>
          <div className="section-head">
            <h2 id="system">One family of panels</h2>
            <p className="lede">
              Every piece is 18 mm birch plywood on the same grid: 60 cm wide,
              40 cm deep, in 40 cm steps of height. The panel with the holes is
              the working face, where hooks and trays hang.
            </p>
            <p className="muted">
              That shared grid is why a hallway organiser and a desk-side
              organiser share most of their parts. Changing one into another is
              still a concept, not a kit you can order.
            </p>
            <Link href="/how-it-works" className="text-link">
              How the system works
            </Link>
          </div>
          <div className={styles.systemImgs}>
            {["bedside", "kitchen", "entry", "coat-stand"].map((id) => {
              const d = getDesign(id)!;
              return (
                <Image
                  key={id}
                  src={images.object(id)}
                  alt={`${d.name}, ${sizeLabel(d.size)}`}
                  width={d.image.object.w}
                  height={d.image.object.h}
                  sizes="160px"
                  style={{
                    width: `${Math.round(d.image.object.w * 0.32)}px`,
                    height: "auto",
                  }}
                />
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
