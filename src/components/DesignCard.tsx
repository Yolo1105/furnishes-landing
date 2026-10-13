import type { Design } from "@/data/types";
import { sizeLabel } from "@/lib/catalog";
import { ObjectRender, PriceState, StatusBadge } from "./bits";
import { ResultLink } from "./ResultLink";
import styles from "./DesignCard.module.css";

/** Shared scale for listings: every render at the same mm-to-pixel ratio. */
export const LISTING_SCALE = 0.22;

type Props = {
  design: Design;
  /** Short reasons this design fits, from Explore. */
  reasons?: string[];
  /** Where "Back to your results" should return to, if this card is a result. */
  resultsLabel?: string;
  headingLevel?: "h2" | "h3";
};

export function DesignCard({
  design,
  reasons,
  resultsLabel,
  headingLevel = "h3",
}: Props) {
  const H = headingLevel;
  return (
    <article className={styles.card} data-status={design.status}>
      <div className={styles.stage}>
        <ObjectRender
          design={design}
          scale={LISTING_SCALE}
          sizes="240px"
          className={styles.render}
        />
      </div>
      <div className={styles.body}>
        <StatusBadge status={design.status} />
        <H className={styles.name}>
          <ResultLink
            href={`/furniture/${design.id}`}
            designId={design.id}
            {...(resultsLabel ? { resultsLabel } : {})}
            className={styles.link}
          >
            {design.name}
          </ResultLink>
        </H>
        <p className={styles.line}>{design.line}</p>
        {reasons && reasons.length > 0 && (
          <ul role="list" className={styles.reasons} aria-label="Why this fits">
            {reasons.slice(0, 3).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        <p className={styles.meta}>
          <span className="num">{sizeLabel(design.size)}</span>
          <PriceState design={design} compact />
        </p>
      </div>
    </article>
  );
}
