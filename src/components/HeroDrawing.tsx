import { heroParts, kitParts, type HeroPart } from "@/data/hero";
import type { HeroId, KitId } from "@/data/types";
import styles from "./HeroDrawing.module.css";

/**
 * Front and side elevations of a launch piece, drawn from the modelling
 * spec: every part at its size and position, with overall dimensions. The
 * side view shows the widened base reaching forward of the body (D13).
 */
export function HeroDrawing({
  design,
  kits = [],
  title,
  uid,
}: {
  design: HeroId;
  kits?: KitId[];
  title: string;
  uid: string;
}) {
  let ps = heroParts(design).filter(
    (p) => p.id !== "RAIL" || kits.includes("K-D2"),
  );
  if (kits.includes("K-D1")) ps = [...ps, ...kitParts("K-D1")];
  const W = Math.max(...ps.map((p) => p.pos[0] + p.size[0]));
  const H = Math.max(...ps.map((p) => p.pos[2] + p.size[2]));
  const y0 = Math.min(...ps.map((p) => p.pos[1]));
  const y1 = Math.max(...ps.map((p) => p.pos[1] + p.size[1]));
  const D = y1 - y0;
  const gap = 260;
  const pad = 150;
  const vbW = W + gap + D + pad * 2;
  const vbH = H + pad * 2;
  const cls = (p: HeroPart) =>
    p.kind === "metal"
      ? styles.metal
      : p.kind === "accessory"
        ? styles.acc
        : styles.board;
  // draw back to front: boards, then metal, then accessories
  const order = (p: HeroPart) =>
    p.kind === "board" ? 0 : p.kind === "metal" ? 1 : 2;
  const sorted = [...ps].sort((a, b) => order(a) - order(b));
  const front = (p: HeroPart) => (
    <rect
      key={`f-${p.id}`}
      x={pad + p.pos[0]}
      y={pad + H - p.pos[2] - p.size[2]}
      width={p.size[0]}
      height={p.size[2]}
      className={cls(p)}
    />
  );
  const side = (p: HeroPart) => (
    <rect
      key={`s-${p.id}`}
      x={pad + W + gap + (p.pos[1] - y0)}
      y={pad + H - p.pos[2] - p.size[2]}
      width={p.size[1]}
      height={p.size[2]}
      className={cls(p)}
    />
  );
  const cm = (mm: number) => `${Math.round(mm / 10)} cm`;
  const sx = pad + W + gap;
  const bodyD = 400;
  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      className={styles.drawing}
      role="img"
      aria-labelledby={`${uid}-t`}
    >
      <title id={`${uid}-t`}>
        {`${title}: front and side views, ${cm(W)} wide, ${cm(H)} high, ${cm(D)} deep overall`}
      </title>
      <g>{sorted.map(front)}</g>
      <g>{sorted.map(side)}</g>
      <line
        x1={pad - 40}
        x2={vbW - pad + 40}
        y1={pad + H}
        y2={pad + H}
        className={styles.floor}
      />
      {/* width */}
      <g className={styles.dim}>
        <line x1={pad} x2={pad + W} y1={pad + H + 70} y2={pad + H + 70} />
        <line x1={pad} x2={pad} y1={pad + H + 50} y2={pad + H + 90} />
        <line x1={pad + W} x2={pad + W} y1={pad + H + 50} y2={pad + H + 90} />
        <text x={pad + W / 2} y={pad + H + 130}>
          {cm(W)}
        </text>
      </g>
      {/* height */}
      <g className={styles.dim}>
        <line x1={pad - 70} x2={pad - 70} y1={pad} y2={pad + H} />
        <line x1={pad - 90} x2={pad - 50} y1={pad} y2={pad} />
        <line x1={pad - 90} x2={pad - 50} y1={pad + H} y2={pad + H} />
        <text
          x={pad - 95}
          y={pad + H / 2}
          transform={`rotate(-90 ${pad - 95} ${pad + H / 2})`}
        >
          {cm(H)}
        </text>
      </g>
      {/* depth: body, and the base when it reaches further */}
      <g className={styles.dim}>
        <line x1={sx} x2={sx + D} y1={pad + H + 70} y2={pad + H + 70} />
        <line x1={sx} x2={sx} y1={pad + H + 50} y2={pad + H + 90} />
        <line x1={sx + D} x2={sx + D} y1={pad + H + 50} y2={pad + H + 90} />
        <text x={sx + D / 2} y={pad + H + 130}>
          {cm(D)}
        </text>
        {D > bodyD + 10 && (
          <>
            <line x1={sx + D - bodyD} x2={sx + D} y1={pad - 50} y2={pad - 50} />
            <line
              x1={sx + D - bodyD}
              x2={sx + D - bodyD}
              y1={pad - 70}
              y2={pad - 30}
            />
            <line x1={sx + D} x2={sx + D} y1={pad - 70} y2={pad - 30} />
            <text
              x={sx + D - bodyD / 2}
              y={pad - 80}
            >{`body ${cm(bodyD)}`}</text>
          </>
        )}
      </g>
      <text x={pad} y={pad - 80} className={styles.view}>
        Front
      </text>
      <text x={sx} y={pad - 120} className={styles.view}>
        Side
      </text>
    </svg>
  );
}
