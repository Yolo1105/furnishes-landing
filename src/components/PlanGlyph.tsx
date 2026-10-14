import type { Product } from "@/data/types";
import styles from "./PlanGlyph.module.css";

/**
 * A top view at one shared scale (1 px per 25 mm). Products are their
 * footprint, with a base that reaches forward drawn dashed. Arrangements
 * are schematic: 600 x 400 segments placed as the record describes them,
 * with desk tops dashed.
 */
type R = [number, number, number, number, ("seg" | "top" | "base")?];

const S = 600;
const D = 400;
const ARR: Record<string, R[]> = {
  island: [[0, 0, S, D], [S, 0, S, D], [0, 0, 2 * S, D, "top"]],
  strip: [[0, 0, 1800, D], [1800, 0, S, D], [2400, 0, S, D]],
  "shape-l": [[0, 0, S, D], [S, 0, D, S]],
  "shape-u": [[0, 0, D, S], [D, 0, S, D], [D + S, 0, D, S]],
  "shape-t-plain": [[0, 0, S * 2, D], [S - D / 2, D, D, S]],
  steps: [[0, 0, S, D], [S, 0, S, D], [2 * S, 0, S, D]],
  "workstation-wall": [[0, 0, 2 * S, D], [0, D, 2 * S, S, "top"]],
  "shape-z": [[0, 0, S, D], [S, 0, D, 2 * D], [S + D, D, S, D]],
  offset: [[0, 0, S, D], [S, 200, S, D]],
  "wheeled-partition": [[0, 0, S, D], [S, 0, S, D]],
  double: [[0, 0, S, D], [S, 0, S, D]],
  "two-desks": [[0, 0, 2 * S, D], [S - D / 2, D, D, S], [0, D, S - D / 2, S, "top"], [S + D / 2, D, S - D / 2, S, "top"]],
  "shape-t": [[0, 0, S, D], [S, 0, 2 * S, D], [3 * S, 0, S, D]],
  "phone-booth": [[0, 0, D, S * 2], [D, 0, S * 2, D], [D + S * 2, 0, D, S * 2], [D, D, S * 2, S, "top"]],
};

export function PlanGlyph({
  product,
  arrangement,
  scale = 1 / 25,
  label,
}: {
  product?: Product;
  arrangement?: string;
  scale?: number;
  label: string;
}) {
  let rects: R[] = [];
  if (product) {
    const { w, d, baseD } = product.size;
    rects = [[0, 0, w, d]];
    if (baseD) rects.push([0, d - baseD, w, baseD, "base"]);
  } else if (arrangement) rects = ARR[arrangement] ?? [];
  if (!rects.length) return null;
  const minY = Math.min(...rects.map((r) => r[1]));
  const W = Math.max(...rects.map((r) => r[0] + r[2]));
  const H = Math.max(...rects.map((r) => r[1] + r[3])) - minY;
  const pad = 2;
  return (
    <svg
      className={styles.plan}
      width={W * scale + pad * 2}
      height={H * scale + pad * 2}
      viewBox={`${-pad / scale} ${minY - pad / scale} ${W + (2 * pad) / scale} ${H + (2 * pad) / scale}`}
      role="img"
      aria-label={label}
    >
      {rects.map(([x, y, w, h, k], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} data-k={k ?? "seg"} />
      ))}
    </svg>
  );
}
