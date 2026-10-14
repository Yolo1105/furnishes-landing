import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import type { ObjectId, UseId } from "@/data/types";
import { objects } from "@/data/vocabulary";
import { bySiteOrder, products, uses } from "@/lib/catalog";
import {
  explore,
  exploreParams,
  hasAnswers,
  parseExplore,
  type ExploreState,
} from "@/lib/explore";
import { SCENE, sceneSrc } from "@/lib/renders";
import styles from "./explore.module.css";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Start with a place in your home or the things you love, and see the pieces that fit, with the reason each one fits.",
  alternates: { canonical: "/explore" },
};

/** The piece each place is pictured with. */
const COVER: Record<UseId, string> = {
  entryway: "entry",
  work: "desk",
  bedroom: "bedside",
  living: "low-cabinet",
  kitchen: "kitchen",
  dividing: "bookwall",
};

function toggle<T extends string>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function href(s: ExploreState) {
  const qs = exploreParams(s).toString();
  return qs ? `/explore?${qs}` : "/explore";
}

function describe(s: ExploreState) {
  return [
    ...s.rooms.map((r) => uses.find((u) => u.id === r)!.name),
    ...s.things.map((o) => objects.find((x) => x.id === o)!.name.toLowerCase()),
  ].join(", ");
}

export default async function ExplorePage(props: PageProps<"/explore">) {
  const s = parseExplore(await props.searchParams);
  const answered = hasAnswers(s);
  const matches = answered
    ? explore(s)
    : [...products]
        .sort(bySiteOrder)
        .map((p) => ({ product: p, reasons: [], exact: true }));
  const exact = matches.length > 0 && matches[0]!.exact;
  const label = answered ? `Explore: ${describe(s)}` : "Explore";

  return (
    <div className="container">
      <header className={styles.head}>
        <h1>Start with what you love</h1>
        <p className={styles.lede}>
          A place in your home, or the things you want a place for. Pick any;
          nothing is required, and nothing you pick is added to a piece. The
          results show why each one fits.
        </p>
        <Link href="/furniture" className="text-link">
          Skip to all furniture
        </Link>
      </header>

      <div className={styles.layout}>
        <div className={styles.choices}>
          <section aria-labelledby="q-where" className={styles.block}>
            <h2 id="q-where" className={styles.q}>
              Where?
            </h2>
            <ul role="list" className={styles.places}>
              {uses.map((u) => {
                const on = s.rooms.includes(u.id);
                return (
                  <li key={u.id}>
                    <Link
                      href={href({
                        ...s,
                        rooms: toggle(s.rooms, u.id as UseId),
                      })}
                      className={styles.place}
                      aria-current={on ? "true" : undefined}
                      scroll={false}
                      replace
                    >
                      <Image
                        src={sceneSrc(COVER[u.id])}
                        alt=""
                        width={SCENE.w}
                        height={SCENE.h}
                        sizes="(max-width: 700px) 45vw, 180px"
                      />
                      <span className={styles.placeName}>
                        {on ? "✓ " : ""}
                        {u.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="q-things" className={styles.block}>
            <h2 id="q-things" className={styles.q}>
              What needs a place?
            </h2>
            <ul role="list" className={styles.chips}>
              {objects.map((o) => (
                <li key={o.id}>
                  <Link
                    href={href({
                      ...s,
                      things: toggle(s.things, o.id as ObjectId),
                    })}
                    className={styles.chip}
                    aria-current={s.things.includes(o.id) ? "true" : undefined}
                    scroll={false}
                    replace
                  >
                    {o.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          {answered && (
            <Link href="/explore" className="text-link" scroll={false} replace>
              Clear choices
            </Link>
          )}
        </div>

        <section
          id="results"
          className={styles.results}
          aria-labelledby="results-t"
          aria-live="polite"
        >
          <div className={styles.resultsHead}>
            <h2 id="results-t">
              {!answered
                ? "Everything, to start"
                : exact
                  ? "These fit"
                  : "Closest fits"}
            </h2>
            <p className="spec">
              {matches.length} of {products.length}
              {answered ? ` · ${describe(s)}` : ""} · launch pieces first
            </p>
          </div>
          {answered && !exact && matches.length > 0 && (
            <p className="notice">
              Nothing fits every choice, so these fit some of them. Removing one
              may help.
            </p>
          )}
          {answered && matches.length === 0 && (
            <p className="notice">
              Nothing fits these choices. Try removing one.
            </p>
          )}
          <ul role="list" className={styles.grid}>
            {matches.map((m) => (
              <li key={m.product.id}>
                <ProductCard
                  product={m.product}
                  reasons={m.reasons}
                  resultsLabel={label}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
