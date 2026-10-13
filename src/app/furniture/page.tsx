import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { DesignCard } from "@/components/DesignCard";
import { designs } from "@/data/designs";
import type { Design, UseId } from "@/data/types";
import { families, uses } from "@/data/vocabulary";
import { bySiteOrder } from "@/lib/catalog";
import {
  filterDesigns,
  filterParams,
  parseFilters,
  widthBands,
  type ListFilters,
} from "@/lib/explore";
import styles from "./furniture.module.css";

export const metadata: Metadata = {
  title: "Furniture",
  description:
    "Every Furnishes design, by room and use: entryway, bedroom, work, kitchen, living room and shared rooms. Configurable pieces and concepts, clearly marked.",
  alternates: { canonical: "/furniture" },
};

const configurableCount = designs.filter((d) => d.status === "configurable").length;

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
  if (f.family) parts.push(families[f.family].plural);
  if (f.status) parts.push(f.status === "configurable" ? "Ready to configure" : "Concepts");
  if (f.width) parts.push(widthBands[f.width].label);
  if (f.q) parts.push(`“${f.q}”`);
  return parts.join(" · ");
}

export default async function FurniturePage(props: PageProps<"/furniture">) {
  const f = parseFilters(await props.searchParams);
  const filtered = filterDesigns(f);
  const anyFilter = Boolean(f.use || f.family || f.status || f.width || f.q);
  const label = anyFilter ? `Furniture: ${describe(f)}` : "All furniture";

  // Unfiltered: group by each design's main room, so every design shows once.
  const groups: { use: (typeof uses)[number]; items: Design[] }[] = anyFilter
    ? []
    : uses
        .map((u) => ({
          use: u,
          items: designs.filter((d) => d.uses[0] === u.id).sort(bySiteOrder),
        }))
        .filter((g) => g.items.length > 0);

  return (
    <div className="container">
      <header className={styles.head}>
        <p className="eyebrow">Furniture</p>
        <h1>Every design, by room and use.</h1>
        <p className="lede">
          {designs.length} designs from one family of birch panels.{" "}
          {configurableCount} are ready to configure and quote. The rest are concepts we are
          still developing, marked as such.
        </p>
      </header>

      <section className={styles.filters} aria-label="Filter furniture">
        <Form action="/furniture" className={styles.search} scroll={false} replace>
          <label htmlFor="q" className="visually-hidden">
            Search furniture
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={f.q}
            placeholder="Search: shoes, books, printer, between two beds…"
          />
          {f.use && <input type="hidden" name="use" value={f.use} />}
          {f.family && <input type="hidden" name="type" value={f.family} />}
          {f.status && <input type="hidden" name="status" value={f.status} />}
          {f.width && <input type="hidden" name="width" value={f.width} />}
          <button type="submit" className="btn btn-quiet">
            Search
          </button>
        </Form>

        <div className={styles.row} role="group" aria-label="Room or use">
          <span className={styles.rowLabel}>Room</span>
          <Chip f={f} patch={{ use: null }} active={!f.use}>
            Any
          </Chip>
          {uses.map((u) => (
            <Chip key={u.id} f={f} patch={{ use: u.id as UseId }} active={f.use === u.id}>
              {u.name}
            </Chip>
          ))}
        </div>
        <div className={styles.row} role="group" aria-label="Type">
          <span className={styles.rowLabel}>Type</span>
          <Chip f={f} patch={{ family: null }} active={!f.family}>
            Any
          </Chip>
          {(Object.keys(families) as (keyof typeof families)[]).map((id) => (
            <Chip key={id} f={f} patch={{ family: id }} active={f.family === id}>
              {families[id].plural}
            </Chip>
          ))}
        </div>
        <div className={styles.row} role="group" aria-label="Status and width">
          <span className={styles.rowLabel}>Status</span>
          <Chip f={f} patch={{ status: null }} active={!f.status}>
            Any
          </Chip>
          <Chip f={f} patch={{ status: "configurable" }} active={f.status === "configurable"}>
            Ready to configure
          </Chip>
          <Chip f={f} patch={{ status: "concept" }} active={f.status === "concept"}>
            Concepts
          </Chip>
          <span className={styles.rowLabel}>Width</span>
          {(Object.keys(widthBands) as (keyof typeof widthBands)[]).map((id) => (
            <Chip
              key={id}
              f={f}
              patch={{ width: f.width === id ? null : id }}
              active={f.width === id}
            >
              {widthBands[id].label}
            </Chip>
          ))}
        </div>
      </section>

      <div className={styles.summary} aria-live="polite">
        <p>
          <strong className="num">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "design" : "designs"}
          {anyFilter && <span className="muted"> · {describe(f)}</span>}
        </p>
        {anyFilter && (
          <Link href="/furniture" className="text-link" scroll={false}>
            Clear all filters
          </Link>
        )}
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>
          <p>Nothing matches all of these. Try removing a filter, or start from a room.</p>
          <Link href="/furniture" className="btn btn-secondary">
            Clear filters
          </Link>
        </div>
      )}

      {anyFilter ? (
        <ul role="list" className={styles.grid}>
          {filtered.map((d) => (
            <li key={d.id}>
              <DesignCard design={d} resultsLabel={label} />
            </li>
          ))}
        </ul>
      ) : (
        groups.map((g) => (
          <section key={g.use.id} className={styles.group} aria-labelledby={`g-${g.use.id}`}>
            <div className={styles.groupHead}>
              <h2 id={`g-${g.use.id}`}>{g.use.name}</h2>
              <p className="muted">{g.use.line}</p>
              <Link href={hrefWith(f, { use: g.use.id })} className="text-link" scroll={false}>
                Everything for the {g.use.name.toLowerCase()}
              </Link>
            </div>
            <ul role="list" className={styles.grid}>
              {g.items.map((d) => (
                <li key={d.id}>
                  <DesignCard design={d} resultsLabel={label} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
