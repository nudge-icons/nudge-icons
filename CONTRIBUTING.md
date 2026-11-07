# Contributing

## Drawing rules

Every icon in `icons/` follows these rules. `pnpm check:icons` enforces most of them.

- Canvas: `viewBox="0 0 24 24"`, `width="24"`, `height="24"`. Keep all points inside the 2–22 safe zone (2px padding on every side).
- Stroke and paint are set on the root `<svg>` only: `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
- Allowed elements: `path`, `circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon`, `g`. Child elements carry geometry attributes only.
- Coordinates snap to a 0.5 grid. Use as few points per `path` as possible.
- Animated parts are separate elements marked with `data-part="…"`, for example `data-part="clapper"` in `bell`.
- Check every icon at 16, 24 and 48px on light and dark backgrounds.

## Icon metadata

Each `icons/<name>.svg` has a matching `icons/<name>.json`:

```json
{
  "name": "download",
  "category": "actions",
  "tags": ["save", "export", "file", "arrow-down"],
  "animation": {
    "name": "drop",
    "description": "The arrow drops into the tray and returns",
    "parts": ["arrow"]
  }
}
```

- `category`: `actions`, `interface` or `status`.
- `animation.parts` lists the `data-part` values the animation moves; each must exist in the SVG.

## Before opening a pull request

```bash
pnpm check:icons && pnpm lint && pnpm typecheck && pnpm test && pnpm format:check
```
