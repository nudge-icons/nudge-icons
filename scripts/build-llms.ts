// Writes llms.txt (an index for coding agents) and llms-full.txt (the whole API and every
// icon) into the site's public folder. The icon list comes from the same data as the
// packages, so it never goes stale; the API text matches the docs pages on the site.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DOCS } from "../apps/site/src/lib/docs.ts";
import { CORE_DIR, ICONS_DIR } from "./lib/registry-layout.ts";
import { registryUrl, siteUrl } from "./lib/site-url.ts";
import { svgPackage } from "./lib/icon-list.ts";

const root = join(import.meta.dirname, "..");
const out = join(root, "apps", "site", "public");

interface Animation {
  name: string;
  description: string;
}

interface ListedIcon {
  name: string;
  /** The outline component, such as `Bell`. */
  component: string;
  category: string;
  tags: string[];
  themes?: string[];
  animation: Animation;
  toggle?: { description: string; parts: string[] };
  variants: { variant: string; id: string; component: string }[];
}

const list = JSON.parse(readFileSync(join(svgPackage, "icons.json"), "utf8")) as ListedIcon[];

/** Every `data-part` of the source drawing, including parts shown only in the second state. */
const partsOf = (name: string) => [
  ...new Set(
    [
      ...readFileSync(join(root, "icons", `${name}.svg`), "utf8").matchAll(/data-part="([^"]+)"/g),
    ].map((m) => m[1] ?? ""),
  ),
];

const docUrl = (slug: string) => `${siteUrl}docs/${slug}`;

const SUMMARY =
  "Animated line icons for React and Vue, generated from one source. Each icon has its own small motion, made with CSS only (no JS runtime), and stops under prefers-reduced-motion. The drawings use a 24-unit grid, 2-unit stroke and round ends, like Lucide, with the same props.";

const llms = `# nudge-icons

> ${SUMMARY}

Packages: \`@nudge-icons/react\` (React 19+), \`@nudge-icons/vue\` (Vue 3.3+), \`@nudge-icons/svg\` (plain SVG files and \`icons.json\` with every icon's name, parts and motion).

## Docs

${DOCS.map((d) => `- [${d.title}](${docUrl(d.slug)}): ${d.description}`).join("\n")}

## For agents

- [llms-full.txt](${siteUrl}llms-full.txt): the whole API and every icon with its component name, parts, motion and second state, in one file.
- [Gallery](${siteUrl}): search icons by name or by the names other icon sets use.
`;

const icons = list
  .map((icon) => {
    const variants = icon.variants.filter((v) => v.variant !== "outline").map((v) => v.component);
    const lines = [
      `### ${icon.component} (\`${icon.name}\`)`,
      `- Motion: ${icon.animation.name}. ${icon.animation.description}.`,
      `- Parts: ${partsOf(icon.name)
        .map((p) => `\`${p}\``)
        .join(", ")}`,
    ];
    if (icon.toggle) lines.push(`- Second state (\`active\`): ${icon.toggle.description}.`);
    if (variants.length) lines.push(`- Variants: ${variants.map((c) => `\`${c}\``).join(", ")}`);
    if (icon.themes) lines.push(`- Themes: ${icon.themes.join(", ")}`);
    lines.push(`- Tags: ${icon.tags.join(", ")}`);
    return lines.join("\n");
  })
  .join("\n\n");

const toggles = list.filter((i) => i.toggle).map((i) => `\`${i.component}\``);

const full = `# nudge-icons

> ${SUMMARY}

Docs: ${siteUrl}docs/getting-started

## Install

- React: \`pnpm add @nudge-icons/react\` (peer: react >=19)
- Vue: \`pnpm add @nudge-icons/vue\` (peer: vue >=3.3)
- Plain SVG: \`@nudge-icons/svg\`, files at \`@nudge-icons/svg/<name>.svg\`, drawn at rest (no motion, no second state)
- Copy the source with the shadcn CLI, no package: \`npx shadcn@latest add ${registryUrl}/<name>.json\` (React) or \`npx shadcn-vue@latest add ${registryUrl}/vue/<name>.json\` (Vue). The first icon adds a shared core to \`${CORE_DIR}/\`; import icons from \`@/${ICONS_DIR}/<name>\`.

## Use

Every icon is a named export in PascalCase: \`bell\` is \`Bell\`, \`heart-filled\` is \`HeartFilled\`. There are no \`Icon\` suffix aliases. Import only what is used; the packages are tree-shakeable.

\`\`\`tsx
import { Bell } from "@nudge-icons/react";

<button><Bell size={16} /> Notifications</button>
\`\`\`

\`\`\`vue
<script setup lang="ts">
import { Bell } from "@nudge-icons/vue";
</script>

<template>
  <button><Bell :size="16" /> Notifications</button>
</template>
\`\`\`

## Props

These are the only props. Any other attribute is passed to the \`<svg>\`.

- \`size\` (default 24): width and height, a number of pixels or a CSS length.
- \`color\` (default \`currentColor\`): line colour.
- \`strokeWidth\` (default 2): line width in units of the 24-unit canvas.
- \`absoluteStrokeWidth\` (default false): keeps the line at \`strokeWidth\` pixels at any size; needs a numeric \`size\`.
- \`title\`: accessible name. Without \`title\`, \`aria-label\` or \`aria-labelledby\` the icon has \`aria-hidden="true"\`; with one it has \`role="img"\` (and a \`<title>\`).
- \`animate\` (default \`"hover"\`; \`false\` on icons with a second state): when the motion plays.
  - \`"hover"\`: on hover or \`:focus-visible\` of the icon or of its interactive parent (\`button\`, \`a\`, \`summary\`, \`label\`, \`[role=button]\`, \`[role=menuitem]\`, \`[role=tab]\`, or any element with the class \`nudge-trigger\`).
  - \`"loop"\`: repeats without end.
  - \`"once"\`: plays once when the icon mounts.
  - a number, such as \`3\`: plays that many times.
  - \`false\`: never moves.
- \`active\` (default false): shows the second drawing, with a transition. Exists only on icons with a second state: ${toggles.join(", ")}. Keep the state itself on the control, with \`aria-expanded\` or \`aria-pressed\`.
- \`className\` in React, \`class\` in Vue.

Still icons without the motion CSS and without second states: import from \`@nudge-icons/react/static\` or \`@nudge-icons/vue/static\`.

## Styling

- Classes on every icon: \`nudge-icon\` and \`nudge-<name>\`. The library's rules are inside \`:where()\`, so any user class wins without \`!important\`.
- CSS variables, on the icon or any ancestor: \`--nudge-duration\` (one run of the motion), \`--nudge-easing\` (timing function), \`--nudge-toggle-duration\` (change to the second state, default 0.3s).
- Parts: the moving pieces are elements with \`data-part\`, listed per icon below. Colour one part with \`.nudge-bell [data-part="clapper"] { stroke: #e11d48; }\`. Filled and half variants paint with \`fill="currentColor"\`: set \`color\` on the part instead of \`stroke\`. Part names do not change within a major version.

## Accessibility

- Decorative by default (\`aria-hidden="true"\`). Give \`title\` when the icon alone carries meaning.
- Icon-only button: put \`aria-label\` on the button, not on the icon.
- Under \`prefers-reduced-motion: reduce\` all motion and transitions stop; second states still change, at once.

## Icons

${list.length} icons. Variants are separate components with the same parts and props.

${icons}
`;

writeFileSync(join(out, "llms.txt"), llms);
writeFileSync(join(out, "llms-full.txt"), full);
console.log(`llms.txt and llms-full.txt: ${list.length} icons in apps/site/public/`);
