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
import { BASE_CSS } from "../generated/base-css";
import { renderSvg, staticProps, type StaticProps } from "./render-svg";
import type { Animate, IconNode } from "./types";

const iconProps = {
  ...staticProps,
  /** Default `"hover"`. */
  animate: { type: [String, Boolean, Number] as PropType<Animate>, default: "hover" },
};

const toggleProps = {
  ...iconProps,
  // No hover motion by default: the toggle is the animation, and a hover motion would
  // start right when `active` turns off and fight the transition back.
  animate: { type: [String, Boolean, Number] as PropType<Animate>, default: false },
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

interface AnimatedProps extends StaticProps {
  animate: Animate;
  active?: boolean | undefined;
}

function iconSetup(name: string, node: IconNode, css: string) {
  return (p: Readonly<AnimatedProps>, { attrs }: SetupContext) => {
    // The shared base decides when parts play; the icon's own CSS says what plays.
    const inlineBase = css ? claimInlineStyle("base", BASE_CSS) : false;
    const inline = css ? claimInlineStyle(name, css) : false;
    return () => {
      // A number plays the loop that many times; 0 or less means no motion.
      const repeat = typeof p.animate === "number" ? p.animate : undefined;
      const mode = repeat === undefined ? p.animate : repeat > 0 ? "loop" : false;
      const styles: VNode[] = [];
      if (inlineBase) styles.push(h("style", { "data-nudge": "base" }, BASE_CSS));
      if (inline) styles.push(h("style", { "data-nudge": name }, css));
      return renderSvg(
        name,
        node,
        p,
        attrs,
        {
          "data-animate": mode !== false ? mode : undefined,
          "data-active": p.active ? "" : undefined,
          style: repeat !== undefined && repeat > 0 ? { "--nudge-repeat": repeat } : undefined,
        },
        styles,
      );
    };
  };
}

export const createIcon = (name: string, displayName: string, node: IconNode, css = "") =>
  defineComponent({ name: displayName, props: iconProps, setup: iconSetup(name, node, css) });

export const createToggleIcon = (name: string, displayName: string, node: IconNode, css = "") =>
  defineComponent({ name: displayName, props: toggleProps, setup: iconSetup(name, node, css) });
