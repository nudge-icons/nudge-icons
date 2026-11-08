import type { Animate } from "@nudge-icons/react";
import type { Entry } from "../lib/data";
import { IconView } from "./icon-view";

// The drawing area is the 24-unit canvas with the same margin on every side, so the icon
// sits in the centre in both views; the rulers live in the top and left margin. Guides and
// the icon share these units and line up at any width. Keep in sync with .bp-icon.
const MARGIN = 3;
const VIEW = MARGIN + 24 + MARGIN;
const UNITS = Array.from({ length: 25 }, (_, i) => i);

/**
 * The big preview as a technical drawing: unit grid, rulers, the 2–22 safe area, the
 * 1–23 stroke edge, keylines, the centre, and the stroke's centre line over the icon.
 */
export function Blueprint({
  entry,
  mode,
  strokeWidth,
  color,
  animate,
  active,
}: {
  entry: Entry;
  mode: "blueprint" | "clean";
  strokeWidth: number;
  color: string | null;
  animate: Animate;
  active: boolean;
}) {
  const icon = (extra: { strokeWidth: number; color: string | null }) => (
    <IconView entry={entry} size="100%" animate={animate} active={active} {...extra} />
  );
  return (
    <div className={`blueprint ${mode === "clean" ? "is-clean" : ""}`}>
      {mode === "blueprint" && (
        <svg
          className="bp-guides"
          viewBox={`${-MARGIN} ${-MARGIN} ${VIEW} ${VIEW}`}
          aria-hidden="true"
        >
          {UNITS.map((i) => (
            <g key={i} className={i % 12 === 0 ? "bp-major" : i % 4 === 0 ? "bp-mid" : "bp-minor"}>
              <line x1={i} y1={0} x2={i} y2={24} />
              <line x1={0} y1={i} x2={24} y2={i} />
            </g>
          ))}
          <circle className="bp-keyline" cx={12} cy={12} r={10} />
          <rect className="bp-keyline" x={3} y={3} width={18} height={18} />
          <rect className="bp-edge" x={1} y={1} width={22} height={22} />
          <rect className="bp-safe" x={2} y={2} width={20} height={20} />
          <rect className="bp-canvas" x={0} y={0} width={24} height={24} />
          {UNITS.map((i) => (
            <g key={i} className="bp-ruler">
              <line x1={i} y1={-0.9} x2={i} y2={i % 4 === 0 ? -0.2 : -0.5} />
              <line x1={-0.9} y1={i} x2={i % 4 === 0 ? -0.2 : -0.5} y2={i} />
              {i % 4 === 0 && (
                <>
                  <text x={i} y={-1.6} textAnchor="middle">
                    {i}
                  </text>
                  <text x={-1.5} y={i + 0.32} textAnchor="end">
                    {i}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>
      )}
      <div className="bp-icon">{icon({ strokeWidth, color })}</div>
      {mode === "blueprint" && (
        // The same icon with a hairline stroke: the centre line of every path, in motion.
        <div className="bp-icon bp-skeleton" aria-hidden="true">
          {icon({ strokeWidth: 0.15, color: null })}
        </div>
      )}
    </div>
  );
}
