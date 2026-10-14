import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { ChapterRail } from "@/components/ChapterRail";
import { HeroDrawing } from "@/components/HeroDrawing";
import { PlanGlyph } from "@/components/PlanGlyph";
import { ConceptImage, ProductImage, StatusBadge } from "@/components/bits";
import { PartsPlate } from "@/components/PartsPlate";
import { Rail } from "@/components/Rail";
import { ChangeSteps, type Step } from "@/components/home/ChangeSteps";
import { Spaces, type Space } from "@/components/home/Spaces";
import { claims } from "@/data/claims";
import { packSwap } from "@/data/hero";
import { families } from "@/data/vocabulary";
import type { FamilyId } from "@/data/types";
import { market } from "@/data/market";
import {
  arrangements,
  comingSoon,
  fullSizeLabel,
  getProduct,
  launchPieces,
  packs,
  products,
  uses,
} from "@/lib/catalog";
import { plateRows } from "@/lib/callouts";
import { records } from "@/lib/records";
import {
  FRAME_SRC,
  HERO,
  SCENE,
  SQUARE,
  STUDIO,
  detailSrc,
  partsSrc,
  sceneSrc,
  studioSrc,
} from "@/lib/renders";
import styles from "./home.module.css";

const entry = getProduct("entry")!;
const desk = getProduct("desk")!;

const spaces: Space[] = [
  {
    use: "entryway",
    job: "Hang the bag, drop the keys, leave the shoes",
    id: "entry",
  },
  { use: "work", job: "Tools and cables beside the desk you keep", id: "desk" },
  {
    use: "bedroom",
    job: "Phone, glasses and a book within reach",
    id: "bedside",
  },
].map((s) => {
  const p = getProduct(s.id)!;
  const u = uses.find((x) => x.id === s.use)!;
  return {
    use: s.use,
    label: u.name,
    job: s.job,
    count: products.filter((x) => x.uses.includes(s.use as typeof u.id)).length,
    scene: sceneSrc(p.id),
    piece: {
      id: p.id,
      name: p.name,
      status: p.status,
      size: fullSizeLabel(p),
      use: p.line,
      studio: studioSrc(p),
    },
  };
});

const otherSpaces = uses
  .filter((u) => !["entryway", "work", "bedroom"].includes(u.id))
  .map((u) => ({
    use: u.id,
    label: u.name,
    count: products.filter((p) => p.uses.includes(u.id)).length,
  }));

const swap = packSwap("entry", "desk");
const changeSteps: Step[] = [
  {
    title: "The frame",
    text: "Two full-height sides, three face panels, a beam, a top and the widened base. This part stays.",
    delta: `${swap.kept.length} parts kept in every pack`,
    src: FRAME_SRC,
    alt: "The bare function face frame on its widened steel base",
    href: "/how-it-works#frame",
    label: "How the frame works",
  },
  {
    title: "Entry pack",
    text: "Hooks, a key tray, an umbrella ring, a slanted shoe shelf and a narrow shelf.",
    delta: `+ ${swap.removed.length} parts on the frame`,
    src: studioSrc(entry),
    alt: "The function face with the entry pack",
    href: "/furniture/entry",
    label: "See the entry pack",
  },
  {
    title: "Desk-side pack",
    text: "The same frame beside a desk: two full-depth shelves, a cable tray, a pen pot and a bookend.",
    delta: `Takes off ${swap.removed.length}, adds ${swap.added.length}; the parts taken off are yours to keep`,
    src: studioSrc(desk),
    alt: "The function face with the desk-side pack",
    href: "/furniture/desk",
    label: "See the desk-side pack",
  },
];

const chapters = [
  { id: "places", label: "Where" },
  { id: "packs", label: "One frame, two packs" },
  { id: "made", label: "Made of" },
  { id: "kinds", label: "Pieces, walls, screens" },
  { id: "soon", label: "Coming soon" },
  { id: "rooms", label: "Arrangements" },
  { id: "fit", label: "Will it fit" },
  { id: "next", label: "Next step" },
];

const FAMILIES: FamilyId[] = ["pieces", "walls", "screens"];
const familyUses = (f: FamilyId) =>
  packs.filter((k) => k.parents.some((id) => getProduct(id)?.family === f))
    .length;

function HeroPicture() {
  const common = {
    alt: "The function face with the entry pack beside a front door: a bag on a hook, keys in the tray, shoes on the slanted shelf",
    sizes: "(max-width: 900px) 100vw, 60vw",
  };
  const {
    props: { srcSet: wide },
  } = getImageProps({
    ...common,
    src: HERO.wide.src,
    width: HERO.wide.w,
    height: HERO.wide.h,
    quality: 85,
  });
  const {
    props: { srcSet: phone, ...rest },
  } = getImageProps({
    ...common,
    src: HERO.phone.src,
    width: HERO.phone.w,
    height: HERO.phone.h,
    quality: 85,
    preload: true,
  });
  return (
    <picture>
      <source media="(min-width: 901px)" srcSet={wide} />
      <source media="(max-width: 900px)" srcSet={phone} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is in rest */}
      <img {...rest} className={styles.heroImg} />
    </picture>
  );
}

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

      {/* 1. The complete object, at home */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.field}>
          <p className={styles.kicker}>
            Birch plywood furniture · {market.country}
          </p>
          <h1 id="hero-title" className={styles.statement}>
            From an idea, to a home you like.
          </h1>
          <p className={styles.heroLede}>
            By the door, beside the desk, next to the bed: complete furniture
            from one family of birch plywood parts. See the finished piece
            first, then choose what you need.
          </p>
          <div className={styles.ctas}>
            <Link href="/furniture" className="btn btn-ink">
              See the pieces
            </Link>
            <Link href="/explore" className="btn btn-secondary">
              Start with what you love
            </Link>
          </div>
        </div>
        <figure className={styles.heroMedia}>
          <HeroPicture />
          <figcaption className={styles.heroCaption}>
            <Link href="/furniture/entry" className={styles.heroPiece}>
              <strong>{entry.name}</strong>
              <span className="spec">{fullSizeLabel(entry)}</span>
            </Link>
            <span className="spec">Design render · {claims.price.label}</span>
          </figcaption>
          <Link href="/furniture/desk" className={styles.inset}>
            <Image
              src={sceneSrc("desk")}
              alt="The same frame with the desk-side pack, beside a desk"
              width={SCENE.w}
              height={SCENE.h}
              sizes="(max-width: 900px) 40vw, 18vw"
            />
            <span>Same frame, beside a desk →</span>
          </Link>
        </figure>
      </section>

      <ChapterRail chapters={chapters} />

      {/* 2. Where does it need to work? */}
      <section
        id="places"
        className={styles.chapter}
        aria-labelledby="places-t"
      >
        <div className={styles.head}>
          <h2 id="places-t">Where does it need to work?</h2>
          <p>
            Three launch pieces, each for one place. Pick a place to see its
            piece.
          </p>
        </div>
        <Spaces spaces={spaces} others={otherSpaces} />
      </section>

      {/* 3. Keep this. Change the rest. */}
      <section id="packs" className={styles.band} aria-labelledby="packs-t">
        <div className={styles.bandInner}>
          <div className={styles.head}>
            <h2 id="packs-t">Keep this. Change the rest.</h2>
            <p>
              The entry pack and the desk-side pack are one frame with a
              different pack. If the piece moves from the door to the desk one
              day, the frame stays; the pack changes, with new parts and one
              assembly.
            </p>
          </div>
          <ChangeSteps
            steps={changeSteps}
            size={STUDIO}
            caption="Design render · one camera for every step"
          />
        </div>
      </section>

      {/* 4. What it's made of */}
      <section id="made" className={styles.material} aria-labelledby="made-t">
        <figure className={styles.macro}>
          <Image
            src={detailSrc("edge")}
            alt="Close view of a top corner: white matte faces, the layered birch edge, a coat hook in the accent colour"
            width={SQUARE.w}
            height={SQUARE.h}
            sizes="(max-width: 900px) 100vw, 55vw"
          />
        </figure>
        <div className={styles.materialText}>
          <h2 id="made-t">Plywood is the face.</h2>
          <ul role="list" className={styles.factList}>
            <li>
              <strong>18 mm birch plywood</strong>
              <span>
                Large faces in a quiet white matte; the edges show the layers of
                the birch.
              </span>
            </li>
            <li>
              <strong>Steel where it counts</strong>
              <span>
                The base, the legs and the hidden connectors. The tall pieces
                stand on a widened base with a counterweight, and a wall strap
                comes in the box.
              </span>
            </li>
            <li>
              <strong>One accent colour</strong>
              <span>
                Hooks, trays and add-ons, so new parts look meant. The final
                colour is chosen with the samples.
              </span>
            </li>
          </ul>
          <Image
            src={detailSrc("base")}
            alt="The widened steel base with its levelling foot and counterweight plate"
            width={SQUARE.w}
            height={SQUARE.h}
            sizes="200px"
            className={styles.baseImg}
          />
          <Link href="/how-it-works#materials" className="text-link">
            Materials and what&apos;s still being tested
          </Link>
        </div>
      </section>

      <section className={styles.chapter} aria-labelledby="parts-t">
        <div className={styles.head}>
          <h2 id="parts-t">Every part, where it goes</h2>
          <p>
            The entry pack, pulled apart. Point at a number to find the part.
            Thirteen steps, by hand and with the L-key in the box.
          </p>
        </div>
        <PartsPlate
          src={partsSrc("entry")}
          alt="The entry pack pulled apart into its parts"
          items={plateRows("entry").map((r) => ({
            partId: r.key,
            name: r.name,
            quantity: r.quantity,
            spec: `${r.material} · ${r.size}`,
            at: r.at,
          }))}
          note={claims.parts.detail}
        />
        <Link href="/furniture/entry#build" className="text-link">
          See the 13 steps
        </Link>
      </section>

      {/* 5. Three kinds, seen from above at one scale */}
      <section id="kinds" className={styles.chapter} aria-labelledby="kinds-t">
        <div className={styles.headRow}>
          <div className={styles.head}>
            <h2 id="kinds-t">Pieces, walls, screens</h2>
            <p>
              Three kinds of furniture from the same boards. Seen from above at
              one scale, so you can compare what each takes from a room.
            </p>
          </div>
          <Link href="/furniture?view=all" className="text-link">
            All {records.length} designs
          </Link>
        </div>
        <ul role="list" className={styles.kinds}>
          {FAMILIES.map((f) => {
            const list = products.filter((p) => p.family === f);
            const extra = familyUses(f);
            return (
              <li key={f} className={styles.kind}>
                <div className={styles.plans} aria-hidden="true">
                  {list.map((p) => (
                    <PlanGlyph key={p.id} product={p} scale={1 / 22} label="" />
                  ))}
                </div>
                <h3>{families[f].name}</h3>
                <p>{families[f].line}</p>
                <p className="spec">
                  {list.length} {list.length === 1 ? "design" : "designs"}
                  {extra
                    ? ` · ${extra} other ${extra === 1 ? "use" : "uses"}`
                    : ""}
                </p>
                <Link
                  href={`/furniture?view=family#fam-${f}`}
                  className="text-link"
                >
                  See the {families[f].name.toLowerCase()}
                </Link>
              </li>
            );
          })}
        </ul>
        <p className={styles.small}>
          Top views, all at one scale. Dashed lines are a base reaching forward.
        </p>
      </section>

      {/* 6. The breadth: second batch */}
      <section id="soon" className={styles.chapter} aria-labelledby="soon-t">
        <div className={styles.headRow}>
          <div className={styles.head}>
            <h2 id="soon-t">Coming soon</h2>
            <p>
              {comingSoon.length} more pieces follow the launch pieces, one by
              one, each reusing a frame they prove. Explore them, keep the ones
              you like and register interest. No prices or dates yet.
            </p>
          </div>
          <Link href="/furniture?status=soon" className="text-link">
            All {comingSoon.length}
          </Link>
        </div>
        <Rail label="Pieces coming soon">
          {comingSoon.map((p) => (
            <li key={p.id} className={styles.soonCard}>
              <Link href={`/furniture/${p.id}`} className={styles.soonLink}>
                <span className={styles.soonImg}>
                  <ProductImage product={p} sizes="240px" />
                </span>
                <StatusBadge status={p.status} />
                <strong>{p.name}</strong>
                <span className="spec">{fullSizeLabel(p)}</span>
              </Link>
            </li>
          ))}
        </Rail>
        <p className={styles.small}>
          Plus {packs.length} other uses that come with their piece (a coffee
          corner, a record display, a video backdrop…), shown on each
          piece&apos;s page.
        </p>
      </section>

      {/* 7. Arrangements */}
      <section id="rooms" className={styles.chapter} aria-labelledby="rooms-t">
        <div className={styles.head}>
          <h2 id="rooms-t">A corner, a room</h2>
          <p>
            Pieces can stand together: an L of shelves, a bed head with two
            bedsides, two screens as one. These are arrangements, not products:
            each piece is chosen on its own.
          </p>
        </div>
        <ul role="list" className={styles.arrangements}>
          {arrangements.slice(0, 6).map((a) => (
            <li key={a.id}>
              <span className={styles.arrImg}>
                <ConceptImage
                  id={a.id}
                  kind="object"
                  alt=""
                  sizes="(max-width: 700px) 50vw, 300px"
                />
              </span>
              <strong>{a.name}</strong>
              <span className={styles.small}>
                {a.members
                  .map(
                    (m) =>
                      `${m.count} × ${getProduct(m.product)!.name.toLowerCase()}`,
                  )
                  .join(" + ")}
              </span>
            </li>
          ))}
        </ul>
        <h3 className={styles.atlasTitle}>
          All {arrangements.length}, from above
        </h3>
        <ul role="list" className={styles.atlas}>
          {arrangements.map((a) => (
            <li key={a.id}>
              <Link
                href={`/furniture/${a.members[0]!.product}#around`}
                className={styles.atlasLink}
              >
                <span className={styles.atlasPlan}>
                  <PlanGlyph
                    arrangement={a.id}
                    scale={1 / 40}
                    label={`${a.name}, seen from above`}
                  />
                </span>
                <span>{a.name}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className={styles.small}>
          {claims.conceptRenders.label}. {claims.conceptRenders.detail} Plans
          are schematic: 60 × 40 cm segments placed as each arrangement
          describes them, desk tops dashed.
        </p>
      </section>

      {/* 8. Will it fit: one measured example */}
      <section id="fit" className={styles.chapter} aria-labelledby="fit-t">
        <div className={styles.fit}>
          <div className={styles.head}>
            <h2 id="fit-t">Measure once.</h2>
            <p>
              Every launch piece is drawn to the millimetre from its modelling
              spec. The entry pack is 60 cm wide and 128 cm high; the body is 40
              cm deep and its base reaches 20 cm further, so keep 60 cm of floor
              clear.
            </p>
            <p className={styles.small}>{claims.fit.detail}</p>
            <Link href="/furniture/entry#fit" className="text-link">
              Check it against your space
            </Link>
          </div>
          <figure className={styles.fitDrawing}>
            <HeroDrawing
              design="entry"
              title="Function face, entry pack: front and side"
              uid="home-fit"
            />
            <figcaption className="spec">
              Front and side · nominal sizes
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 9. Next step */}
      <section id="next" className={styles.closing} aria-labelledby="next-t">
        <div className={styles.closingInner}>
          <h2 id="next-t">Keep looking, or keep a version.</h2>
          <div className={styles.paths}>
            <div>
              <h3>Continue exploring</h3>
              <p>
                Start from a place or the things you love; every result says why
                it fits.
              </p>
              <Link href="/explore" className="btn btn-ink">
                Start with what you love
              </Link>
            </div>
            <div>
              <h3>Keep a version</h3>
              <p>
                Choose a launch piece&apos;s pack and add-ons and keep it in
                this browser. Email it to us when you like; nothing is sent
                until you send it. Prices come once samples and quotes are done.
              </p>
              <Link
                href={`/furniture/${launchPieces[0]!.id}`}
                className="btn btn-secondary"
              >
                Choose a launch piece
              </Link>
            </div>
            <div>
              <h3>Ask, or send for a quote</h3>
              <p>
                Send your kept versions as one email when you&apos;re ready.
                Questions about a space, a piece or timing go to the same
                address. {claims.price.label}.
              </p>
              <Link href="/help" className="btn btn-secondary">
                Help and questions
              </Link>
            </div>
          </div>
          <p className={styles.closingIndex}>
            <Link href="/furniture?view=all">
              Every design in one list: all {records.length}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
