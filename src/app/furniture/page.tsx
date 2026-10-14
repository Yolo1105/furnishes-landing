import type { Metadata } from "next";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { FiltersDrawer } from "@/components/FiltersDrawer";
import { PlanGlyph } from "@/components/PlanGlyph";
import { ProductCard } from "@/components/ProductCard";
import { claims } from "@/data/claims";
import type { FamilyId, Product } from "@/data/types";
import { families } from "@/data/vocabulary";
import { categories, fullSizeLabel, products, uses } from "@/lib/catalog";
import {
  filterParams,
  filterProducts,
  parseFilters,
  widthBands,
  type ListFilters,
} from "@/lib/explore";
import {
  kindLabel,
  records,
  type DesignKind,
  type DesignRecord,
} from "@/lib/records";
import { SCENE, sceneSrc } from "@/lib/renders";
import styles from "./furniture.module.css";

export const metadata: Metadata = {
  title: "Furniture",
  description:
    "Every Furnishes design: three launch pieces, eleven coming soon, and the other uses and arrangements they make. By family, by room, or all at once.",
  alternates: { canonical: "/furniture" },
};

type View = "family" | "room" | "all";
const FAMILY_SCENE: Record<FamilyId, string> = {
  pieces: "entry",
  walls: "bookwall",
  screens: "mobile-screen",
};

function hrefWith(
  f: ListFilters,
  view: View,
  patch: Partial<ListFilters> = {},
  kind?: string | null,
) {
  const q = filterParams({ ...f, ...patch });
  if (view !== "family") q.set("view", view);
  if (kind) q.set("kind", kind);
  const qs = q.toString();
  return qs ? `/furniture?${qs}` : "/furniture";
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={styles.chip}
      aria-current={active ? "true" : undefined}
      scroll={false}
      replace
    >
      {children}
    </Link>
  );
}

function describe(f: ListFilters) {
  const parts: string[] = [];
  if (f.use) parts.push(uses.find((u) => u.id === f.use)!.name);
  if (f.category) parts.push(categories.find((c) => c.id === f.category)!.name);
  if (f.status)
    parts.push(f.status === "launch" ? "Launch pieces" : "Coming soon");
  if (f.width) parts.push(widthBands[f.width].label);
  if (f.q) parts.push(`“${f.q}”`);
  return parts.join(" · ");
}

function Grid({ list, label }: { list: Product[]; label: string }) {
  return (
    <ul role="list" className={styles.grid}>
      {list.map((p) => (
        <li key={p.id} data-launch={p.status === "launch" || undefined}>
          <ProductCard product={p} resultsLabel={label} />
        </li>
      ))}
    </ul>
  );
}

function RecordStrip({ list }: { list: DesignRecord[] }) {
  if (!list.length) return null;
  return (
    <ul role="list" className={styles.strip}>
      {list.map((r) => (
        <li key={r.id}>
          <Link href={r.href} className={styles.mini}>
            <span className={styles.miniImg}>
              <Image
                src={r.image.src}
                alt=""
                width={r.image.w}
                height={r.image.h}
                sizes="120px"
              />
            </span>
            <span className={styles.miniText}>
              <span className={styles.kind} data-kind={r.kind}>
                {kindLabel[r.kind]}
              </span>
              <strong>{r.name}</strong>
              <span className={styles.rel}>{r.relation}</span>
            </span>
            {r.kind === "arrangement" && (
              <span className={styles.miniPlan}>
                <PlanGlyph
                  arrangement={r.id}
                  scale={1 / 45}
                  label={`${r.name}, schematic plan`}
                />
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function FurniturePage(props: PageProps<"/furniture">) {
  const sp = await props.searchParams;
  const f = parseFilters(sp);
  const view: View =
    sp.view === "room" || sp.view === "all" ? sp.view : "family";
  const kindParam = typeof sp.kind === "string" ? sp.kind : null;
  const kind: DesignKind | null =
    kindParam === "launch" ||
    kindParam === "soon" ||
    kindParam === "use" ||
    kindParam === "arrangement"
      ? kindParam
      : null;
  const list = filterProducts(f);
  const any = Boolean(f.use || f.category || f.status || f.width || f.q);
  const label = any
    ? `Furniture: ${describe(f)}`
    : view === "room"
      ? "Furniture by room"
      : "Furniture";
  const count = (patch: Partial<ListFilters>) =>
    filterProducts({ ...f, ...patch }).length;
  const shown =
    view === "all" ? records.filter((r) => !kind || r.kind === kind) : [];

  return (
    <div className="container">
      <header className={styles.head}>
        <h1>Furniture</h1>
        <p className={styles.lede}>
          Three launch pieces, being made and tested now, and eleven that follow
          them, plus the other uses and arrangements they make: {records.length}{" "}
          designs in all.
        </p>
        <nav aria-label="Ways to browse" className={styles.modes}>
          <Link
            href={hrefWith(f, "family")}
            aria-current={view === "family" ? "page" : undefined}
          >
            By family
          </Link>
          <Link
            href={hrefWith(f, "room")}
            aria-current={view === "room" ? "page" : undefined}
          >
            By room
          </Link>
          <Link
            href={hrefWith(f, "all")}
            aria-current={view === "all" ? "page" : undefined}
          >
            All designs <span className="spec">{records.length}</span>
          </Link>
        </nav>
      </header>

      {view === "all" ? (
        <section aria-labelledby="all-t" className={styles.index}>
          <h2 id="all-t" className="visually-hidden">
            All designs
          </h2>
          <div className={styles.row} role="group" aria-label="Kind of design">
            <Chip href={hrefWith(f, "all")} active={!kind}>
              All <span className="spec">{records.length}</span>
            </Chip>
            {(["launch", "soon", "use", "arrangement"] as DesignKind[]).map(
              (k) => (
                <Chip
                  key={k}
                  href={hrefWith(f, "all", {}, k)}
                  active={kind === k}
                >
                  {kindLabel[k]}{" "}
                  <span className="spec">
                    {records.filter((r) => r.kind === k).length}
                  </span>
                </Chip>
              ),
            )}
          </div>
          <p className={styles.small}>
            Launch pieces and pieces coming soon are products. Other uses follow
            their piece, and arrangements are pieces standing together: neither
            has a price or page of its own. Earlier concept renders show
            finishes from before the materials were decided.
          </p>
          <ol className={styles.table}>
            {shown.map((r) => (
              <li key={r.id} data-kind={r.kind}>
                <Link href={r.href} className={styles.entry}>
                  <span className={styles.no}>{r.record}</span>
                  <span
                    className={styles.entryImg}
                    data-concept={r.image.concept || undefined}
                  >
                    <Image
                      src={r.image.src}
                      alt=""
                      width={r.image.w}
                      height={r.image.h}
                      sizes="96px"
                    />
                  </span>
                  <span className={styles.entryText}>
                    <strong>{r.name}</strong>
                    <span>{r.relation ?? r.line}</span>
                  </span>
                  <span className={styles.kind} data-kind={r.kind}>
                    {kindLabel[r.kind]}
                  </span>
                  <span className={styles.fam}>{families[r.family].name}</span>
                  <span className={styles.entryPlan}>
                    {r.product ? (
                      <PlanGlyph
                        product={r.product}
                        scale={1 / 40}
                        label={`${r.name}, footprint`}
                      />
                    ) : r.kind === "arrangement" ? (
                      <PlanGlyph
                        arrangement={r.id}
                        scale={1 / 40}
                        label={`${r.name}, schematic plan`}
                      />
                    ) : null}
                  </span>
                  <span className={styles.entrySize}>
                    {r.product ? fullSizeLabel(r.product) : r.note}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <div className={styles.layout}>
          <FiltersDrawer
            className={styles.filters}
            summaryClassName={styles.filterToggle}
            summary={`Filters${any ? ` · ${describe(f)}` : ""}`}
          >
            <div className={styles.filterBody}>
              <Form action="/furniture" className={styles.search} role="search">
                <label htmlFor="q" className={styles.rowLabel}>
                  Search
                </label>
                <input
                  id="q"
                  name="q"
                  type="search"
                  defaultValue={f.q}
                  placeholder="Coats, books, desk…"
                  autoComplete="off"
                />
                {view !== "family" && (
                  <input type="hidden" name="view" value={view} />
                )}
                {f.use && <input type="hidden" name="use" value={f.use} />}
                {f.status && (
                  <input type="hidden" name="status" value={f.status} />
                )}
                {f.width && (
                  <input type="hidden" name="width" value={f.width} />
                )}
                <button type="submit" className="btn btn-quiet">
                  Search
                </button>
              </Form>
              {view === "family" && (
                <div className={styles.row} role="group" aria-label="Where">
                  <span className={styles.rowLabel}>Where</span>
                  <Chip href={hrefWith(f, view, { use: null })} active={!f.use}>
                    Anywhere
                  </Chip>
                  {uses.map((u) => (
                    <Chip
                      key={u.id}
                      href={hrefWith(f, view, { use: u.id })}
                      active={f.use === u.id}
                    >
                      {u.name}{" "}
                      <span className="spec">{count({ use: u.id })}</span>
                    </Chip>
                  ))}
                </div>
              )}
              <div className={styles.row} role="group" aria-label="Status">
                <span className={styles.rowLabel}>Status</span>
                <Chip
                  href={hrefWith(f, view, { status: null })}
                  active={!f.status}
                >
                  Both
                </Chip>
                <Chip
                  href={hrefWith(f, view, { status: "launch" })}
                  active={f.status === "launch"}
                >
                  Launch pieces{" "}
                  <span className="spec">{count({ status: "launch" })}</span>
                </Chip>
                <Chip
                  href={hrefWith(f, view, { status: "soon" })}
                  active={f.status === "soon"}
                >
                  Coming soon{" "}
                  <span className="spec">{count({ status: "soon" })}</span>
                </Chip>
              </div>
              <div className={styles.row} role="group" aria-label="Width">
                <span className={styles.rowLabel}>Fits a width of</span>
                <Chip
                  href={hrefWith(f, view, { width: null })}
                  active={!f.width}
                >
                  Any width
                </Chip>
                {(Object.keys(widthBands) as (keyof typeof widthBands)[]).map(
                  (w) => (
                    <Chip
                      key={w}
                      href={hrefWith(f, view, { width: w })}
                      active={f.width === w}
                    >
                      {widthBands[w].label}
                    </Chip>
                  ),
                )}
              </div>
              {any && (
                <Link
                  href={hrefWith(
                    {
                      use: null,
                      category: null,
                      status: null,
                      width: null,
                      q: "",
                    },
                    view,
                  )}
                  className="text-link"
                  scroll={false}
                >
                  Clear filters
                </Link>
              )}
            </div>
          </FiltersDrawer>

          <div className={styles.results} aria-live="polite">
            <p className={styles.summary}>
              <strong>{list.length}</strong> of {products.length} pieces
              {any ? ` · ${describe(f)}` : ""}. {claims.price.label}; launch
              pieces first.
            </p>
            {list.length === 0 && (
              <div className={styles.empty}>
                <p>Nothing matches all of these.</p>
                <Link
                  href={hrefWith(
                    {
                      use: null,
                      category: null,
                      status: null,
                      width: null,
                      q: "",
                    },
                    view,
                  )}
                  className="btn btn-secondary"
                >
                  Show everything
                </Link>
              </div>
            )}

            {view === "family" &&
              (Object.keys(families) as FamilyId[]).map((fam) => {
                const items = list.filter((p) => p.family === fam);
                const extra = records.filter(
                  (r) =>
                    r.family === fam &&
                    (r.kind === "use" || r.kind === "arrangement"),
                );
                if (!items.length && any) return null;
                return (
                  <section
                    key={fam}
                    aria-labelledby={`fam-${fam}`}
                    className={styles.family}
                  >
                    <div className={styles.familyHead}>
                      <Image
                        src={sceneSrc(FAMILY_SCENE[fam])}
                        alt=""
                        width={SCENE.w}
                        height={SCENE.h}
                        sizes="(max-width: 900px) 100vw, 40vw"
                        className={styles.familyImg}
                      />
                      <div className={styles.familyText}>
                        <h2 id={`fam-${fam}`}>{families[fam].name}</h2>
                        <p>{families[fam].line}</p>
                        <p className="spec">
                          {products.filter((p) => p.family === fam).length}{" "}
                          pieces ·{" "}
                          {extra.filter((r) => r.kind === "use").length} other
                          uses ·{" "}
                          {extra.filter((r) => r.kind === "arrangement").length}{" "}
                          arrangements
                        </p>
                      </div>
                    </div>
                    {items.length > 0 && <Grid list={items} label={label} />}
                    {!any && <RecordStrip list={extra} />}
                  </section>
                );
              })}

            {view === "room" &&
              uses.map((u) => {
                const items = list.filter((p) => p.uses.includes(u.id));
                if (!items.length) return null;
                return (
                  <section
                    key={u.id}
                    aria-labelledby={`use-${u.id}`}
                    className={styles.roomGroup}
                  >
                    <div className={styles.roomHead}>
                      <h2 id={`use-${u.id}`}>{u.name}</h2>
                      <p>{u.line}</p>
                      <Link
                        href={`/explore?room=${u.id}`}
                        className="text-link"
                      >
                        Explore {u.name.toLowerCase()}
                      </Link>
                    </div>
                    <Grid list={items} label={label} />
                  </section>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
