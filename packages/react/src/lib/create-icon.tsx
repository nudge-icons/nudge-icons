import { forwardRef, type CSSProperties } from "react";
import { BASE_CSS } from "../generated/base-css";
import { renderNode, renderSvg } from "./render-svg";
import type {
  Component,
  IconComponent,
  IconNode,
  IconProps,
  ToggleIconComponent,
  ToggleIconProps,
} from "./types";

function make<P extends IconProps>(
  name: string,
  displayName: string,
  node: IconNode,
  css: string,
): Component<P> {
  const children = renderNode(node);
  const icon = forwardRef<SVGSVGElement, P>((props, ref) => {
    const { animate = "hover", active, style, ...rest } = props as ToggleIconProps;
    // A number plays the loop that many times; 0 or less means no motion.
    const repeat = typeof animate === "number" ? animate : undefined;
    const mode = repeat === undefined ? animate : repeat > 0 ? "loop" : false;
    const svg = renderSvg(name, children, rest, ref, {
      ...(mode !== false && { "data-animate": mode }),
      ...(active && { "data-active": "" }),
      style:
        repeat !== undefined && repeat > 0
          ? ({ ...style, "--nudge-repeat": repeat } as CSSProperties)
          : style,
    });
    if (!css) return svg;
    // React 19 hoists these into <head> once per href; React 18 renders them in place.
    // The shared base decides when parts play; the icon's own CSS says what plays.
    return (
      <>
        <style href="nudge-base" precedence="nudge-icons">
          {BASE_CSS}
        </style>
        <style href={`nudge-${name}`} precedence="nudge-icons">
          {css}
        </style>
        {svg}
      </>
    );
  });
  icon.displayName = displayName;
  return icon;
}

export const createIcon = (
  name: string,
  displayName: string,
  node: IconNode,
  css = "",
): IconComponent => make<IconProps>(name, displayName, node, css);

export const createToggleIcon = (
  name: string,
  displayName: string,
  node: IconNode,
  css = "",
): ToggleIconComponent => make<ToggleIconProps>(name, displayName, node, css);
