import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterRail } from "@/components/ChapterRail";
import { ConceptImage, RenderNote, StatusBadge } from "@/components/bits";
import { HeroDrawing } from "@/components/HeroDrawing";
import { PartsPlate } from "@/components/PartsPlate";
import { Rail } from "@/components/Rail";
import { FitCheck } from "@/components/product/FitCheck";
import { Gallery, type GalleryView } from "@/components/product/Gallery";
import { BackToResults, SaveButton } from "@/components/product/ProductActions";
import { claims, statusInfo } from "@/data/claims";
import { choosableKits, heroSteps, packSwap, testingKits } from "@/data/hero";
import type { Product } from "@/data/types";
import { objects } from "@/data/vocabulary";
import {
  arrangementsWith,
  categoryName,
  fullSizeLabel,
  getProduct,
  packsFor,
  products,
  samePack,
  useName,
} from "@/lib/catalog";
import { plateRows } from "@/lib/callouts";
import { configHref, defaultConfig } from "@/lib/config";
import { askMail, interestMail } from "@/lib/mail";
import {
  FRAME_SRC,
  SCENE,
  SQUARE,
  STEP,
  STUDIO,
  detailSrc,
  partsSrc,
  sceneSrc,
  stepSrc,
  studioSrc,
} from "@/lib/renders";
import styles from "./product.module.css";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata(
  props: PageProps<"/furniture/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const p = getProduct(id);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.line} ${fullSizeLabel(p)}. ${statusInfo[p.status].label}.`,
    alternates: { canonical: `/furniture/${p.id}` },
    openGraph: {
      images: [{ url: sceneSrc(p.id), width: SCENE.w, height: SCENE.h }],
    },
  };
}

function views(p: Product): GalleryView[] {
  const v: GalleryView[] = [
    {
      key: "corner",
      label: "A corner",
      caption: `Design render · ${p.scene}`,
      image: {
        src: sceneSrc(p.id),
        w: SCENE.w,
        h: SCENE.h,
        alt: `${p.name} in a room, doing its job`,
      },
    },
    {
      key: "piece",
      label: "A piece",
      caption: p.hero
        ? "Design render · standard version · accent colour to be confirmed"
        : "Design render · early drawing",
      image: {
        src: studioSrc(p),
        w: STUDIO.w,
        h: STUDIO.h,
        alt: `${p.name} on its own`,
      },
      fit: "contain",
    },
  ];
  const room = arrangementsWith(p)[0];
  if (room)
    v.push({
      key: "room",
      label: "A room",
      caption: `${room.name}: an arrangement, not a product · earlier concept render`,
      image: {
        src: `/renders/room/${room.id}.webp`,
        w: 960,
        h: 600,
        alt: `${room.name}, an arrangement with the ${p.name.toLowerCase()}`,
      },
    });
  if (p.hero && p.hero !== "bedside")
    v.push({
      key: "edge",
      label: "Close up",
      caption:
        "White matte faces, birch edges (entry pack shown) · design render",
      image: {
        src: detailSrc("edge"),
        w: SQUARE.w,
        h: SQUARE.h,
        alt: "Close view of a top corner: white faces, the layered birch edge and a coat hook",
      },
    });
  if (p.hero && p.hero !== "bedside")
    v.push({
      key: "base",
      label: "The base",
      caption: "Widened steel base with counterweight · design render",
      image: {
        src: detailSrc("base"),
        w: SQUARE.w,
        h: SQUARE.h,
        alt: "Close view of the widened steel base, a levelling foot and the counterweight plate",
      },
    });
  if (p.hero)
    v.push({
      key: "drawing",
      label: "Measured",
      caption: "Nominal sizes from the modelling spec",
      node: <HeroDrawing design={p.hero} title={p.name} uid={`g-${p.id}`} />,
    });
  return v;
}

export default async function ProductPage(props: PageProps<"/furniture/[id]">) {
  const { id } = await props.params;
  const p = getProduct(id);
  if (!p) notFound();
  const config = defaultConfig(p);
  const other = samePack(p);
  const swap =
    other && p.hero && other.hero
      ? packSwap(p.hero as "entry" | "desk", other.hero as "entry" | "desk")
      : null;
  const myPacks = packsFor(p);
  const around = arrangementsWith(p);
  const kits = p.hero ? choosableKits(p.hero) : [];
  const testing = p.hero ? testingKits(p.hero) : [];
  const steps = p.hero ? heroSteps(p.hero) : [];
  const chapters = [
    { id: "piece", label: "The piece" },
    ...(swap ? [{ id: "change", label: "Keep this. Change the rest." }] : []),
    ...(kits.length ? [{ id: "addons", label: "Add-ons" }] : []),
    ...(myPacks.length ? [{ id: "uses", label: "Other uses" }] : []),
    ...(around.length ? [{ id: "around", label: "Around it" }] : []),
    ...(p.hero ? [{ id: "build", label: "How it goes together" }] : []),
    { id: "fit", label: "Will it fit?" },
  ];
  const things = p.objects.map((o, i) => {
    const n = objects.find((x) => x.id === o)!.name;
    return i === 0 ? n : n.charAt(0).toLowerCase() + n.slice(1);
  });

  return (
    <>
      <div className={`container ${styles.top}`}>
        <BackToResults design={p.id} />
        <nav aria-label="Breadcrumb" className={styles.crumbs}>
          <Link href="/furniture">Furniture</Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <Link href={`/furniture?type=${p.category}`}>
            {categoryName(p.category)}
          </Link>
        </nav>
      </div>

      <section className={`container ${styles.hero}`} aria-labelledby="p-title">
        <Gallery
          views={views(p)}
          start="corner"
          label={`Views of the ${p.name}`}
        />
        <div className={styles.decide}>
          <StatusBadge status={p.status} long />
          <h1 id="p-title" className={styles.title}>
            {p.name}
          </h1>
          <p className={styles.line}>{p.line}</p>
          <dl className={styles.facts}>
            <div>
              <dt>Size</dt>
              <dd className="spec">{fullSizeLabel(p)}, nominal</dd>
            </div>
            <div>
              <dt>Made for</dt>
              <dd>{things.join(", ")}</dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>{p.uses.map(useName).join(", ")}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>
                {p.status === "launch"
                  ? claims.price.label
                  : "Not yet: coming soon"}
              </dd>
            </div>
          </dl>
          {p.hero && config ? (
            <div className={styles.actions}>
              <Link
                href={configHref(config, "customize")}
                className="btn btn-primary"
              >
                Select configuration
              </Link>
              <SaveButton
                design={p.id}
                config={config}
                label="Keep this version"
              />
            </div>
          ) : (
            <div className={styles.actions}>
              <a href={interestMail(p)} className="btn btn-primary">
                Register interest
              </a>
              <p className={styles.small}>
                {claims.draft.label}: nothing is sent until you send it.
                Interest isn&apos;t an order.
              </p>
              <SaveButton design={p.id} config={null} label="Save this idea" />
            </div>
          )}
          <p className={styles.small}>{statusInfo[p.status].detail}</p>
          {p.skeleton === "f1200" && p.hero && (
            <p className={styles.notice}>
              <strong>{claims.stability.label}.</strong>{" "}
              {claims.stability.detail}
            </p>
          )}
          <a href={askMail(p, config)} className="text-link">
            Ask a question about it
          </a>
        </div>
      </section>

      <ChapterRail chapters={chapters} label={`About the ${p.name}`} />

      <section
        id="piece"
        className={`container ${styles.chapter}`}
        aria-labelledby="piece-t"
      >
        <div className={styles.split}>
          <div>
            <h2 id="piece-t">The piece</h2>
            <ul role="list" className={styles.situations}>
              {p.situations.map((s) => (
                <li key={s}>“{s}”</li>
              ))}
            </ul>
          </div>
          <div className={styles.notes}>
            <h3>What to know</h3>
            <ul>
              {p.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <h3>Materials</h3>
            <p>
              18 mm birch plywood. Large faces in a quiet white matte; the edges
              show the layers of the birch. Steel for the base, legs and hidden
              hardware.
              {p.hero ? " Accessories in one accent colour." : ""}
            </p>
            <p className={styles.small}>
              White laminate and white paint are still being compared on
              samples. {claims.accent.label}.
            </p>
            <RenderNote />
          </div>
        </div>
      </section>

      {swap && other && (
        <section id="change" className={styles.band} aria-labelledby="change-t">
          <div className="container">
            <div className={styles.bandHead}>
              <h2 id="change-t">Keep this. Change the rest.</h2>
              <p>
                The {p.name.toLowerCase()} and the {other.name.toLowerCase()}{" "}
                are the same frame with a different pack. Changing packs takes
                new parts and one assembly; the parts that come off are yours to
                keep.
              </p>
            </div>
            <ol className={styles.swap}>
              <li>
                <Image
                  src={FRAME_SRC}
                  alt="The bare frame both packs share"
                  width={STUDIO.w}
                  height={STUDIO.h}
                  sizes="(max-width: 900px) 33vw, 22vw"
                />
                <h3>Kept</h3>
                <p className="spec">
                  {swap.kept.length} parts: the frame and base
                </p>
              </li>
              <li>
                <Image
                  src={studioSrc(p)}
                  alt={`${p.name}`}
                  width={STUDIO.w}
                  height={STUDIO.h}
                  sizes="(max-width: 900px) 33vw, 22vw"
                />
                <h3>Taken off</h3>
                <ul className={styles.partList}>
                  {[...new Set(swap.removed.map((x) => x.name))].map((n) => (
                    <li key={n}>
                      {n} × {swap.removed.filter((x) => x.name === n).length}
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <Image
                  src={studioSrc(other)}
                  alt={`${other.name}`}
                  width={STUDIO.w}
                  height={STUDIO.h}
                  sizes="(max-width: 900px) 33vw, 22vw"
                />
                <h3>Added</h3>
                <ul className={styles.partList}>
                  {[...new Set(swap.added.map((x) => x.name))].map((n) => (
                    <li key={n}>
                      {n} × {swap.added.filter((x) => x.name === n).length}
                    </li>
                  ))}
                </ul>
              </li>
            </ol>
            <Link href={`/furniture/${other.id}`} className="btn btn-ink">
              See the {other.name.toLowerCase()}
            </Link>
          </div>
        </section>
      )}

      {kits.length > 0 && (
        <section
          id="addons"
          className={`container ${styles.chapter}`}
          aria-labelledby="addons-t"
        >
          <h2 id="addons-t">Add-ons</h2>
          <p className={styles.lede}>
            Add-ons fit the ports made in the factory; nothing is drilled at
            home. Those in testing are shown, but can&apos;t be chosen yet.
          </p>
          <ul role="list" className={styles.kits}>
            {kits.map((k) => (
              <li key={k.id}>
                <span className={styles.kitTier}>Available with the piece</span>
                <strong>{k.name}</strong>
                <span>{k.line}</span>
              </li>
            ))}
            {testing.map((k) => (
              <li key={k.id} data-testing>
                <span className={styles.kitTier}>In testing</span>
                <strong>{k.name}</strong>
                <span>{k.line}</span>
              </li>
            ))}
          </ul>
          {config && (
            <Link href={configHref(config, "customize")} className="text-link">
              Choose add-ons in Select configuration
            </Link>
          )}
        </section>
      )}

      {myPacks.length > 0 && (
        <section
          id="uses"
          className={`container ${styles.chapter}`}
          aria-labelledby="uses-t"
        >
          <h2 id="uses-t">Other uses</h2>
          <p className={styles.lede}>
            The same piece with another pack, face or top. They follow the{" "}
            {p.name.toLowerCase()}: no price of their own, and nothing to add
            yet.
          </p>
          <Rail label="Other uses" className={styles.rail}>
            {myPacks.map((k) => (
              <li key={k.id} className={styles.useCard}>
                <div className={styles.useImg}>
                  <ConceptImage
                    id={k.id}
                    kind="object"
                    alt={`${k.name}, earlier concept render`}
                    sizes="260px"
                  />
                </div>
                <span className={styles.kitTier}>
                  {k.state === "testing" ? "In testing" : "Follows the piece"}
                </span>
                <h3>{k.name}</h3>
                <p>{k.line}</p>
                <p className={styles.small}>{k.note}</p>
              </li>
            ))}
          </Rail>
          <p className={styles.small}>
            {claims.conceptRenders.label}: {claims.conceptRenders.detail}
          </p>
        </section>
      )}

      {around.length > 0 && (
        <section
          id="around"
          className={`container ${styles.chapter}`}
          aria-labelledby="around-t"
        >
          <h2 id="around-t">Around it</h2>
          <p className={styles.lede}>
            Arrangements with other pieces. They aren&apos;t products: each
            piece is chosen on its own, and an arrangement working isn&apos;t
            promised by each piece working.
          </p>
          <ul role="list" className={styles.arrangements}>
            {around.map((a) => (
              <li key={a.id}>
                <div className={styles.arrImg}>
                  <ConceptImage
                    id={a.id}
                    kind="room"
                    alt={`${a.name}, earlier concept render`}
                    sizes="(max-width: 700px) 100vw, 40vw"
                  />
                </div>
                <div>
                  <h3>{a.name}</h3>
                  <p>{a.line}</p>
                  <ul className={styles.members}>
                    {a.members.map((m) => {
                      const mp = getProduct(m.product)!;
                      return (
                        <li key={m.product + (m.note ?? "")}>
                          {m.count} ×{" "}
                          <Link href={`/furniture/${mp.id}`}>{mp.name}</Link>
                          {m.note ? (
                            <span className="muted"> ({m.note})</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                  <p className={styles.small}>{a.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.hero && (
        <section
          id="build"
          className={`container ${styles.chapter}`}
          aria-labelledby="build-t"
        >
          <h2 id="build-t">How it goes together</h2>
          <p className={styles.lede}>
            {steps.length} steps, by hand and with the L-key in the box. The
            face panels slide in from the top, which takes two people.
          </p>
          <PartsPlate
            src={partsSrc(p.hero)}
            alt={`The ${p.name} pulled apart into its parts`}
            items={plateRows(p.hero).map((r) => ({
              partId: r.key,
              name: r.name,
              quantity: r.quantity,
              spec: `${r.material} · ${r.size}`,
              at: r.at,
            }))}
            note={claims.parts.detail}
          />
          <h3 className={styles.stepsTitle}>Step by step</h3>
          <Rail label="Assembly steps" className={styles.rail}>
            {steps.map((s) => (
              <li key={s.n} className={styles.step}>
                <div className={styles.stepImg}>
                  <Image
                    src={stepSrc(p.hero!, s.n)}
                    alt=""
                    width={STEP.w}
                    height={STEP.h}
                    sizes="220px"
                  />
                </div>
                <span className="spec">
                  {String(s.n).padStart(2, "0")} ·{" "}
                  {s.people === 2 ? "two people" : "one person"} · {s.tool}
                </span>
                <strong>{s.title}</strong>
                <span className={styles.small}>Check: {s.check}</span>
              </li>
            ))}
          </Rail>
          <p className={styles.small}>{claims.assembly.detail}</p>
        </section>
      )}

      <section
        id="fit"
        className={`container ${styles.chapter}`}
        aria-labelledby="fit-t"
      >
        <h2 id="fit-t">Will it fit?</h2>
        <div className={styles.split}>
          <FitCheck size={p.size} name={p.name} />
          {p.hero ? (
            <figure className={styles.drawing}>
              <HeroDrawing design={p.hero} title={p.name} uid={`fit-${p.id}`} />
              <figcaption className="spec">
                Front and side, nominal sizes. The base reaches 20 cm in front
                of the body.
              </figcaption>
            </figure>
          ) : (
            <p className={styles.small}>
              Nominal size {fullSizeLabel(p)}. Its full drawings come once it
              follows the launch pieces.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
