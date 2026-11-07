import type { ForwardRefExoticComponent, PropsWithoutRef, RefAttributes, SVGProps } from "react";

/** Icon drawing as data: `[tag, attributes, children]`, generated from icons/*.svg. */
export type IconNode = ReadonlyArray<
  readonly [tag: string, attrs: Readonly<Record<string, string>>, children?: IconNode]
>;

/**
 * When the motion plays: on hover or focus (also of an interactive parent), in a loop,
 * once on mount, a number of times (`3`), or never.
 */
export type Animate = "hover" | "loop" | "once" | number | false;

export interface StaticIconProps extends Omit<
  SVGProps<SVGSVGElement>,
  "ref" | "children" | "title"
> {
  /** Width and height. Default 24. */
  size?: number | string;
  /** Default 2. */
  strokeWidth?: number | string;
  /** Default `currentColor`, so the icon takes the text colour. */
  color?: string;
  /** Keep the stroke at `strokeWidth` pixels at any `size` (needs a numeric `size`). */
  absoluteStrokeWidth?: boolean;
  /** Accessible name. Without it (and without `aria-label`) the icon is hidden from assistive tech. */
  title?: string;
}

export interface IconProps extends StaticIconProps {
  /** Default `"hover"`. */
  animate?: Animate;
}

export interface ToggleIconProps extends IconProps {
  /** Shows the second drawing, for example `Menu` turns into a cross. */
  active?: boolean;
}

export type Component<P> = ForwardRefExoticComponent<
  PropsWithoutRef<P> & RefAttributes<SVGSVGElement>
>;
export type StaticIconComponent = Component<StaticIconProps>;
export type IconComponent = Component<IconProps>;
export type ToggleIconComponent = Component<ToggleIconProps>;
