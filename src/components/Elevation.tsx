import type { Configuration, Recipe } from "@/data/types";
import { parts, type Part } from "@/lib/parts";
import styles from "./Elevation.module.css";

type View = "front" | "side";

type Props = {
  recipe: Recipe;
  config: Pick<Configuration, "finish" | "front" | "accessories">;
  view?: View;
  /** Unique within the page; used for the hole pattern id. */
  uid: string;
  /** Part ids to mark as just added (customize preview). */
  fresh?: string[];
  showDimensions?: boolean;
  title?: string;
  className?: string | undefined;
};


function fill(p: Part, finish: Configuration["finish"], hole: string) {
  if (p.kind === "caster" || p.kind === "hardware") return "var(--hardware)";
  if (p.kind === "base") return "var(--birch-edge)";
  if (p.kind === "accessory") return p.partId === "key-tray" ? "var(--birch-shade)" : "var(--hardware)";
  if (p.face) return finish === "orange" ? "var(--orange-face)" : `url(#${hole})`;
  return "var(--birch)";
}

/**
 * A measured drawing of one configured recipe, from the part model.
 * Front view looks at the front (x across, z up); side view looks from
 * the right (depth across, z up). Every rectangle is a counted part.
 */
export function Elevation({
  recipe,
  config,
  view = "front",
  uid,
  fresh = [],
  showDimensions = true,
  title,
  className,
}: Props) {
  const all = parts(recipe, config);
  const front = view === "front";
  const across = (p: Part) => (front ? p.x : p.y);
  const span = (p: Part) => (front ? p.w : p.d);
  const near = (p: Part) => (front ? -p.y : p.x);
  const minX = Math.min(...all.map(across));
  const maxX = Math.max(...all.map((p) => across(p) + span(p)));
  const maxZ = Math.max(...all.map((p) => p.z + p.h));
  const width = maxX - minX;
  // keep labels and dimension lines legible on long and tall pieces alike
  const k = Math.max(1, Math.max(width, maxZ) / 700);
  const PAD = { left: 170 * k, right: 60 * k, top: 60 * k, bottom: 150 * k };
  const vbW = width + PAD.left + PAD.right;
  const vbH = maxZ + PAD.top + PAD.bottom;
  const X = (v: number) => v - minX + PAD.left;
  const Y = (z: number) => PAD.top + maxZ - z;
  // far parts first, so nearer parts paint over them
  const ordered = [...all].sort((a, b) => near(a) - near(b));
  const hole = `holes-${uid}-${view}`;
  const nominal = front ? recipe.size.w : recipe.size.d;
  const label = title ?? `${front ? "Front" : "Side"} drawing`;

  return (
    <svg
      className={`${styles.svg} ${className ?? ""}`}
      viewBox={`0 0 ${vbW} ${vbH}`}
      role="img"
      aria-label={`${label}: ${Math.round(nominal / 10)} cm ${front ? "wide" : "deep"}, ${Math.round(recipe.size.h / 10)} cm high, nominal`}
    >
      <defs>
        <pattern id={hole} width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="var(--birch-shade)" />
          <circle cx="20" cy="20" r="4" fill="var(--birch-edge)" />
        </pattern>
      </defs>
      <line
        x1={PAD.left - 40 * k}
        x2={vbW - PAD.right + 40 * k}
        y1={Y(0)}
        y2={Y(0)}
        className={styles.floor}
      />
      <g>
        {ordered.map((p) => (
          <rect
            key={p.key}
            x={X(across(p))}
            y={Y(p.z + p.h)}
            width={Math.max(span(p), 4)}
            height={Math.max(p.h, 4)}
            fill={fill(p, config.finish, hole)}
            className={`${styles.part} ${p.kind === "door" ? styles.door : ""} ${
              fresh.includes(p.partId) ? styles.fresh : ""
            }`}
            data-part={p.partId}
          >
            <title>{p.name}</title>
          </rect>
        ))}
      </g>
      {showDimensions && (
        <g className={styles.dims} aria-hidden="true" style={{ fontSize: 42 * k }}>
          {/* width or depth */}
          <line x1={X(minX)} x2={X(maxX)} y1={Y(0) + 70 * k} y2={Y(0) + 70 * k} />
          <line x1={X(minX)} x2={X(minX)} y1={Y(0) + 50 * k} y2={Y(0) + 90 * k} />
          <line x1={X(maxX)} x2={X(maxX)} y1={Y(0) + 50 * k} y2={Y(0) + 90 * k} />
          <text x={X(minX) + width / 2} y={Y(0) + 130 * k} textAnchor="middle">
            {Math.round(nominal / 10)} cm
          </text>
          {/* height */}
          <line x1={PAD.left - 80 * k} x2={PAD.left - 80 * k} y1={Y(0)} y2={Y(maxZ)} />
          <line x1={PAD.left - 100 * k} x2={PAD.left - 60 * k} y1={Y(0)} y2={Y(0)} />
          <line x1={PAD.left - 100 * k} x2={PAD.left - 60 * k} y1={Y(maxZ)} y2={Y(maxZ)} />
          <text
            x={PAD.left - 100 * k}
            y={Y(maxZ / 2)}
            textAnchor="middle"
            transform={`rotate(-90 ${PAD.left - 100 * k} ${Y(maxZ / 2)})`}
            dy={-8 * k}
          >
            {Math.round(recipe.size.h / 10)} cm
          </text>
        </g>
      )}
    </svg>
  );
}
