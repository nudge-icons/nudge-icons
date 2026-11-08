# @nudge-icons/react

Animated line icons for React. Each icon has its own small motion, made with CSS only, and stops under `prefers-reduced-motion`. Same props as lucide-react.

```sh
pnpm add @nudge-icons/react
```

```tsx
import { useState } from "react";
import { Bell, Menu } from "@nudge-icons/react";

export function Toolbar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button>
        <Bell size={16} /> Notifications
      </button>
      <button aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
        <Menu active={open} />
      </button>
    </>
  );
}
```

- `animate`: `"hover"` (default; also when the parent button or link is hovered or focused), `"loop"`, `"once"`, a number of runs, or `false`.
- `active`: the second drawing, on icons that have one (`Menu` folds into a cross).
- `size`, `color`, `strokeWidth`, `absoluteStrokeWidth`, `title`, `className`.
- Still icons without the motion CSS: `@nudge-icons/react/static`.

Requires React 19 or later. Tree-shakeable: only the icons you import end up in your bundle.

[Docs](https://nudge-icons.github.io/nudge-icons/docs/getting-started) · [All icons](https://nudge-icons.github.io/nudge-icons/) · [GitHub](https://github.com/nudge-icons/nudge-icons) · MIT License
