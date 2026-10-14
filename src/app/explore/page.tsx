import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import type { ActivityId, ObjectId, UseId } from "@/data/types";
import { activities, objects } from "@/data/vocabulary";
import { bySiteOrder, products, uses } from "@/lib/catalog";
import {
  emptyExplore,
  explore,
  exploreParams,
  hasAnswers,
  parseExplore,
  situations,
  widthBands,
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

const STEPS = [
  "Where?",
  "What do you want to do there?",
  "What needs a place?",
  "How wide is the space?",
];

function href(s: ExploreState, step?: number) {
  const q = exploreParams(s);
  if (step) q.set("step", String(step));
  const qs = q.toString();
  return qs ? `/explore?${qs}` : "/explore";
}

function describe(s: ExploreState) {
  return [
    ...s.rooms.map((r) => uses.find((u) => u.id === r)!.name),
    ...s.doing.map((a) =>
      activities.find((x) => x.id === a)!.name.toLowerCase(),
    ),
    ...s.things.map((o) => objects.find((x) => x.id === o)!.name.toLowerCase()),
    ...(s.width ? [widthBands[s.width].label.toLowerCase()] : []),
    ...(s.situation
      ? [`“${situations.find((x) => x.product === s.situation)?.text ?? ""}”`]
      : []),
  ].join(", ");
}

export default async function ExplorePage(props: PageProps<"/explore">) {
  const sp = await props.searchParams;
  const s = parseExplore(sp);
  const stepRaw = Number(typeof sp.step === "string" ? sp.step : 0);
  const step = stepRaw >= 1 && stepRaw <= STEPS.length ? stepRaw : 0;
  const show = (n: number) => !step || step === n;
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
          {step ? (
            <div className={styles.guide}>
              <p className="spec">
                Step {step} of {STEPS.length}
              </p>
              <div className={styles.guideNav}>
                {step > 1 && (
                  <Link
                    href={href(s, step - 1)}
                    className="btn btn-quiet"
                    scroll={false}
                    replace
                  >
                    ← Back
                  </Link>
                )}
                {step < STEPS.length ? (
                  <Link
                    href={href(s, step + 1)}
                    className="btn btn-quiet"
                    scroll={false}
                    replace
                  >
                    Skip / next →
                  </Link>
                ) : null}
                <Link
                  href={href(s)}
                  className="text-link"
                  scroll={false}
                  replace
                >
                  {step < STEPS.length
                    ? "Show every choice"
                    : "Done: see every choice"}
                </Link>
              </div>
            </div>
          ) : (
            <Link
              href={href(s, 1)}
              className={styles.guideStart}
              scroll={false}
              replace
            >
              <strong>Guide me</strong>
              <span>
                Four quick questions, one at a time. Skip any of them.
              </span>
            </Link>
          )}

          {show(1) && (
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
                        href={href(
                          { ...s, rooms: toggle(s.rooms, u.id as UseId) },
                          step || undefined,
                        )}
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
          )}

          {show(2) && (
            <section aria-labelledby="q-do" className={styles.block}>
              <h2 id="q-do" className={styles.q}>
                What do you want to do there?
              </h2>
              <ul role="list" className={styles.chips}>
                {activities.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={href(
                        { ...s, doing: toggle(s.doing, a.id as ActivityId) },
                        step || undefined,
                      )}
                      className={styles.chip}
                      aria-current={s.doing.includes(a.id) ? "true" : undefined}
                      scroll={false}
                      replace
                    >
                      {a.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {show(3) && (
            <section aria-labelledby="q-things" className={styles.block}>
              <h2 id="q-things" className={styles.q}>
                What needs a place?
              </h2>
              <ul role="list" className={styles.chips}>
                {objects.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={href(
                        { ...s, things: toggle(s.things, o.id as ObjectId) },
                        step || undefined,
                      )}
                      className={styles.chip}
                      aria-current={
                        s.things.includes(o.id) ? "true" : undefined
                      }
                      scroll={false}
                      replace
                    >
                      {o.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {show(4) && (
            <section aria-labelledby="q-width" className={styles.block}>
              <h2 id="q-width" className={styles.q}>
                How wide is the space?
              </h2>
              <ul role="list" className={styles.chips}>
                {(Object.keys(widthBands) as (keyof typeof widthBands)[]).map(
                  (w) => (
                    <li key={w}>
                      <Link
                        href={href(
                          { ...s, width: s.width === w ? null : w },
                          step || undefined,
                        )}
                        className={styles.chip}
                        aria-current={s.width === w ? "true" : undefined}
                        scroll={false}
                        replace
                      >
                        {widthBands[w].label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </section>
          )}

          {!step && (
            <section aria-labelledby="q-sit" className={styles.block}>
              <h2 id="q-sit" className={styles.q}>
                Or start from a situation
              </h2>
              <ul role="list" className={styles.situations}>
                {situations.map((x) => (
                  <li key={x.text}>
                    <Link
                      href={href({
                        ...emptyExplore,
                        situation: s.situation === x.product ? null : x.product,
                      })}
                      className={styles.situation}
                      aria-current={
                        s.situation === x.product ? "true" : undefined
                      }
                      scroll={false}
                      replace
                    >
                      “{x.text}”
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
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
