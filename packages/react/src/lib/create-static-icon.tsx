import { forwardRef } from "react";
import { renderNode, renderSvg } from "./render-svg";
import type { IconNode, StaticIconComponent, StaticIconProps } from "./types";

/** An icon without motion CSS: imports nothing from the animated code. */
export function createStaticIcon(
  name: string,
  displayName: string,
  node: IconNode,
): StaticIconComponent {
  const children = renderNode(node);
  const icon = forwardRef<SVGSVGElement, StaticIconProps>((props, ref) =>
    renderSvg(name, children, props, ref),
  );
  icon.displayName = displayName;
  return icon;
}
