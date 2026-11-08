import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@nudge-icons/react";
import type { Entry } from "../../lib/data";
import { useSettings } from "../../state/settings";
import { Segmented } from "../controls";
import { IconView } from "../icon-view";

const SMALL_SIZES = [12, 14, 16, 20] as const;
/** Pixel view scale: large enough to see single pixels and their antialiasing. */
const ZOOM = 4;

/** Small sizes at real pixels: 1× is the live SVG; Pixels is a raster of those pixels, 4× with a grid. */
export function SmallSizeTest({ entry }: { entry: Entry }) {
  const { settings } = useSettings();
  const [zoom, setZoom] = useState<"1" | "2">("1");
  const [animating, setAnimating] = useState(false);
  return (
    <section className="icon-section">
      <div className="section-head">
        <h2>Small size test</h2>
        <div className="section-tools">
          <Segmented
            label="Zoom"
            size="sm"
            value={zoom}
            options={[
              { value: "1", label: "1×", title: "Actual pixels · 100%" },
              {
                value: "2",
                label: "Pixels ×4",
                title: "The actual pixels, scaled up with a pixel grid",
              },
            ]}
            onChange={(z) => {
              setZoom(z);
              if (z === "2") setAnimating(false);
            }}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-pressed={animating}
            disabled={zoom === "2"}
            onClick={() => setAnimating((a) => !a)}
          >
            {animating ? "Stop" : "Animate"} <ArrowRight size={14} />
          </button>
        </div>
      </div>
      <p className="hint">
        {zoom === "1"
          ? "Actual pixels · 100%. Animate loops the motion to check that it does not blur together at small sizes."
          : "Each square is one screen pixel at 1×, scaled up 4×. Grey squares are antialiasing: this is what a non-Retina screen draws."}
      </p>
      <div className="small-sizes">
        {SMALL_SIZES.map((s) => (
          <figure key={s}>
            {zoom === "1" ? (
              <IconView
                entry={entry}
                size={s}
                strokeWidth={settings.strokeWidth}
                color={settings.color}
                animate={animating ? "loop" : false}
              />
            ) : (
              <Raster
                entry={entry}
                size={s}
                strokeWidth={settings.strokeWidth}
                color={settings.color}
              />
            )}
            <figcaption>{s}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Raster({
  entry,
  size,
  strokeWidth,
  color,
}: {
  entry: Entry;
  size: number;
  strokeWidth: number;
  color: string | null;
}) {
  const source = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const svg = source.current?.querySelector("svg");
    const ctx = canvas.current?.getContext("2d");
    if (!svg || !ctx) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("color", getComputedStyle(svg).color);
    // The image has no page CSS, so drop what that CSS hides at rest (active-only parts).
    const live = [...svg.querySelectorAll("*")];
    [...clone.querySelectorAll("*")].forEach((el, i) => {
      const node = live[i];
      if (node && getComputedStyle(node).opacity === "0") el.remove();
    });
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }),
    );
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [entry, size, strokeWidth, color]);

  return (
    <>
      <span ref={source} className="raster-source" aria-hidden="true">
        <IconView
          entry={entry}
          size={size}
          strokeWidth={strokeWidth}
          color={color}
          animate={false}
        />
      </span>
      <span className="raster-frame" style={{ width: size * ZOOM, height: size * ZOOM }}>
        <canvas ref={canvas} width={size} height={size} className="raster" />
      </span>
    </>
  );
}
