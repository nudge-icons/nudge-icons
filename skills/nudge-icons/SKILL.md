---
name: nudge-icons
description: Use when adding, choosing, styling or animating icons with nudge-icons (@nudge-icons/react, @nudge-icons/vue, or icons copied from the nudge-icons shadcn registry), or when replacing lucide-react icons with them.
---

# nudge-icons

Animated line icons for React and Vue. Every icon is a component with its own small CSS motion. The props match lucide-react, plus `animate` and, on a few icons, `active`.

Full reference with every icon, its parts and its motion: https://nudge-icons.github.io/nudge-icons/llms-full.txt

## Find out how the project uses it

Check `package.json` and the imports before writing code:

- `@nudge-icons/react` or `@nudge-icons/vue` in dependencies: import from the package.
- Files in `components/icons/` that import from `@/lib/nudge-icons/`: the icons were copied with the shadcn CLI. Import from `@/components/icons/<name>`, and add a missing icon with `npx shadcn@latest add https://nudge-icons.github.io/nudge-icons/r/<name>.json` (Vue: `npx shadcn-vue@latest add https://nudge-icons.github.io/nudge-icons/r/vue/<name>.json`).
- Neither: install the package for the framework (`pnpm add @nudge-icons/react`, React 19+; `pnpm add @nudge-icons/vue`, Vue 3.3+).

## Never invent an icon or a prop

- Confirm an icon exists before using it. The installed exports are listed in `node_modules/@nudge-icons/react/dist/index.d.ts` (or `/vue/`), one `export declare const <Name>` per icon. `node_modules/@nudge-icons/svg/icons.json`, when installed, also has tags, the matching names in Lucide, Heroicons, Tabler, Phosphor and Material Symbols, the parts and the motion.
- Names are PascalCase of the kebab name: `alert-triangle` is `AlertTriangle`, `heart-filled` is `HeartFilled`. There are no `...Icon` or `Lucide...` aliases.
- If no icon fits, say so and name the closest ones by tags. Do not draw an SVG by hand in its place, and do not import a look-alike from another set without telling the user.
- The props are `size`, `color`, `strokeWidth`, `absoluteStrokeWidth`, `title`, `animate`, `active` (only some icons) and `className` (`class` in Vue). Other attributes go to the `<svg>`. Nothing else exists.

## Choose when it moves

`animate` decides when the motion plays:

- `"hover"` (default): on hover or keyboard focus of the icon or of its interactive parent. Right for icons inside buttons, links, tabs and menu items. No wrapper or handler is needed: the parent already triggers it.
- `"loop"`: repeats; for loaders and things that need attention now. Do not loop decoration.
- `"once"`: plays once on mount; for a confirmation that just appeared.
- a number, such as `3`: plays that many times.
- `false`: still; for dense lists and tables, or when many icons share a screen.

For a container that is not interactive (a card with `onClick`, a `div` row), add the class `nudge-trigger` so hovering it moves the icon. For still icons everywhere, import from `@nudge-icons/react/static` (or `/vue/static`) instead of passing `animate={false}` to each.

## Second state

Only icons typed `ToggleIconComponent` in `index.d.ts` accept `active` (for example `Menu`, `Eye`, `Lock`, `Copy`, `Play`). `active` swaps to the second drawing with a transition: the menu folds into a cross, a slash crosses out the eye. These icons do not move on hover by default.

Keep the state on the control, not the icon:

```tsx
<button aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
  <Menu active={open} />
</button>
```

Do not render two icons and switch between them when one icon has the second state: a play button is `<Play active={playing} />`, not `Play` swapped for `Pause`. Separate icons such as `Pause` and `LockOpen` are for drawings that never change (a status label, static icons). An active icon does not play its motion.

## Accessibility

- Without `title`, `aria-label` or `aria-labelledby`, an icon renders with `aria-hidden="true"`. That is right next to visible text; do not add `aria-hidden` yourself.
- An icon-only button gets `aria-label` on the button, not a `title` on the icon.
- An icon that carries meaning on its own (a status with no text) gets `title`.
- Reduced motion is handled by the library. Do not add JS checks for `prefers-reduced-motion`.

## Styling

- Colour comes from the text colour (`currentColor`); set it with a text colour class or `color`.
- Every icon has the classes `nudge-icon` and `nudge-<name>`. Library rules are inside `:where()`, so user classes win; never use `!important` for icons.
- Timing: set `--nudge-duration`, `--nudge-easing` or `--nudge-toggle-duration` on the icon or an ancestor.
- One part: `.nudge-bell [data-part="clapper"] { stroke: #e11d48; }`. Part names are in `icons.json` (`animation.parts`) and in llms-full.txt. On filled and half variants, set `color` instead of `stroke`.
- Do not add JS animation libraries, wrappers or keyframes to make an icon move: use `animate`.

## Replacing lucide-react

1. Install `@nudge-icons/react` and change the imports.
2. Find each new name in `icons.json` (`equivalents.lucide`) or in the table at https://nudge-icons.github.io/nudge-icons/docs/migrate-from-lucide. Many names are the same; some differ, such as `TriangleAlert` → `AlertTriangle`.
3. Pairs such as `Menu`/`X` or `Eye`/`EyeOff` become one icon with `active` where it exists.
4. `<Heart fill="currentColor" />` becomes `<HeartFilled />`.
5. Run the type checker; icons without a counterpart stay on Lucide for now (the sets match in grid and stroke).

## Copied registry code

Files under `lib/nudge-icons/` and `components/icons/` were generated. Keep the license line and `lib/nudge-icons/license.ts`. To update them, run the `add` command again with `--overwrite` rather than editing the copies.
