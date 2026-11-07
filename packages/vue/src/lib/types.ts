import type { createIcon, createToggleIcon } from "./create-icon";
import type { createStaticIcon } from "./create-static-icon";

/** Icon drawing as data: `[tag, attributes, children]`, generated from icons/*.svg. */
export type IconNode = ReadonlyArray<
  readonly [tag: string, attrs: Readonly<Record<string, string>>, children?: IconNode]
>;

/**
 * When the motion plays: on hover or focus (also of an interactive parent), in a loop,
 * once on mount, a number of times (`3`), or never.
 */
export type Animate = "hover" | "loop" | "once" | number | false;

export type IconComponent = ReturnType<typeof createIcon>;
export type ToggleIconComponent = ReturnType<typeof createToggleIcon>;
export type StaticIconComponent = ReturnType<typeof createStaticIcon>;
