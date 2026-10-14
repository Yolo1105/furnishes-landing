import type { Product } from "@/data/types";
import { fullSizeLabel } from "@/lib/catalog";
import { reasonSentence } from "@/lib/explore";
import { Footprint, PriceState, ProductImage, StatusBadge } from "./bits";
import { ResultLink } from "./ResultLink";
import styles from "./ProductCard.module.css";

type Props = {
  product: Product;
  /** Short reasons this product fits, from Explore. */
  reasons?: string[];
  /** Where "Back to your results" should return to, if this card is a result. */
  resultsLabel?: string;
  headingLevel?: "h2" | "h3";
  /** A wider card, for a launch piece leading a listing. */
  wide?: boolean;
  sizes?: string;
};

/**
 * One product in a listing. Every card has the same stage, the same status
 * line and the true size, so launch pieces and second-batch pieces compare
 * side by side; the status says which is which.
 */
export function ProductCard({
  product,
  reasons,
  resultsLabel,
  headingLevel = "h3",
  wide = false,
  sizes = "(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 300px",
}: Props) {
  const H = headingLevel;
  const why = reasons?.length ? reasonSentence(reasons) : null;
  return (
    <article
      className={styles.card}
      data-status={product.status}
      data-wide={wide || undefined}
    >
      <div className={styles.stage}>
        <ProductImage product={product} sizes={sizes} className={styles.img} />
      </div>
      <div className={styles.body}>
        <div className={styles.top}>
          <StatusBadge status={product.status} />
          <Footprint size={product.size} />
        </div>
        <H className={styles.name}>
          <ResultLink
            href={`/furniture/${product.id}`}
            designId={product.id}
            {...(resultsLabel ? { resultsLabel } : {})}
            className={styles.link}
          >
            {product.name}
          </ResultLink>
        </H>
        <p className={styles.line}>{why ?? product.line}</p>
        <p className={styles.meta}>
          <span className="spec">{fullSizeLabel(product)}</span>
          <PriceState product={product} />
        </p>
      </div>
    </article>
  );
}
