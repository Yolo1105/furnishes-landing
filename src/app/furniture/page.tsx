import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { FiltersDrawer } from "@/components/FiltersDrawer";
import { ProductCard } from "@/components/ProductCard";
import { categories, products, uses } from "@/lib/catalog";
import {
  filterParams,
  filterProducts,
  parseFilters,
  widthBands,
  type ListFilters,
} from "@/lib/explore";
import styles from "./furniture.module.css";

export const metadata: Metadata = {
  title: "Furniture",
  description:
    "The three launch pieces and eleven pieces coming soon: by the door, beside the desk, next to the bed, and more. Birch plywood with white matte faces.",
  alternates: { canonical: "/furniture" },
};

function hrefWith(f: ListFilters, patch: Partial<ListFilters>) {
  const q = filterParams({ ...f, ...patch }).toString();
  return q ? `/furniture?${q}` : "/furniture";
}

function Chip({
  f,
  patch,
  active,
  children,
}: {
  f: ListFilters;
  patch: Partial<ListFilters>;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={hrefWith(f, patch)}
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

export default async function FurniturePage(props: PageProps<"/furniture">) {
  const f = parseFilters(await props.searchParams);
  const list = filterProducts(f);
  const any = Boolean(f.use || f.category || f.status || f.width || f.q);
  const label = any ? `Furniture: ${describe(f)}` : "All furniture";
  const launch = list.filter((p) => p.status === "launch");
  const soon = list.filter((p) => p.status === "soon");
  const count = (patch: Partial<ListFilters>) =>
    filterProducts({ ...f, ...patch }).length;

  return (
    <div className="container">
      <header className={styles.head}>
        <h1>Furniture</h1>
        <p className={styles.lede}>
          Three launch pieces, being made and tested now, and eleven that follow
          them. One family of birch plywood: white matte faces, birch edges.
        </p>
      </header>

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
              {f.use && <input type="hidden" name="use" value={f.use} />}
              {f.category && (
                <input type="hidden" name="type" value={f.category} />
              )}
              {f.status && (
                <input type="hidden" name="status" value={f.status} />
              )}
              {f.width && <input type="hidden" name="width" value={f.width} />}
              <button type="submit" className="btn btn-quiet">
                Search
              </button>
            </Form>
            <div className={styles.row} role="group" aria-label="Where">
              <span className={styles.rowLabel}>Where</span>
              <Chip f={f} patch={{ use: null }} active={!f.use}>
                Anywhere
              </Chip>
              {uses.map((u) => (
                <Chip
                  key={u.id}
                  f={f}
                  patch={{ use: u.id }}
                  active={f.use === u.id}
                >
                  {u.name} <span className="spec">{count({ use: u.id })}</span>
                </Chip>
              ))}
            </div>
            <div
              className={styles.row}
              role="group"
              aria-label="Kind of furniture"
            >
              <span className={styles.rowLabel}>Kind</span>
              <Chip f={f} patch={{ category: null }} active={!f.category}>
                Any kind
              </Chip>
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  f={f}
                  patch={{ category: c.id }}
                  active={f.category === c.id}
                >
                  {c.name}{" "}
                  <span className="spec">{count({ category: c.id })}</span>
                </Chip>
              ))}
            </div>
            <div className={styles.row} role="group" aria-label="Status">
              <span className={styles.rowLabel}>Status</span>
              <Chip f={f} patch={{ status: null }} active={!f.status}>
                Both
              </Chip>
              <Chip
                f={f}
                patch={{ status: "launch" }}
                active={f.status === "launch"}
              >
                Launch pieces{" "}
                <span className="spec">{count({ status: "launch" })}</span>
              </Chip>
              <Chip
                f={f}
                patch={{ status: "soon" }}
                active={f.status === "soon"}
              >
                Coming soon{" "}
                <span className="spec">{count({ status: "soon" })}</span>
              </Chip>
            </div>
            <div className={styles.row} role="group" aria-label="Width">
              <span className={styles.rowLabel}>Width</span>
              <Chip f={f} patch={{ width: null }} active={!f.width}>
                Any width
              </Chip>
              {(Object.keys(widthBands) as (keyof typeof widthBands)[]).map(
                (w) => (
                  <Chip
                    key={w}
                    f={f}
                    patch={{ width: w }}
                    active={f.width === w}
                  >
                    {widthBands[w].label}
                  </Chip>
                ),
              )}
            </div>
          </div>
        </FiltersDrawer>

        <div className={styles.results}>
          <p className={styles.summary} aria-live="polite">
            <strong>{list.length}</strong> of {products.length}{" "}
            {any ? <>· {describe(f)} · </> : null}
            {any && (
              <Link href="/furniture" className="text-link" scroll={false}>
                Clear filters
              </Link>
            )}
          </p>

          {list.length === 0 && (
            <div className={styles.empty}>
              <p>Nothing matches all of these.</p>
              <Link href="/furniture" className="btn btn-secondary">
                Show everything
              </Link>
            </div>
          )}

          {launch.length > 0 && (
            <section aria-labelledby="launch-t" className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 id="launch-t">Launch pieces</h2>
                <p>
                  Choose a version and keep it. Prices come after samples and
                  quotes.
                </p>
              </div>
              <ul role="list" className={styles.lead}>
                {launch.map((p) => (
                  <li key={p.id}>
                    <ProductCard
                      product={p}
                      resultsLabel={label}
                      headingLevel="h3"
                      sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 33vw"
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {soon.length > 0 && (
            <section aria-labelledby="soon-t" className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 id="soon-t">Coming soon</h2>
                <p>
                  They follow the launch pieces, one by one. Explore and save
                  them, and register interest. No prices or dates yet.
                </p>
              </div>
              <ul role="list" className={styles.grid}>
                {soon.map((p) => (
                  <li key={p.id}>
                    <ProductCard product={p} resultsLabel={label} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
