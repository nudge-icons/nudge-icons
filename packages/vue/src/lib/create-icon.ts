import {
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  ssrContextKey,
  type PropType,
  type SetupContext,
  type VNode,
} from "vue";

/** Icon drawing as data: `[tag, attributes, children]`, generated from icons/*.svg. */
export type IconNode = ReadonlyArray<
  readonly [tag: string, attrs: Readonly<Record<string, string>>, children?: IconNode]
>;

/**
 * When the motion plays: on hover or focus (also of an interactive parent), in a loop,
 * once on mount, a number of times (`3`), or never.
 */
export type Animate = "hover" | "loop" | "once" | number | false;

const staticProps = {
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

const iconProps = {
  ...staticProps,
  /** Default `"hover"`. */
  animate: { type: [String, Boolean, Number] as PropType<Animate>, default: "hover" },
};

const toggleProps = {
  ...iconProps,
  /** Shows the second drawing, for example `Menu` turns into a cross. */
  active: { type: Boolean, default: false },
};

// --- CSS delivery -----------------------------------------------------------------------
// Server: the first instance of each icon per request renders its <style> inline.
// Client: the first instance per app renders it inline too when the server did (so
// hydration sees the same markup; several server-rendered apps on one page each match
// their own), and every icon also gets a lasting copy in <head>, so its CSS stays when
// that first instance unmounts.

const SSR_KEY = Symbol.for("nudge-icons.styles");
// Per app, so islands and micro-frontends each hydrate their own first instance.
const claimedByApp = new WeakMap<object, Set<string>>();
const noApp = {};

function ensureHeadStyle(id: string, css: string) {
  if (document.head.querySelector(`style[data-nudge-head="${id}"]`)) return;
  const style = document.createElement("style");
  style.dataset.nudgeHead = id;
  style.textContent = css;
  document.head.append(style);
}

/** Decides once per component instance whether it renders the icon's <style> inline. */
function claimInlineStyle(id: string, css: string): boolean {
  const ssr = inject(ssrContextKey, null) as Record<symbol, Set<string> | undefined> | null;
  if (ssr) {
    const rendered = (ssr[SSR_KEY] ??= new Set<string>());
    if (rendered.has(id)) return false;
    rendered.add(id);
    return true;
  }
  if (typeof document === "undefined") return false;
  ensureHeadStyle(id, css);
  const app = getCurrentInstance()?.appContext.app ?? noApp;
  let claimed = claimedByApp.get(app);
  if (!claimed) claimedByApp.set(app, (claimed = new Set()));
  if (claimed.has(id)) return false;
  claimed.add(id);
  return document.querySelector(`style[data-nudge="${id}"]`) !== null;
}

// --- Rendering --------------------------------------------------------------------------

function renderNode(node: IconNode): VNode[] {
  return node.map(([tag, attrs, children]) =>
    h(tag, { ...attrs }, children ? renderNode(children) : undefined),
  );
}

interface AnyIconProps {
  size: number | string;
  strokeWidth: number | string;
  color: string;
  absoluteStrokeWidth: boolean;
  title: string | undefined;
  animate?: Animate | undefined;
  active?: boolean | undefined;
}

/** Shared setup for every icon; `css` is undefined for /static icons. */
function iconSetup(name: string, node: IconNode, css: string | undefined) {
  return (p: Readonly<AnyIconProps>, { attrs }: SetupContext) => {
    const inline = css ? claimInlineStyle(name, css) : false;
    return () => {
      const strokeWidth =
        p.absoluteStrokeWidth && Number(p.size) > 0
          ? (Number(p.strokeWidth) * 24) / Number(p.size)
          : p.strokeWidth;
      const labelled = Boolean(p.title ?? attrs["aria-label"] ?? attrs["aria-labelledby"]);
      const animated = css !== undefined;
      // A number plays the loop that many times; 0 or less means no motion.
      const repeat = typeof p.animate === "number" ? p.animate : undefined;
      const mode = repeat === undefined ? (p.animate ?? "hover") : repeat > 0 ? "loop" : false;
      const children: VNode[] = [];
      if (inline && css) children.push(h("style", { "data-nudge": name }, css));
      if (p.title) children.push(h("title", p.title));
      children.push(...renderNode(node));
      return h(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          width: p.size,
          height: p.size,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: p.color,
          "stroke-width": strokeWidth,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          class: ["nudge-icon", `nudge-${name}`],
          "data-animate": animated && mode !== false ? mode : undefined,
          style:
            animated && repeat !== undefined && repeat > 0
              ? { "--nudge-repeat": repeat }
              : undefined,
          "data-active": animated && p.active ? "" : undefined,
          ...(labelled ? { role: "img" } : { "aria-hidden": "true" }),
        },
        children,
      );
    };
  };
}

export const createIcon = (name: string, displayName: string, node: IconNode, css = "") =>
  defineComponent({ name: displayName, props: iconProps, setup: iconSetup(name, node, css) });

export const createToggleIcon = (name: string, displayName: string, node: IconNode, css = "") =>
  defineComponent({ name: displayName, props: toggleProps, setup: iconSetup(name, node, css) });

export const createStaticIcon = (name: string, displayName: string, node: IconNode) =>
  defineComponent({
    name: displayName,
    props: staticProps,
    setup: iconSetup(name, node, undefined),
  });

export type IconComponent = ReturnType<typeof createIcon>;
export type ToggleIconComponent = ReturnType<typeof createToggleIcon>;
export type StaticIconComponent = ReturnType<typeof createStaticIcon>;
