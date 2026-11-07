# Contributing

## Drawing rules

Every icon in `icons/` follows these rules. `pnpm check:icons` enforces most of them.

- Canvas: `viewBox="0 0 24 24"`, `width="24"`, `height="24"`. Keep all points inside the 2–22 safe zone (2px padding on every side), including the far side of arcs and the control points of curves. The 2px stroke then reaches 1–23.
- Centre the drawn shape on the canvas within 0.25px. When one part carries the visual weight, centre that part instead: `search` keeps its lens near the centre and lets the handle run into the corner, so its frame is off by 0.5px but it looks centred in an icon button. Check such exceptions in context (an input, a square icon button, a button with text), not only on the grid.
- Stroke and paint are set on the root `<svg>` only: `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
- Allowed elements: `path`, `circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon`, `g`. Child elements carry geometry attributes only.
- Coordinates snap to a 0.5 grid. Use as few points per `path` as possible.
- Animated parts are separate elements marked with `data-part="…"`, for example `data-part="clapper"` in `bell`. Part names are also a public styling API (users colour single parts with CSS), so do not rename them in a minor release.
- Check every icon at 16, 24 and 48px on light and dark backgrounds.

### Filled variant

Some icons also have a filled variant in `icons/filled/<name>.svg` (exported as `HeartFilled`, for example). It follows the same rules with two exceptions:

- Child elements may add `fill="currentColor"` and `fill-rule="evenodd"`. The root `<svg>` stays identical to the outline icon, so `strokeWidth` works the same way.
- Details such as a tick or an exclamation mark are holes in the filled shape. The stroke also runs along the inside of a hole, so draw the hole 1px larger on every side than the detail should look. Holes must not overlap: with `evenodd` an overlap is filled again. Two holes may touch at a single point; the strokes cover it, so the smallest visible gap between details is 2px.

Keep the outer size equal to the outline icon and reuse its `data-part` names, so the same animation and toggle apply. The stroke also grows a filled shape by 1px outwards, so narrow gaps close up: a filled shape may need its own geometry (the filled `settings` gear has thinner, tapered teeth).

### Half variant

`star` and `heart` also have a half variant in `icons/half/<name>.svg` (`StarHalf`, `HeartHalf`) for ratings. It draws the full outline plus a filled left half, both inside one `data-part` group so the outline animation moves them together. It follows the filled rules. The filled half is stroked too, so its inner edge runs at x=11 and the stroke ends exactly on the centre line. Put the corners where that edge meets the outline on the outline path itself, so their round joins hide under the outline stroke. If the outline has a sharp turn on the centre line (the dip of `heart`), its round join bulges into the empty half; start the outline inside the filled half instead, along the tangent, so there is no join there.

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

- `category`: `actions`, `interface`, `status` or `objects`.
- `equivalents` (optional) maps other icon sets to their closest icon, using each set's own icon id (its file name), not the component name. Supported sets: `lucide`, `heroicons`, `tabler`, `phosphor`, `material` (Material Symbols). List the set's current id first, then old names it still exports as aliases (Lucide `loader-2` for `loader-circle`). Leave a set out when it has no close match. `pnpm check:icons` checks every id against the sets, which are installed as dev dependencies:

  ```json
  "equivalents": {
    "lucide": ["triangle-alert"],
    "heroicons": ["exclamation-triangle"],
    "tabler": ["alert-triangle"],
    "phosphor": ["warning"],
    "material": ["warning"]
  }
  ```

- `animation` is the motion played by the `animate` prop (`"hover"`, `"loop"`, `"once"`, a number of repeats, or `false`): the icon moves and returns to its resting drawing. `animation.parts` lists the `data-part` values it moves; each must exist in the SVG.
- `toggle` is optional and describes a second state shown by the `active` prop:

  ```json
  "toggle": {
    "description": "A slash draws across the eye to hide it",
    "parts": ["slash"],
    "activeOnly": ["slash"],
    "motion": [{ "part": "slash", "preset": "draw" }]
  }
  ```

  `parts` lists what changes between the states, and `motion` (required) says how, as a CSS transition:

  | Preset | Parameters                  | Active state                                                          |
  | ------ | --------------------------- | --------------------------------------------------------------------- |
  | `hide` | —                           | the part fades out (the middle line of `menu`)                        |
  | `draw` | —                           | the part draws in (the slash of `eye`); use it for `activeOnly` parts |
  | `move` | `x`, `y`, `angle`, `origin` | the part moves and turns (the lines of `menu` fold into a cross)      |
  | `trim` | `length`, `offset`          | the stroke is cut short (the shackle of `lock` opens)                 |

  Any toggle motion may add `morph`: the part's path in the active state, for example the lifted shackle of `lock`. It must use the same commands as the source path (so browsers interpolate it), stay on the grid and inside the safe area, and only add to what the preset already shows: Safari ignores the CSS `d` property, so there the preset alone has to read correctly. Transitions run even with `animate={false}`, take `--nudge-toggle-duration` (300ms by default), are instant under reduced motion, and an active icon does not play its motion. `activeOnly` lists parts drawn only in the active state: they are hidden by default, dropped from the `/static` entry, and must not be moved by `animation`.

- `filled` (and `half`) is required when `icons/filled/<name>.svg` (or `icons/half/<name>.svg`) exists. It may override `animation` when the filled drawing cannot play the outline one, for example when the animated detail is a hole:

  ```json
  "filled": {
    "animation": { "name": "pop", "description": "The badge pops up and settles", "parts": ["badge"] }
  }
  ```

- Every icon needs `animation.motion`; `pnpm check:icons` fails without it. It says how each part moves, using shared presets (`scripts/lib/motion.ts`). One motion per part; times in milliseconds, points in canvas units:

  | Preset    | Parameters                               | Use                                                                                           |
  | --------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
  | `swing`   | `origin: [x, y]`, `angle`                | a bell or a sign swinging from a pin                                                          |
  | `nudge`   | `x`, `y`                                 | a push and back, like an arrow                                                                |
  | `bounce`  | `x`, `y`                                 | a push that settles in smaller swings                                                         |
  | `pass`    | `x`, `y`                                 | moves away fading out, comes back from the other side                                         |
  | `draw`    | —                                        | the stroke draws itself                                                                       |
  | `spin`    | `origin` (default centre), `angle` (360) | a turn; 90 for a cross that settles                                                           |
  | `pulse`   | `origin`, `scale`, `beats` (1 or 2)      | a heartbeat or a pop                                                                          |
  | `shake`   | `x`                                      | a warning shaking side to side                                                                |
  | `orbit`   | `r`                                      | a small circle, like a lens searching                                                         |
  | `flash`   | —                                        | flickers twice                                                                                |
  | `revolve` | `rx`, `radius`                           | a meridian ellipse turning with a globe (animates `rx`, keeps the stroke width; Safari 17.4+) |

  Every motion also takes `delay` and `duration` (ms); `pulse` also takes `axis: "x" | "y"` to squash along one axis (a blinking eye). All presets return to the resting drawing (`pass` fades its part out and back in on the way), so `hover` and `once` end where they started.

  ```json
  "motion": [
    { "part": "body", "preset": "swing", "origin": [12, 3], "angle": 12 },
    { "part": "clapper", "preset": "swing", "origin": [12, 3], "angle": 16, "delay": 60 }
  ]
  ```

  The CSS comes in two layers: a shared base, loaded once per page by any animated icon, decides when parts play (hover or focus of the icon or an interactive parent, `once`, `loop`, reduced motion); each icon only adds its keyframes and a few custom properties on its moving parts. It only animates `transform`, `opacity`, stroke dashes and, for `revolve`, an ellipse's `rx`, wraps every selector in `:where()` (zero specificity) and is switched off by `prefers-reduced-motion`. Each motion is followed by a rest inside the same cycle, so a loop pauses between repeats. Users tune it with `--nudge-duration` (the whole cycle, rest included) and `--nudge-easing`; a loop repeats `--nudge-repeat` times (infinite by default), which components set from a numeric `animate`.

Run `pnpm preview` to build `preview.html` with every icon on the grid, at 16, 24 and 48px on light and dark, in both states and in every variant, with its motion. Icons with motion come first; hover a card to play it, or switch every icon to `loop`, `once`, `3×` or off. The dashed frame is the 2–22 safe area, the dotted one the 1–23 stroke edge; the measured centre is shown under each icon and turns red when it is off.

## Generated code

React and Vue components and the `@nudge-icons/svg` files are generated from `icons/` by `pnpm build:icons` (also run by `typecheck`, `test` and `build`). They are git-ignored; change `icons/` or `scripts/build-icons.ts`, never the generated files. `pnpm build` also bundles a single icon from every package entry and fails if any other icon gets in, so keep generated calls marked `/* @__PURE__ */`.

## Before opening a pull request

```bash
pnpm check:icons && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check
```
