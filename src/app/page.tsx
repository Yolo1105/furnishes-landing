import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/bits";
import { Elevation } from "@/components/Elevation";
import { ChangeDemo } from "@/components/home/ChangeDemo";
import { designs } from "@/data/designs";
import { market } from "@/data/market";
import { recipes } from "@/data/recipes";
import type { Design, UseId } from "@/data/types";
import { getDesign, recipeOf, sizeLabel } from "@/lib/catalog";
import { defaultConfig } from "@/lib/config";
import { STUDIO, studioSrc } from "@/lib/renders";
import styles from "./home.module.css";

const configurable = designs.filter((d) => d.status === "configurable").length;
const concepts = designs.length - configurable;
const entry = getDesign("entry")!;

/** A configurable design's standard version, rendered in the studio. */
function Shot({
  d,
  sizes,
  preload = false,
}: {
  d: Design;
  sizes: string;
  preload?: boolean;
}) {
  const r = recipeOf(d)!;
  return (
    <Image
      src={studioSrc(r.id, defaultConfig(d)!)}
      alt={`${d.name}, standard version`}
      width={STUDIO.w}
      height={STUDIO.h}
      sizes={sizes}
      preload={preload}
    />
  );
}

const places: { label: string; use: UseId; design: string }[] = [
  { label: "By the door", use: "entryway", design: "entry" },
  { label: "Beside the bed", use: "bedroom", design: "bedside" },
  { label: "Next to the desk", use: "work", design: "desk" },
  { label: "In the kitchen", use: "kitchen", design: "kitchen" },
  { label: "Under the TV", use: "living", design: "sideboard" },
  { label: "Between two spaces", use: "dividing", design: "bookwall" },
];

const featured = ["entry", "kitchen", "bookwall"].map((id) => getDesign(id)!);

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

      {/* 1. One finished piece, at human scale */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className="label">Birch plywood furniture · {market.country}</p>
          <h1 id="hero-title">
            One panel system, made into the piece your home needs.
          </h1>
          <p className={styles.heroLede}>
            By the door, beside the bed, next to the desk. Every piece arrives
            complete. Change only what it supports, and keep the exact version
            you choose.
          </p>
          <div className={styles.ctas}>
            <Link href="/explore" className="btn btn-primary">
              Explore by need
            </Link>
            <Link href="/furniture" className="btn btn-secondary">
              Browse furniture
            </Link>
          </div>
        </div>
        <figure className={styles.heroMedia}>
          <Image
            src="/renders/scene/entry-room.webp"
            alt="The entry organiser beside a front door: hooks, a key tray and two pairs of shoes on its shelf, an empty chair next to it"
            width={2400}
            height={1500}
            sizes="(max-width: 900px) 100vw, 66vw"
            preload
            className={styles.heroImg}
          />
          <figcaption className={styles.heroCaption}>
            <Link href="/furniture/entry" className={styles.heroPiece}>
              <strong>{entry.name}</strong>
              <span className="spec">{sizeLabel(entry.size)}</span>
              <StatusBadge status={entry.status} long />
              <span aria-hidden="true">→</span>
            </Link>
            <span className={styles.heroNote}>
              Rendered from our part model. Shoes and chair not included.
            </span>
          </figcaption>
        </figure>
      </section>

      {/* 2. Where would it help? */}
      <section className={styles.places} aria-labelledby="places-title">
        <div className={styles.placesHead}>
          <h2 id="places-title">Where would it help?</h2>
          <Link href="/explore" className="text-link">
            More ways to start
          </Link>
        </div>
        <ul role="list" className={styles.placeList}>
          {places.map((p) => {
            const d = getDesign(p.design)!;
            return (
              <li key={p.use}>
                <Link href={`/explore?room=${p.use}`} className={styles.place}>
                  <span className={styles.placeImg}>
                    <Shot d={d} sizes="200px" />
                  </span>
                  <span className={styles.placeLabel}>{p.label}</span>
                  <span className={styles.placePiece}>{d.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 3. Three pieces to start from */}
      <section className={styles.featured} aria-labelledby="featured-title">
        <div className={styles.sectionHead}>
          <h2 id="featured-title">Three pieces to start from</h2>
          <p className={styles.sub}>
            Each is ready to configure: parts counted, drawings measured,
            versions you can save and ask a quote for.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {featured.map((d, i) => {
            const r = recipeOf(d)!;
            return (
              <Link
                key={d.id}
                href={`/furniture/${d.id}`}
                className={styles.feature}
                data-big={i === 0 || undefined}
              >
                <span className={styles.featureImg}>
                  <Shot
                    d={d}
                    sizes={
                      i === 0
                        ? "(max-width: 900px) 100vw, 50vw"
                        : "(max-width: 900px) 100vw, 25vw"
                    }
                  />
                </span>
                <span className={styles.featureText}>
                  <strong>{d.name}</strong>
                  <span>{r.use}</span>
                  <span className="spec">{sizeLabel(d.size)}</span>
                </span>
              </Link>
            );
          })}
        </div>
        <Link href="/furniture" className={`text-link ${styles.allLink}`}>
          All {configurable} configurable pieces
        </Link>
      </section>

      {/* 4. A real supported change */}
      <section className={styles.change} aria-labelledby="change-title">
        <div className={styles.sectionHead}>
          <h2 id="change-title">A change, not a new piece</h2>
          <p className={styles.sub}>
            Pieces change only in ways their parts support. Try one: the camera
            stays put, so you see exactly what moves.
          </p>
        </div>
        <ChangeDemo />
      </section>

      {/* 5. The material */}
      <section className={styles.material} aria-labelledby="material-title">
        <figure className={styles.materialImg}>
          <Image
            src="/renders/scene/entry-detail.webp"
            alt="Close view of a corner: the 18 mm plywood edge with its plies, birch veneer, the working face's hole grid and two steel hooks"
            width={1500}
            height={1500}
            sizes="(max-width: 900px) 100vw, 50vw"
          />
        </figure>
        <div className={styles.materialText}>
          <h2 id="material-title">Made from one panel</h2>
          <hr className="ply-rule" />
          <p>
            Every piece is 18 mm birch plywood. The edge shows each ply; we
            leave it visible instead of hiding it under tape.
          </p>
          <p>
            The panel with the 40 mm hole grid is the working face. Hooks, a
            tray and rails hang on it, which is how an accessory is added
            without changing the piece.
          </p>
          <figure className={styles.drawing}>
            <Elevation
              recipe={recipes.entry}
              config={defaultConfig(entry)!}
              uid="home-mat"
              title="Entry organiser, measured front"
            />
            <figcaption className="spec">
              Measured drawing, nominal sizes
            </figcaption>
          </figure>
          <Link href="/how-it-works" className="text-link">
            How the system works
          </Link>
        </div>
      </section>

      {/* 6. What to expect, briefly */}
      <section className={styles.facts} aria-label="What to expect">
        <div>
          <strong className={styles.factNum}>{configurable}</strong>
          <p>pieces ready to configure, save and quote.</p>
          <Link href="/furniture" className="text-link">
            Browse them
          </Link>
        </div>
        <div>
          <strong className={styles.factNum}>Quote</strong>
          <p>
            Price, lead time and delivery are confirmed for your exact version.
          </p>
          <Link href="/how-it-works#after" className="text-link">
            How quoting works
          </Link>
        </div>
        <div>
          <strong className={styles.factNum}>{concepts}</strong>
          <p>more designs in the ideas library, still being developed.</p>
          <Link href="/furniture?status=concept" className="text-link">
            See the ideas
          </Link>
        </div>
      </section>
    </>
  );
}
