import Image from "next/image";
import { claims, statusInfo } from "@/data/claims";
import conceptSizes from "@/data/concept-images.json";
import type { Product, ProductStatus } from "@/data/types";
import { conceptImage } from "@/lib/catalog";
import { STUDIO, studioSrc } from "@/lib/renders";
import styles from "./bits.module.css";

export function StatusBadge({
  status,
  long = false,
}: {
  status: ProductStatus;
  long?: boolean;
}) {
  const info = statusInfo[status];
  return (
    <span className={styles.status} data-status={status}>
      <span className={styles.mark} aria-hidden="true" />
      {long ? info.label : info.short}
    </span>
  );
}

/** The price line: never a number or an estimate until there is one (D16). */
export function PriceState({ product }: { product: Product }) {
  return (
    <span className={styles.price}>
      {product.status === "launch" ? claims.price.label : "Register interest"}
    </span>
  );
}

/** A product's studio picture: one camera, one light, the stage colour. */
export function ProductImage({
  product,
  sizes,
  preload = false,
  className,
}: {
  product: Product;
  sizes: string;
  preload?: boolean;
  className?: string | undefined;
}) {
  return (
    <Image
      src={studioSrc(product)}
      alt={`${product.name}, design render`}
      width={STUDIO.w}
      height={STUDIO.h}
      sizes={sizes}
      preload={preload}
      className={className}
    />
  );
}

const sizes = conceptSizes as unknown as Record<
  "object" | "room",
  Record<string, [number, number]>
>;

/** An earlier concept render, for packs and arrangements (old finishes). */
export function ConceptImage({
  id,
  kind,
  alt,
  sizes: s,
  className,
}: {
  id: string;
  kind: "object" | "room";
  alt: string;
  sizes: string;
  className?: string | undefined;
}) {
  const wh = sizes[kind][id];
  if (!wh) return null;
  return (
    <Image
      src={conceptImage[kind](id)}
      alt={alt}
      width={wh[0]}
      height={wh[1]}
      sizes={s}
      className={className}
      data-kind="concept"
    />
  );
}

/**
 * Plan footprint, W x D, at one shared scale (1 px per 30 mm) with a 1 m
 * tick, so footprints compare truthfully across a listing. A base that
 * reaches further forward is drawn dashed.
 */
export function Footprint({
  size,
  scale = 1 / 30,
}: {
  size: { w: number; d: number; baseD?: number };
  scale?: number;
}) {
  const w = Math.max(4, size.w * scale);
  const d = Math.max(3, size.d * scale);
  const bd = size.baseD ? size.baseD * scale : d;
  const m = 1000 * scale;
  const W = Math.max(w, m) + 2;
  const H = bd + 9;
  return (
    <svg
      className={styles.footprint}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Footprint ${Math.round(size.w / 10)} by ${Math.round((size.baseD ?? size.d) / 10)} cm`}
    >
      {size.baseD && (
        <rect x="1" y="1" width={w} height={bd} className={styles.base} />
      )}
      <rect x="1" y="1" width={w} height={d} />
      <path d={`M1 ${H - 2} h${m} M1 ${H - 4.5} v5 M${1 + m} ${H - 4.5} v5`} />
    </svg>
  );
}

export function RenderNote({ earlier = false }: { earlier?: boolean }) {
  const c = earlier ? claims.conceptRenders : claims.renders;
  return <p className={styles.renderNote}>{c.detail}</p>;
}
