import { VUE_DIR } from "../../../../scripts/lib/registry-layout.ts";
import type { Settings } from "../state/settings";
import { REGISTRY_URL } from "./constants";

export interface SnippetIcon {
  /** The export of the chosen variant: `Heart`, `HeartFilled`. */
  component: string;
  hasToggle: boolean;
}

/** Props that differ from the component defaults, in source order. */
function props(icon: SnippetIcon, s: Settings) {
  const defaultAnimate = icon.hasToggle ? "off" : "hover";
  const out: { name: string; value: string | number | boolean }[] = [];
  if (s.size !== 24) out.push({ name: "size", value: s.size });
  if (s.strokeWidth !== 2) out.push({ name: "strokeWidth", value: s.strokeWidth });
  if (s.color !== null) out.push({ name: "color", value: s.color });
  if (s.animate !== defaultAnimate)
    out.push({
      name: "animate",
      value: s.animate === "off" ? false : s.animate === "3" ? 3 : s.animate,
    });
  if (icon.hasToggle && s.active) out.push({ name: "active", value: true });
  return out;
}

export function reactSnippet(icon: SnippetIcon, s: Settings): string {
  const name = icon.component;
  const attrs = props(icon, s).map(({ name: n, value: v }) =>
    v === true ? n : typeof v === "string" ? `${n}="${v}"` : `${n}={${String(v)}}`,
  );
  return `import { ${name} } from "@nudge-icons/react";\n\n<${[name, ...attrs].join(" ")} />`;
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export function vueSnippet(icon: SnippetIcon, s: Settings): string {
  const name = icon.component;
  const attrs = props(icon, s).map(({ name: n, value: v }) =>
    v === true
      ? kebab(n)
      : typeof v === "string"
        ? `${kebab(n)}="${v}"`
        : `:${kebab(n)}="${String(v)}"`,
  );
  return `<script setup lang="ts">\nimport { ${name} } from "@nudge-icons/vue";\n</script>\n\n<template>\n  <${[name, ...attrs].join(" ")} />\n</template>`;
}

export const installCommand = (pkg: "react" | "vue" | "svg") => `pnpm add @nudge-icons/${pkg}`;

/** Copies the component source (and the shared core, once) into the project. */
export const registryCommand = (id: string, framework: "react" | "vue") =>
  framework === "react"
    ? `npx shadcn@latest add ${REGISTRY_URL}/${id}.json`
    : `npx shadcn-vue@latest add ${REGISTRY_URL}/${VUE_DIR}/${id}.json`;

/** `alert-triangle` → `Alert triangle`, for button text in examples. */
export const humanName = (id: string) => {
  const words = id.replace(/-(filled|half)$/, "").replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * How the icon sits in a button, an icon-only button and a menu row. The icon animates
 * when its interactive parent is hovered or focused, so these need no extra code.
 */
export function contextSnippet(component: string, id: string, framework: "react" | "vue") {
  const text = humanName(id);
  const icon = (size: number) =>
    framework === "react" ? `<${component} size={${size}} />` : `<${component} :size="${size}" />`;
  const cls = framework === "react" ? "className" : "class";
  const lines = [
    "<!-- Animates when the whole button is hovered or focused. -->",
    `<button>${icon(16)} ${text}</button>`,
    "",
    "<!-- Icon only: name the button; the icon stays hidden from screen readers. -->",
    `<button aria-label="${text}">${icon(20)}</button>`,
    "",
    '<!-- Other containers: role="menuitem", or the nudge-trigger class. -->',
    `<div role="menuitem">${icon(16)} ${text}</div>`,
    `<div ${cls}="nudge-trigger">${icon(16)} ${text}</div>`,
  ];
  return framework === "react"
    ? lines.map((l) => l.replace(/^<!-- (.*) -->$/, "{/* $1 */}")).join("\n")
    : `<template>\n${lines.map((l) => (l ? `  ${l}` : l)).join("\n")}\n</template>`;
}

/** The example colour in the parts CSS; the preview paints the chosen parts with it. */
export const PART_COLOR = "#e11d48";

/**
 * CSS that colours the chosen parts; several parts share one rule through `:is()`.
 * Outline icons set `stroke`, which wins even over a `color` prop. Filled and half icons
 * paint with `fill="currentColor"`, so they set `color`: it reaches the stroke and the fill
 * and leaves unfilled lines unfilled.
 */
export function partsCss(id: string, parts: readonly string[], painted = false) {
  const sel = parts.map((p) => `[data-part="${p}"]`);
  const target = sel.length === 1 ? sel[0] : `:is(${sel.join(", ")})`;
  return `.nudge-${id} ${target} {\n  ${painted ? "color" : "stroke"}: ${PART_COLOR};\n}`;
}
