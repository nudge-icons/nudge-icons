import type { Settings } from "./settings";

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

export const installCommand = (framework: "react" | "vue") => `pnpm add @nudge-icons/${framework}`;
