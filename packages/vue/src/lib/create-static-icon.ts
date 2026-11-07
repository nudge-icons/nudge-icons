import { defineComponent } from "vue";
import { renderSvg, staticProps } from "./render-svg";
import type { IconNode } from "./types";

/** An icon without motion CSS: imports nothing from the animated code. */
export const createStaticIcon = (name: string, displayName: string, node: IconNode) =>
  defineComponent({
    name: displayName,
    props: staticProps,
    setup:
      (p, { attrs }) =>
      () =>
        renderSvg(name, node, p, attrs),
  });
