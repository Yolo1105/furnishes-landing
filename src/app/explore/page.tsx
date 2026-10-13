import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DesignCard } from "@/components/DesignCard";
import type { ActivityId, ObjectId, UseId } from "@/data/types";
import { activities, objects, uses } from "@/data/vocabulary";
import { images } from "@/lib/catalog";
import {
  examples,
  explore,
  exploreParams,
  hasAnswers,
  parseExplore,
  type ExploreState,
} from "@/lib/explore";
import styles from "./explore.module.css";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Start from a room, something you do, the things you want a place for, or an everyday situation. See the designs that fit, and why.",
  alternates: { canonical: "/explore" },
};

const SHOWN = 9;

function toggle<T extends string>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function href(s: ExploreState, extra?: Record<string, string>) {
  const q = exploreParams(s);
  for (const [k, v] of Object.entries(extra ?? {})) q.set(k, v);
  const qs = q.toString();
  return qs ? `/explore?${qs}` : "/explore";
}

function describe(s: ExploreState) {
  const parts = [
    ...s.rooms.map((r) => uses.find((u) => u.id === r)!.name),
    ...s.doing.map((a) =>
      activities.find((x) => x.id === a)!.name.toLowerCase(),
    ),
    ...s.things.map((o) => objects.find((x) => x.id === o)!.name.toLowerCase()),
  ];
  if (s.example)
    parts.push(
      `like the ${examples.find((e) => e.design.id === s.example)?.design.name.toLowerCase() ?? "example"}`,
    );
  return parts.join(", ");
}

export default async function ExplorePage(props: PageProps<"/explore">) {
  const sp = await props.searchParams;
  const s = parseExplore(sp);
  const showAll = sp.all === "1";
  const answered = hasAnswers(s);
  const matches = answered ? explore(s) : [];
  const exact = matches.length > 0 && matches[0]!.exact;
  const visible = showAll ? matches : matches.slice(0, SHOWN);
  const resultsLabel = `Explore: ${describe(s)}`;
  const featured = [...examples]
    .sort((a, b) =>
      a.design.status === b.design.status
        ? 0
        : a.design.status === "configurable"
          ? -1
          : 1,
    )
    .slice(0, 8);

  const chip = (active: boolean, to: string, label: string, key: string) => (
    <li key={key}>
      <Link
        href={to}
        className={styles.chip}
        aria-current={active ? "true" : undefined}
        scroll={false}
        replace
      >
        {label}
      </Link>
    </li>
  );

  return (
    <div className="container">
      <header className={styles.head}>
        <p className="eyebrow">Explore</p>
        <h1>Start from the room, the thing, or a picture.</h1>
        <p className="lede">
          Pick anything that sounds like you. Nothing is required, and nothing
          you pick here is added to a design. It only narrows what we show.
        </p>
        <p>
          <Link href="/furniture" className="text-link">
            Skip to all furniture →
          </Link>
        </p>
      </header>

      <section className={styles.block} aria-labelledby="q-room">
        <h2 id="q-room" className={styles.q}>
          <span className={styles.qNum}>1</span> Which room?
        </h2>
        <ul role="list" className={styles.rooms}>
          {uses.map((u) => {
            const active = s.rooms.includes(u.id as UseId);
            return (
              <li key={u.id}>
                <Link
                  href={href({ ...s, rooms: toggle(s.rooms, u.id as UseId) })}
                  className={styles.room}
                  aria-current={active ? "true" : undefined}
                  scroll={false}
                  replace
                >
                  <Image
                    src={images.room(u.cover)}
                    alt=""
                    width={960}
                    height={600}
                    sizes="(max-width: 700px) 50vw, 240px"
                  />
                  <span className={styles.roomName}>{u.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="q-do">
        <h2 id="q-do" className={styles.q}>
          <span className={styles.qNum}>2</span> What do you want to do there?
        </h2>
        <ul role="list" className={styles.chips}>
          {activities.map((a) =>
            chip(
              s.doing.includes(a.id),
              href({ ...s, doing: toggle(s.doing, a.id as ActivityId) }),
              a.name,
              a.id,
            ),
          )}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="q-things">
        <h2 id="q-things" className={styles.q}>
          <span className={styles.qNum}>3</span> What needs a place?
        </h2>
        <ul role="list" className={styles.chips}>
          {objects.map((o) =>
            chip(
              s.things.includes(o.id),
              href({ ...s, things: toggle(s.things, o.id as ObjectId) }),
              o.name,
              o.id,
            ),
          )}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="q-example">
        <h2 id="q-example" className={styles.q}>
          <span className={styles.qNum}>4</span> Or start from a situation
        </h2>
        <ul role="list" className={styles.examples}>
          {featured.map((e) => (
            <li key={e.design.id}>
              <Link
                href={href({
                  ...s,
                  example: s.example === e.design.id ? null : e.design.id,
                })}
                className={styles.example}
                aria-current={s.example === e.design.id ? "true" : undefined}
                scroll={false}
                replace
              >
                <Image
                  src={images.room(e.design.id)}
                  alt=""
                  width={960}
                  height={600}
                  sizes="(max-width: 700px) 50vw, 300px"
                />
                <span>“{e.text}”</span>
              </Link>
            </li>
          ))}
        </ul>
        <details className={styles.more}>
          <summary>
            More situations ({examples.length - featured.length})
          </summary>
          <ul role="list" className={styles.moreList}>
            {examples
              .slice()
              .filter((e) => !featured.includes(e))
              .map((e) => (
                <li key={e.design.id}>
                  <Link
                    href={href({ ...s, example: e.design.id })}
                    aria-current={
                      s.example === e.design.id ? "true" : undefined
                    }
                    scroll={false}
                    replace
                  >
                    “{e.text}”
                  </Link>
                </li>
              ))}
          </ul>
        </details>
      </section>

      {answered && (
        <div className={styles.jump}>
          <a href="#results" className={styles.jumpLink}>
            <strong className="num">{matches.length}</strong>{" "}
            {matches.length === 1 ? "design fits" : "designs fit"} · See them ↓
          </a>
        </div>
      )}

      <section
        id="results"
        className={styles.results}
        aria-labelledby="results-title"
        aria-live="polite"
      >
        <div className={styles.resultsHead}>
          <h2 id="results-title">
            {answered
              ? exact
                ? "Designs that fit"
                : "Closest designs"
              : "Your results appear here"}
          </h2>
          {answered && (
            <div className={styles.selected}>
              <span className="muted">You picked:</span>
              <ul role="list" className={styles.selectedList}>
                {s.rooms.map((r) => (
                  <li key={r}>
                    <Link
                      href={href({
                        ...s,
                        rooms: s.rooms.filter((x) => x !== r),
                      })}
                      className={styles.remove}
                      scroll={false}
                      replace
                    >
                      {uses.find((u) => u.id === r)!.name}{" "}
                      <span aria-hidden="true">×</span>
                      <span className="visually-hidden"> (remove)</span>
                    </Link>
                  </li>
                ))}
                {s.doing.map((a) => (
                  <li key={a}>
                    <Link
                      href={href({
                        ...s,
                        doing: s.doing.filter((x) => x !== a),
                      })}
                      className={styles.remove}
                      scroll={false}
                      replace
                    >
                      {activities.find((x) => x.id === a)!.name}{" "}
                      <span aria-hidden="true">×</span>
                      <span className="visually-hidden"> (remove)</span>
                    </Link>
                  </li>
                ))}
                {s.things.map((o) => (
                  <li key={o}>
                    <Link
                      href={href({
                        ...s,
                        things: s.things.filter((x) => x !== o),
                      })}
                      className={styles.remove}
                      scroll={false}
                      replace
                    >
                      {objects.find((x) => x.id === o)!.name}{" "}
                      <span aria-hidden="true">×</span>
                      <span className="visually-hidden"> (remove)</span>
                    </Link>
                  </li>
                ))}
                {s.example && (
                  <li>
                    <Link
                      href={href({ ...s, example: null })}
                      className={styles.remove}
                      scroll={false}
                      replace
                    >
                      Situation <span aria-hidden="true">×</span>
                      <span className="visually-hidden"> (remove)</span>
                    </Link>
                  </li>
                )}
              </ul>
              <Link
                href="/explore"
                className="text-link"
                scroll={false}
                replace
              >
                Clear all
              </Link>
            </div>
          )}
        </div>

        {!answered && (
          <p className="muted">
            Pick a room, an activity, a thing or a situation above, or{" "}
            <Link href="/furniture">see all furniture</Link>.
          </p>
        )}
        {answered && !exact && matches.length > 0 && (
          <p className="notice">
            Nothing fits every choice, so these fit some of them. Removing a
            choice may help.
          </p>
        )}
        {answered && matches.length === 0 && (
          <p className="notice">
            Nothing fits these choices. Try removing one.
          </p>
        )}
        {visible.length > 0 && (
          <>
            <p className={styles.count}>
              {matches.length} {matches.length === 1 ? "design" : "designs"}
              {!showAll && matches.length > SHOWN
                ? `, showing the best ${SHOWN}`
                : ""}
              . Best matches first; concepts are marked.
            </p>
            <ul role="list" className={styles.grid}>
              {visible.map((m) => (
                <li key={m.design.id}>
                  <DesignCard
                    design={m.design}
                    reasons={m.reasons}
                    resultsLabel={resultsLabel}
                  />
                </li>
              ))}
            </ul>
            {!showAll && matches.length > SHOWN && (
              <Link
                href={href(s, { all: "1" })}
                className="btn btn-secondary"
                scroll={false}
                replace
              >
                Show all {matches.length}
              </Link>
            )}
          </>
        )}
      </section>
    </div>
  );
}
