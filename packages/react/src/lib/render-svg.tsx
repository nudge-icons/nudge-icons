import { createElement, type ReactNode, type Ref, type SVGProps } from "react";
import type { IconNode, StaticIconProps } from "./types";

/** Turns generated node data into React elements; done once per component. */
export function renderNode(node: IconNode): ReactNode[] {
  return node.map(([tag, attrs, children], key) =>
    createElement(tag, { key, ...attrs }, children ? renderNode(children) : undefined),
  );
}

/**
 * The <svg> every icon renders: size, stroke, class names and accessibility. Animated
 * icons pass their data attributes and style in `extra`; static icons pass nothing.
 */
export function renderSvg(
  name: string,
  children: ReactNode[],
  props: StaticIconProps,
  ref: Ref<SVGSVGElement> | undefined,
  extra: SVGProps<SVGSVGElement> = {},
) {
  const {
    size = 24,
    strokeWidth = 2,
    color = "currentColor",
    absoluteStrokeWidth = false,
    title,
    className,
    ...rest
  } = props;
  const width =
    absoluteStrokeWidth && Number(size) > 0
      ? (Number(strokeWidth) * 24) / Number(size)
      : strokeWidth;
  const labelled = Boolean(title ?? rest["aria-label"] ?? rest["aria-labelledby"]);
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      // Filled variants paint with fill="currentColor"; this makes them follow the colour too.
      // A presentation attribute, so a user's CSS colour still wins.
      {...(color !== "currentColor" && { color })}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={["nudge-icon", `nudge-${name}`, className].filter(Boolean).join(" ")}
      {...(labelled ? { role: "img" } : { "aria-hidden": true })}
      {...rest}
      {...extra}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}
