import { h, type PropType, type VNode } from "vue";
import type { IconNode } from "./types";

export const staticProps = {
  /** Width and height. Default 24. */
  size: { type: [Number, String] as PropType<number | string>, default: 24 },
  /** Default 2. */
  strokeWidth: { type: [Number, String] as PropType<number | string>, default: 2 },
  /** Default `currentColor`, so the icon takes the text colour. */
  color: { type: String, default: "currentColor" },
  /** Keep the stroke at `strokeWidth` pixels at any `size` (needs a numeric `size`). */
  absoluteStrokeWidth: { type: Boolean, default: false },
  /** Accessible name. Without it (and without `aria-label`) the icon is hidden from assistive tech. */
  title: { type: String, default: undefined },
};

export interface StaticProps {
  size: number | string;
  strokeWidth: number | string;
  color: string;
  absoluteStrokeWidth: boolean;
  title: string | undefined;
}

export function renderNode(node: IconNode): VNode[] {
  return node.map(([tag, attrs, children]) =>
    h(tag, { ...attrs }, children ? renderNode(children) : undefined),
  );
}

/**
 * The <svg> every icon renders: size, stroke, class names and accessibility. Animated
 * icons pass their data attributes and style in `extra` and their <style> tags in
 * `styles`; static icons pass nothing.
 */
export function renderSvg(
  name: string,
  node: IconNode,
  p: Readonly<StaticProps>,
  attrs: Record<string, unknown>,
  extra: Record<string, unknown> = {},
  styles: VNode[] = [],
) {
  const strokeWidth =
    p.absoluteStrokeWidth && Number(p.size) > 0
      ? (Number(p.strokeWidth) * 24) / Number(p.size)
      : p.strokeWidth;
  const labelled = Boolean(p.title ?? attrs["aria-label"] ?? attrs["aria-labelledby"]);
  return h(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: p.size,
      height: p.size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: p.color,
      // Filled variants paint with fill="currentColor"; this makes them follow the colour too.
      // A presentation attribute, so a user's CSS colour still wins.
      ...(p.color !== "currentColor" && { color: p.color }),
      "stroke-width": strokeWidth,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: ["nudge-icon", `nudge-${name}`],
      ...(labelled ? { role: "img" } : { "aria-hidden": "true" }),
      ...extra,
    },
    [...styles, ...(p.title ? [h("title", p.title)] : []), ...renderNode(node)],
  );
}
