# @nudge-icons/svg

The nudge-icons drawings as plain SVG files, for anything that is not React or Vue. The files are drawn at rest: no motion and no second state. For the animated icons, use [@nudge-icons/react](https://www.npmjs.com/package/@nudge-icons/react) or [@nudge-icons/vue](https://www.npmjs.com/package/@nudge-icons/vue).

```sh
pnpm add @nudge-icons/svg
```

```js
import bellUrl from "@nudge-icons/svg/bell.svg";
import icons from "@nudge-icons/svg/icons.json";
```

- `@nudge-icons/svg/<name>.svg`: one file per icon and variant, such as `bell.svg` or `heart-filled.svg`. 24×24, `stroke="currentColor"`.
- `@nudge-icons/svg/icons.json`: every icon with its tags, category, motion, parts, second state, variants and the matching names in Lucide, Heroicons, Tabler, Phosphor and Material Symbols.

[All icons](https://nudge-icons.github.io/nudge-icons/) · [GitHub](https://github.com/nudge-icons/nudge-icons) · MIT License
