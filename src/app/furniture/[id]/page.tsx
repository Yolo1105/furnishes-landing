import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectRender, PriceState, RenderNote, StatusBadge } from "@/components/bits";
import { Elevation } from "@/components/Elevation";
import { FitCheck } from "@/components/product/FitCheck";
import { Gallery } from "@/components/product/Gallery";
import { BackToResults, SaveButton } from "@/components/product/ProductActions";
import { claims, statusInfo } from "@/data/claims";
import { designs } from "@/data/designs";
import { accessories } from "@/data/recipes";
import type { Design } from "@/data/types";
import { families, homes, uses } from "@/data/vocabulary";
import {
  frameName,
  getDesign,
  isConfigurable,
  problemsFor,
  recipeOf,
  sameFrame,
  sizeLabel,
} from "@/lib/catalog";
import {
  configHref,
  configSummary,
  defaultConfig,
  finishName,
  frontName,
  parseConfig,
} from "@/lib/config";
import { askMail } from "@/lib/mail";
import { changeTotals, compareParts, partCount, partsList, steps } from "@/lib/parts";
import styles from "./product.module.css";

export function generateStaticParams() {
  return designs.map((d) => ({ id: d.id }));
}

export async function generateMetadata(props: PageProps<"/furniture/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const d = getDesign(id);
  if (!d) return {};
  return {
    title: d.name,
    description: `${d.line} ${sizeLabel(d.size)}, birch plywood. ${statusInfo[d.status].label}.`,
    alternates: { canonical: `/furniture/${d.id}` },
    openGraph: { images: [{ url: `/renders/room/${d.id}.webp`, width: 960, height: 600 }] },
  };
}

function SiblingChange({ from, to }: { from: Design; to: Design }) {
  const a = recipeOf(from);
  const b = recipeOf(to);
  const fa = defaultConfig(from);
  const fb = defaultConfig(to);
  if (!a || !b || !fa || !fb || a.id === b.id) return null;
  const t = changeTotals(compareParts(partsList(a, fa), partsList(b, fb)));
  return (
    <p className={styles.change}>
      From this piece: <strong>{t.kept}</strong> parts stay, <strong>{t.removed}</strong> come
      off, <strong>{t.added}</strong> go on.
    </p>
  );
}

export default async function ProductPage(props: PageProps<"/furniture/[id]">) {
  const { id } = await props.params;
  const design = getDesign(id);
  if (!design) notFound();
  const recipe = recipeOf(design);
  const configurable = isConfigurable(design);
  const { config, issues } = configurable
    ? parseConfig(design.id, await props.searchParams)
    : { config: null, issues: [] };
  const base = configurable ? defaultConfig(design) : null;
  const isDefault = config && base && configSummary(config) === configSummary(base) && config.quantity === 1;
  const rows = recipe ? partsList(recipe, config ?? defaultConfig(design)!) : [];
  const buildSteps = recipe ? steps(recipe, config ?? defaultConfig(design)!) : [];
  const siblings = sameFrame(design);
  const situations = problemsFor(design);
  const mainUse = uses.find((u) => u.id === design.uses[0])!;
  const tall = design.size.h >= 1600;
  const grownFrom = design.grownFrom ? getDesign(design.grownFrom.design) : undefined;

  const drawing = recipe ? (
    <Elevation
      recipe={recipe}
      config={config ?? defaultConfig(design)!}
      uid={`g-${design.id}`}
      title={`${design.name}, front`}
    />
  ) : undefined;

  return (
    <div className="container">
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <ol role="list">
          <li>
            <Link href="/furniture">Furniture</Link>
          </li>
          <li>
            <Link href={`/furniture?use=${mainUse.id}`}>{mainUse.name}</Link>
          </li>
          <li aria-current="page">{design.name}</li>
        </ol>
        <BackToResults design={design.id} />
      </nav>

      <div className={styles.top}>
        <div className={styles.media}>
          <Gallery design={design} {...(drawing ? { drawing } : {})} />
          <RenderNote />
        </div>

        <div className={styles.decide}>
          <StatusBadge status={design.status} long />
          <h1 className={styles.title}>{design.name}</h1>
          <p className={styles.line}>{recipe && configurable ? recipe.use : design.line}</p>

          {issues.length > 0 && (
            <div className="notice" role="status">
              {issues.map((i) => (
                <p key={i}>{i}</p>
              ))}
            </div>
          )}

          <dl className={styles.facts}>
            <div>
              <dt>Size</dt>
              <dd className="num">
                {sizeLabel(design.size)} <span className="muted">W × H × D, nominal</span>
              </dd>
            </div>
            <div>
              <dt>Material</dt>
              <dd>Birch plywood, 18 mm panels (nominal)</dd>
            </div>
            {config && recipe && (
              <div>
                <dt>{isDefault ? "Standard version" : "Your version"}</dt>
                <dd>
                  {finishName(config.finish)}
                  {recipe.doors ? ` · ${frontName(config.front)}` : ""}
                  <br />
                  {config.accessories.length
                    ? config.accessories.map((a) => accessories[a].name).join(", ")
                    : "No accessories"}
                  {config.quantity > 1 ? ` · Quantity ${config.quantity}` : ""}
                </dd>
              </div>
            )}
            <div>
              <dt>Included</dt>
              <dd>
                {recipe
                  ? `The piece and its ${rows.find((r) => r.group === "Base")?.name.toLowerCase() ?? "base"}${config?.accessories.length ? ", with the accessories above" : ""}. ${partCount(rows)} parts in all.`
                  : "Not defined yet: this is a concept."}{" "}
                <span className="muted">Objects shown in the images are not included.</span>
              </dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>
                <PriceState design={design} />
                {configurable && <span className="muted"> · {claims.leadTime.label}</span>}
              </dd>
            </div>
          </dl>

          <div className={styles.actions}>
            {configurable && config ? (
              <>
                <Link href={configHref(config, "customize")} className="btn btn-primary">
                  Customize this piece
                </Link>
                <SaveButton design={design.id} config={config} label="Save this version" />
              </>
            ) : (
              <>
                <SaveButton
                  design={design.id}
                  config={null}
                  label="Save as an idea"
                  className="btn btn-primary"
                />
                <a href={askMail(design)} className="btn btn-secondary">
                  Ask about this design
                </a>
              </>
            )}
          </div>
          <p className={styles.statusNote}>{statusInfo[design.status].detail}</p>
        </div>
      </div>

      <div className={styles.sections}>
        <section className={styles.section} aria-labelledby="for">
          <h2 id="for">What it&apos;s for</h2>
          <div className={styles.cols}>
            <div className={styles.prose}>
              <p>{recipe && configurable ? recipe.description : design.line}</p>
              {design.status === "concept" && recipe && (
                <p className="muted">
                  Study notes: {recipe.description}
                </p>
              )}
              <p className="muted">
                Shown in {homes[design.home].toLowerCase()}, {design.room}. Part of the{" "}
                {families[design.family].plural.toLowerCase()} family, on the “{frameName(design.frame)}” frame.
              </p>
            </div>
            {situations.length > 0 && (
              <div>
                <h3 className={styles.small}>Made for moments like</h3>
                <ul role="list" className={styles.quotes}>
                  {situations.map((s) => (
                    <li key={s}>“{s}”</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {configurable && recipe && config && (
          <section className={styles.section} aria-labelledby="change">
            <h2 id="change">What you can change</h2>
            <ul role="list" className={styles.options}>
              <li>
                <h3 className={styles.small}>Finish</h3>
                <p>
                  {recipe.orangeFace
                    ? "Natural birch, or birch with the working face in orange."
                    : "Natural birch only."}
                </p>
              </li>
              <li>
                <h3 className={styles.small}>Front</h3>
                <p>{recipe.doors ? "Open, or closed with doors." : "Open front only."}</p>
              </li>
              <li>
                <h3 className={styles.small}>Accessories</h3>
                <p>
                  {[...recipe.defaultAccessories, ...recipe.optionalAccessories].length
                    ? [...recipe.defaultAccessories, ...recipe.optionalAccessories]
                        .map((a) => accessories[a].name)
                        .join(", ")
                    : "None for this piece yet."}
                </p>
              </li>
              <li>
                <h3 className={styles.small}>Size</h3>
                <p>One size for now: {sizeLabel(design.size)}. Other sizes are not offered yet.</p>
              </li>
            </ul>
            <Link href={configHref(config, "customize")} className="btn btn-primary">
              Customize this piece
            </Link>
          </section>
        )}

        <section className={styles.section} aria-labelledby="size">
          <h2 id="size">Size and space</h2>
          <div className={styles.cols}>
            <div className={styles.drawings}>
              {recipe ? (
                <>
                  <figure>
                    <Elevation recipe={recipe} config={config ?? defaultConfig(design)!} uid={`s-${design.id}`} title={`${design.name}, front`} />
                    <figcaption>Front</figcaption>
                  </figure>
                  <figure>
                    <Elevation recipe={recipe} config={config ?? defaultConfig(design)!} view="side" uid={`s-${design.id}`} title={`${design.name}, side`} />
                    <figcaption>Side</figcaption>
                  </figure>
                </>
              ) : (
                <figure className={styles.conceptFigure}>
                  <ObjectRender design={design} sizes="(max-width: 900px) 60vw, 25vw" />
                  <figcaption>
                    Outline size {sizeLabel(design.size)}. A measured drawing comes when the
                    concept has a parts recipe.
                  </figcaption>
                </figure>
              )}
            </div>
            <div className={styles.prose}>
              <p>{recipe ? recipe.space : "Sizes are the outline of the concept and may change."}</p>
              {tall && <p className="muted">{claims.fixing.detail}</p>}
              <FitCheck size={design.size} name={design.name} />
            </div>
          </div>
        </section>

        {recipe && (
          <section className={styles.section} aria-labelledby="parts">
            <h2 id="parts">Parts and how it goes together</h2>
            <p className="muted">
              {configurable ? claims.parts.detail : "A study recipe for this concept, not a product."}
            </p>
            <div className={styles.cols}>
              <details className={styles.details} open={configurable}>
                <summary>
                  {claims.parts.label}: {partCount(rows)} parts
                  {config && !isDefault ? " for your version" : ""}
                </summary>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Part</th>
                      <th scope="col">Size</th>
                      <th scope="col" className="num">
                        Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.partId}>
                        <td>{r.name}</td>
                        <td className="muted">{r.spec}</td>
                        <td className="num">{r.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
              <details className={styles.details}>
                <summary>
                  {claims.assembly.label}: {buildSteps.length} steps
                </summary>
                <p className="muted">{claims.assembly.detail}</p>
                <ol className={styles.steps}>
                  {buildSteps.map((s) => (
                    <li key={s.title}>
                      <strong>{s.title}.</strong> {s.detail}{" "}
                      <span className="muted">
                        {s.parts.map((p) => `${p.quantity} × ${p.name.toLowerCase()}`).join(", ")}
                      </span>
                    </li>
                  ))}
                </ol>
              </details>
            </div>
          </section>
        )}

        <section className={styles.section} aria-labelledby="delivery">
          <h2 id="delivery">Delivery and assembly</h2>
          <div className={styles.prose}>
            <p>{claims.delivery.detail}</p>
            <p className="muted">
              {claims.leadTime.label}. We don&apos;t state delivery days, assembly time or
              return terms until they are confirmed.
            </p>
          </div>
        </section>

        {(siblings.length > 0 || grownFrom) && (
          <section className={styles.section} aria-labelledby="frame">
            <h2 id="frame">Same frame, another use</h2>
            <p className="muted">
              These designs start from the same frame as the {design.name.toLowerCase()}. Changing
              one into another is a concept: part counts come from the drawings, and no
              conversion kit is offered yet.
            </p>
            {grownFrom && (
              <p className={styles.grown}>
                Grows out of the <Link href={`/furniture/${grownFrom.id}`}>{grownFrom.name.toLowerCase()}</Link>
                {design.grownFrom?.adds ? ` by adding ${design.grownFrom.adds}.` : "."}
              </p>
            )}
            <ul role="list" className={styles.siblings}>
              {siblings.map((s) => (
                <li key={s.id}>
                  <Link href={`/furniture/${s.id}`} className={styles.sibling}>
                    <span className={styles.siblingImg}>
                      <ObjectRender design={s} sizes="120px" scale={0.18} />
                    </span>
                    <span className={styles.siblingText}>
                      <StatusBadge status={s.status} />
                      <strong>{s.name}</strong>
                      <span className="muted">{s.line}</span>
                      <SiblingChange from={design} to={s} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
