import Image from "next/image";
import { claims, statusInfo } from "@/data/claims";
import { formatPrice, prices } from "@/data/market";
import type { Design, DesignStatus } from "@/data/types";
import { images } from "@/lib/catalog";
import styles from "./bits.module.css";

export function StatusBadge({ status, long = false }: { status: DesignStatus; long?: boolean }) {
  const info = statusInfo[status];
  return (
    <span className={styles.status} data-status={status}>
      <span className={styles.mark} aria-hidden="true" />
      {long ? info.label : info.short}
    </span>
  );
}

/** The price line: a confirmed SGD price, or an honest state. */
export function PriceState({ design, compact = false }: { design: Design; compact?: boolean }) {
  const price = prices[design.id];
  if (design.status === "concept")
    return <span className={styles.price}>{compact ? "Not quoted yet" : "Concept: not quoted yet"}</span>;
  if (price !== undefined) return <span className={styles.price}>{formatPrice(price)}</span>;
  return <span className={styles.price}>{claims.price.label}</span>;
}

/**
 * The isolated render of a design. All renders share one camera and scale
 * (about 0.47 px per mm), so `scale` keeps relative sizes true on a listing.
 */
export function ObjectRender({
  design,
  scale,
  sizes,
  preload = false,
  className,
}: {
  design: Design;
  scale?: number;
  sizes: string;
  preload?: boolean;
  className?: string | undefined;
}) {
  const { w, h } = design.image.object;
  const style = scale ? { width: `${Math.round(w * scale)}px` } : undefined;
  return (
    <Image
      src={images.object(design.id)}
      alt={`${design.name}, rendered on its own`}
      width={w}
      height={h}
      sizes={sizes}
      preload={preload}
      className={className}
      style={style}
    />
  );
}

export function RenderNote() {
  return <p className={styles.renderNote}>{claims.renders.detail}</p>;
}
