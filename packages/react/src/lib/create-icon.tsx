import {
  createElement,
  forwardRef,
  type CSSProperties,
  type ForwardRefExoticComponent,
  type PropsWithoutRef,
  type ReactNode,
  type RefAttributes,
  type SVGProps,
} from "react";

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

type Component<P> = ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<SVGSVGElement>>;
export type StaticIconComponent = Component<StaticIconProps>;
export type IconComponent = Component<IconProps>;
export type ToggleIconComponent = Component<ToggleIconProps>;

function renderNode(node: IconNode): ReactNode[] {
  return node.map(([tag, attrs, children], key) =>
    createElement(tag, { key, ...attrs }, children ? renderNode(children) : undefined),
  );
}

function make<P extends StaticIconProps>(
  name: string,
  displayName: string,
  node: IconNode,
  css: string | undefined,
): Component<P> {
  const children = renderNode(node);
  const icon = forwardRef<SVGSVGElement, P>((props, ref) => {
    const {
      size = 24,
      strokeWidth = 2,
      color = "currentColor",
      absoluteStrokeWidth = false,
      title,
      className,
      animate = "hover",
      active,
      style,
      ...rest
    } = props as ToggleIconProps;
    // A number plays the loop that many times; 0 or less means no motion.
    const repeat = typeof animate === "number" ? animate : undefined;
    const mode = repeat === undefined ? animate : repeat > 0 ? "loop" : false;
    const width =
      absoluteStrokeWidth && Number(size) > 0
        ? (Number(strokeWidth) * 24) / Number(size)
        : strokeWidth;
    const labelled = Boolean(title ?? rest["aria-label"] ?? rest["aria-labelledby"]);
    const svg = (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={["nudge-icon", `nudge-${name}`, className].filter(Boolean).join(" ")}
        {...(css !== undefined && mode !== false && { "data-animate": mode })}
        style={
          css !== undefined && repeat !== undefined && repeat > 0
            ? ({ ...style, "--nudge-repeat": repeat } as CSSProperties)
            : style
        }
        {...(css !== undefined && active && { "data-active": "" })}
        {...(labelled ? { role: "img" } : { "aria-hidden": true })}
        {...rest}
      >
        {title && <title>{title}</title>}
        {children}
      </svg>
    );
    if (!css) return svg;
    // React 19 hoists this into <head> once per href; React 18 renders it in place.
    return (
      <>
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

export const createStaticIcon = (
  name: string,
  displayName: string,
  node: IconNode,
): StaticIconComponent => make<StaticIconProps>(name, displayName, node, undefined);
