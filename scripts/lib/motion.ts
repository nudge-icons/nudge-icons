// Motion presets: turn the `animation.motion` metadata of an icon into CSS.
//
// The CSS comes in two layers. baseCss() is shared by every icon and loaded once per page:
// it decides *when* parts play (hover, focus, once, loop, reduced motion). iconCss() is per
// icon and only says *what* plays: keyframes plus a few custom properties on each part.
// Every selector is wrapped in :where() (zero specificity), and the CSS only touches
// transform, opacity, stroke dashes and (for revolve) an ellipse's rx, so users can
// restyle colour and stroke freely.

export type Point = [x: number, y: number];

interface MotionBase {
  /** The data-part that moves. */
  part: string;
  /** Start after this many milliseconds. */
  delay?: number;
  /** Length of the motion in milliseconds, instead of the preset's default. */
  duration?: number;
}

export type Motion = MotionBase &
  (
    | { preset: "swing"; origin: Point; angle: number }
    | { preset: "nudge"; x?: number; y?: number }
    | { preset: "bounce"; x?: number; y?: number }
    | { preset: "pass"; x?: number; y?: number }
    | { preset: "draw" }
    | { preset: "spin"; origin?: Point; angle?: number }
    | { preset: "pulse"; origin?: Point; scale: number; beats?: 1 | 2; axis?: "x" | "y" }
    | { preset: "shake"; x: number }
    | { preset: "orbit"; r: number }
    | { preset: "flash" }
    | { preset: "revolve"; rx: number; radius: number }
    | { preset: "blink"; to: string }
    | { preset: "look"; x: number; blink?: boolean }
  );

/**
 * How a part changes when the icon becomes `active`; the change is a CSS transition.
 * `morph` optionally gives the part's path in the active state (same commands as the
 * source, so browsers can interpolate). Safari ignores the CSS `d` property, so a morph
 * must only add to what the preset already shows.
 */
export type ToggleMotion = { part: string; morph?: string } & (
  | { preset: "hide" }
  | { preset: "draw" }
  | { preset: "move"; x?: number; y?: number; angle?: number; origin?: Point }
  | { preset: "trim"; length: number; offset: number }
  | { preset: "bump"; x?: number; y?: number }
);
export type TogglePreset = ToggleMotion["preset"];

export type Preset = Motion["preset"];

/** Elements that can move by themselves inside an interactive parent. */
export const HOVER_TRIGGERS =
  "button,a,summary,label,[role=button],[role=menuitem],[role=tab],.nudge-trigger";

const SPRING = "cubic-bezier(.34,1.56,.64,1)";

interface PresetSpec {
  /** Duration of the motion itself in milliseconds, without the rest after it. */
  duration: number;
  easing: string;
  /**
   * Rest after the motion, as a share of its duration. The rest is part of the keyframes,
   * so a loop pauses between repeats and hover or once just stay still at the end.
   */
  loopRest: number;
  /** Easing in a loop, when it differs (a continuous spin should not slow down). */
  loopEasing?: string;
  /** `from` is the part's own path, for presets that morph it. */
  frames: (m: Motion, from?: string) => Record<number, string>;
  /** Fixed transform origin, if the preset rotates or scales. */
  origin?: (m: Motion) => Point | undefined;
}

const round = (n: number) => Math.round(n * 100) / 100;
const REST = "transform:none";
const rotate = (deg: number) => (round(deg) ? `transform:rotate(${round(deg)}deg)` : REST);
const translate = (x: number, y: number) => {
  const [rx, ry] = [round(x), round(y)];
  if (!rx && !ry) return REST;
  if (!rx) return `transform:translateY(${ry}px)`;
  if (!ry) return `transform:translateX(${rx}px)`;
  return `transform:translate(${rx}px,${ry}px)`;
};
const scale = (s: number, axis?: "x" | "y") =>
  round(s) === 1 ? REST : `transform:scale${axis ? axis.toUpperCase() : ""}(${round(s)})`;
const offset = (m: Motion): Point =>
  m.preset === "nudge" || m.preset === "bounce" || m.preset === "pass"
    ? [m.x ?? 0, m.y ?? 0]
    : [0, 0];

const SPECS: Record<Preset, PresetSpec> = {
  swing: {
    duration: 900,
    easing: "ease-in-out",
    loopRest: 0.8,
    origin: (m) => (m.preset === "swing" ? m.origin : undefined),
    frames: (m) => {
      const a = m.preset === "swing" ? m.angle : 0;
      return {
        0: rotate(0),
        20: rotate(a),
        40: rotate(-0.7 * a),
        60: rotate(0.45 * a),
        80: rotate(-0.2 * a),
        100: rotate(0),
      };
    },
  },
  nudge: {
    duration: 600,
    easing: SPRING,
    loopRest: 0.6,
    frames: (m) => {
      const x = m.preset === "nudge" ? (m.x ?? 0) : 0;
      const y = m.preset === "nudge" ? (m.y ?? 0) : 0;
      return { 0: translate(0, 0), 40: translate(x, y), 100: translate(0, 0) };
    },
  },
  bounce: {
    duration: 800,
    easing: "ease-out",
    loopRest: 0.6,
    // A push that settles with smaller and smaller swings.
    frames: (m) => {
      const [x, y] = offset(m);
      const at = (k: number) => translate(k * x, k * y);
      return { 0: at(0), 25: at(1), 45: at(-0.4), 62: at(0.3), 78: at(-0.12), 100: at(0) };
    },
  },
  pass: {
    duration: 900,
    easing: "ease-in-out",
    loopRest: 0.6,
    // Moves away while fading out, then comes back from the opposite side.
    frames: (m) => {
      const [x, y] = offset(m);
      return {
        0: `${translate(0, 0)};opacity:1`,
        45: `${translate(x, y)};opacity:0`,
        46: `${translate(-x, -y)};opacity:0`,
        100: `${translate(0, 0)};opacity:1`,
      };
    },
  },
  draw: {
    duration: 500,
    easing: "ease-out",
    loopRest: 0.8,
    // Drawn elements get pathLength="1", so a dash of 1 is the whole stroke.
    frames: () => ({
      0: "stroke-dasharray:1 1;stroke-dashoffset:1",
      100: "stroke-dasharray:1 1;stroke-dashoffset:0",
    }),
  },
  spin: {
    duration: 700,
    easing: "cubic-bezier(.4,0,.2,1)",
    loopRest: 0,
    loopEasing: "linear",
    origin: (m) => (m.preset === "spin" ? (m.origin ?? [12, 12]) : undefined),
    frames: (m) => ({ 0: rotate(0), 100: rotate(m.preset === "spin" ? (m.angle ?? 360) : 0) }),
  },
  pulse: {
    duration: 900,
    easing: "ease-out",
    loopRest: 0.4,
    origin: (m) => (m.preset === "pulse" ? (m.origin ?? [12, 12]) : undefined),
    frames: (m) => {
      const s = m.preset === "pulse" ? m.scale : 1;
      const axis = m.preset === "pulse" ? m.axis : undefined;
      if (m.preset === "pulse" && m.beats === 2) {
        return {
          0: REST,
          15: scale(s, axis),
          30: REST,
          45: scale(1 + (s - 1) * 0.7, axis),
          65: REST,
          100: REST,
        };
      }
      return { 0: REST, 40: scale(s, axis), 100: REST };
    },
  },
  shake: {
    duration: 600,
    easing: "ease-in-out",
    loopRest: 0.8,
    frames: (m) => {
      const x = m.preset === "shake" ? m.x : 0;
      return {
        0: translate(0, 0),
        15: translate(-x, 0),
        30: translate(x, 0),
        45: translate(-0.6 * x, 0),
        60: translate(0.6 * x, 0),
        75: translate(-0.3 * x, 0),
        90: translate(0.3 * x, 0),
        100: translate(0, 0),
      };
    },
  },
  orbit: {
    duration: 900,
    easing: "linear",
    loopRest: 0.4,
    // A small circle that starts and ends at the resting position.
    frames: (m) => {
      const r = m.preset === "orbit" ? m.r : 0;
      const frames: Record<number, string> = {};
      for (let step = 0; step <= 8; step++) {
        const a = (step / 8) * 2 * Math.PI;
        frames[step * 12.5] = translate(r * Math.cos(a) - r, r * Math.sin(a));
      }
      return frames;
    },
  },
  revolve: {
    duration: 1400,
    // Easing applies between every two keyframes, so anything but linear would stutter.
    easing: "linear",
    loopRest: 0,
    // A meridian of a sphere seen while it turns: its half-width is radius · |sin(longitude)|.
    // Half a turn brings the same drawing back, so loops are seamless. Animating rx keeps
    // the stroke width, which scaleX would squash.
    frames: (m) => {
      if (m.preset !== "revolve") return {};
      const start = Math.asin(Math.min(1, m.rx / m.radius));
      const frames: Record<number, string> = {};
      for (let step = 0; step <= 12; step++) {
        const rx = m.radius * Math.abs(Math.sin(start + (step / 12) * Math.PI));
        frames[round((step / 12) * 100)] = `rx:${round(rx)}px`;
      }
      return frames;
    },
  },
  blink: {
    duration: 1600,
    easing: "ease-in-out",
    loopRest: 0.4,
    // Morphs the part's path to `to` and back at the start of the cycle (CSS `d`, so
    // Chrome, Edge and Firefox; Safari keeps the drawing still). Stroke width is kept.
    frames: (m, from) => {
      if (m.preset !== "blink" || !from) return {};
      const open = `d:path("${from}")`;
      return { 0: open, 7: `d:path("${m.to}")`, 10: `d:path("${m.to}")`, 17: open, 100: open };
    },
  },
  look: {
    duration: 1600,
    easing: "cubic-bezier(.4,0,.2,1)",
    loopRest: 0.4,
    // Glances left and right; with `blink` it first hides while the lids of a blink close.
    frames: (m) => {
      const x = m.preset === "look" ? m.x : 0;
      const frames: Record<number, string> = {
        0: REST,
        28: translate(-x, 0),
        42: translate(-x, 0),
        56: translate(x, 0),
        70: translate(x, 0),
        84: REST,
        100: REST,
      };
      if (m.preset === "look" && m.blink) {
        // Hidden almost at once while the lids are shut: a slow opacity fade makes Chrome
        // paint the pupil as a soft bitmap for a moment.
        Object.assign(frames, {
          0: `${REST};opacity:1`,
          5: "opacity:1",
          6: "opacity:0",
          // Back only when the lids are open again (the blink reopens by 17%).
          16: "opacity:0",
          17: "opacity:1",
        });
      }
      return frames;
    },
  },
  flash: {
    duration: 700,
    easing: "ease-in-out",
    loopRest: 0.8,
    frames: () => ({
      0: "opacity:1",
      20: "opacity:.2",
      40: "opacity:1",
      60: "opacity:.2",
      80: "opacity:1",
      100: "opacity:1",
    }),
  },
};

export const PRESETS = Object.keys(SPECS) as Preset[];

/** Keyframes with identical steps merged: `0%,100%{transform:none}`. */
function frameBlock(name: string, frames: Record<number, string>) {
  const byDecl = new Map<string, number[]>();
  for (const [at, decl] of Object.entries(frames)) {
    byDecl.set(decl, [...(byDecl.get(decl) ?? []), Number(at)]);
  }
  const steps = [...byDecl]
    .map(([decl, ats]) => [ats.sort((a, b) => a - b), decl] as const)
    .sort(([a], [b]) => (a[0] ?? 0) - (b[0] ?? 0))
    .map(([ats, decl]) => `${ats.map((at) => `${round(at)}%`).join(",")}{${decl}}`);
  return `@keyframes ${name}{${steps.join("")}}`;
}

export const TOGGLE_PRESETS: TogglePreset[] = ["hide", "draw", "move", "trim", "bump"];

/** Parts drawn with stroke dashes; they need pathLength="1" on their shapes. */
export const drawnParts = (motion: readonly Motion[] = [], toggle: readonly ToggleMotion[] = []) =>
  [...motion, ...toggle].filter((m) => m.preset === "draw").map((m) => m.part);

/**
 * Shared CSS, loaded once per page by every animated icon. Each moving part sets
 * --nudge-k (keyframes), --nudge-t (cycle length), --nudge-f (easing) and optionally
 * --nudge-lf (loop easing) and --nudge-w (delay); users override --nudge-duration,
 * --nudge-easing and --nudge-repeat.
 */
export function baseCss(): string {
  const play = [
    `.nudge-icon[data-animate=hover]:is(:hover,:focus-visible) [data-part]`,
    `:is(${HOVER_TRIGGERS}):is(:hover,:focus-visible) .nudge-icon[data-animate=hover] [data-part]`,
    `.nudge-icon[data-animate=once] [data-part]`,
  ];
  const timing = "var(--nudge-duration,var(--nudge-t)) var(--nudge-easing,var(--nudge-f))";
  const toggle = "var(--nudge-toggle-duration,.3s) cubic-bezier(.4,0,.2,1)";
  return [
    // Second-state changes are transitions, so `active` animates even with animate={false}.
    `:where(.nudge-icon [data-part]){transition:transform ${toggle},opacity ${toggle},stroke-dashoffset ${toggle},d ${toggle}}`,
    // Hover and once play only the motion share of the cycle (--nudge-s), then end.
    // Fill is `backwards`, not `both`: every preset ends at rest, and Chrome paints SVG
    // with a running or held transform animation slightly blurry, so it must really end.
    `:where(${play.join(",")}){animation:var(--nudge-k,none) ${timing} var(--nudge-w,0s) var(--nudge-s,1) backwards}`,
    `:where(.nudge-icon[data-animate=loop] [data-part]){animation:var(--nudge-k,none) var(--nudge-duration,var(--nudge-t)) var(--nudge-easing,var(--nudge-lf,var(--nudge-f))) var(--nudge-w,0s) var(--nudge-repeat,infinite) backwards}`,
    // An icon in its second state stays still, so motion never fights the toggle.
    `:where(.nudge-icon[data-active] [data-part]){animation:none}`,
    `@media (prefers-reduced-motion:reduce){:where(.nudge-icon *){animation:none;transition:none}}`,
  ].join("");
}

/**
 * CSS for one component. `id` is the component id (`heart-filled`), `activeOnly` the
 * parts hidden until `data-active`. Returns "" when there is nothing to style.
 */
export function iconCss(
  id: string,
  motion: readonly Motion[] = [],
  activeOnly: readonly string[] = [],
  toggle: readonly ToggleMotion[] = [],
  /** The `d` of each part that is a single path, for presets that morph it. */
  paths: Readonly<Record<string, string>> = {},
) {
  const icon = `.nudge-${id}`;
  const rules: string[] = [];

  // Parts that exist only when active stay hidden until then, unless a toggle draws them.
  const drawnIn = new Set(toggle.filter((t) => t.preset === "draw").map((t) => t.part));
  for (const p of activeOnly) {
    if (!drawnIn.has(p))
      rules.push(`:where(${icon}:not([data-active]) [data-part="${p}"]){opacity:0}`);
  }

  for (const t of toggle) {
    const part = `[data-part="${t.part}"]`;
    let rest = "";
    let active = "";
    if (t.preset === "hide") active = "opacity:0";
    if (t.preset === "draw") {
      rest = "opacity:0;stroke-dasharray:1 1;stroke-dashoffset:1";
      active = "opacity:1;stroke-dashoffset:0";
    }
    if (t.preset === "move") {
      const moved = translate(t.x ?? 0, t.y ?? 0)
        .replace("transform:", "")
        .replace("none", "");
      const turned = t.angle ? `rotate(${round(t.angle)}deg)` : "";
      active = `transform:${[moved, turned].filter(Boolean).join(" ") || "none"}`;
      const [ox, oy] = t.origin ?? [12, 12];
      rest = `transform-box:view-box;transform-origin:${ox}px ${oy}px`;
    }
    if (t.preset === "trim") {
      rest = `stroke-dasharray:${t.length}`;
      active = `stroke-dashoffset:${t.offset}`;
    }
    if (t.preset === "bump") {
      // A one-off push when the icon becomes active: an animation applied by
      // [data-active] plays once as the attribute appears. It comes after the shared base
      // (which stops motion on active icons), so it wins at equal zero specificity.
      const name = `nudge-${id}-${t.part}-on`;
      const bounce = SPECS.bounce.frames({
        part: t.part,
        preset: "bounce",
        x: t.x ?? 0,
        y: t.y ?? 0,
      });
      rules.push(
        `@media (prefers-reduced-motion:no-preference){${frameBlock(name, bounce)}:where(${icon}[data-active] ${part}){animation:${name} .5s ease-out backwards}}`,
      );
      continue;
    }
    if (t.morph) active = [active, `d:path("${t.morph}")`].filter(Boolean).join(";");
    if (rest) rules.push(`:where(${icon} ${part}){${rest}}`);
    rules.push(`:where(${icon}[data-active] ${part}){${active}}`);
  }

  for (const m of motion) {
    const spec = SPECS[m.preset];
    const name = `nudge-${id}-${m.part}`;
    // The motion takes the first part of the cycle; the rest of it is still.
    const share = 1 / (1 + spec.loopRest);
    const own = spec.frames(m, paths[m.part]);
    const frames = Object.fromEntries(
      Object.entries(own).map(([at, decl]) => [round(Number(at) * share), decl]),
    );
    if (spec.loopRest > 0) frames[100] = own[100] ?? REST;
    rules.push(frameBlock(name, frames));

    const vars = [
      `--nudge-k:${name}`,
      `--nudge-t:${Math.round((m.duration ?? spec.duration) * (1 + spec.loopRest))}ms`,
      `--nudge-f:${spec.easing}`,
    ];
    if (spec.loopRest > 0) vars.push(`--nudge-s:${Math.ceil(share * 1000) / 1000}`);
    if (spec.loopEasing) vars.push(`--nudge-lf:${spec.loopEasing}`);
    if (m.delay) vars.push(`--nudge-w:${m.delay}ms`);
    const origin = spec.origin?.(m);
    if (origin) vars.push(`transform-box:view-box;transform-origin:${origin[0]}px ${origin[1]}px`);
    rules.push(`:where(${icon} [data-part="${m.part}"]){${vars.join(";")}}`);
  }

  return rules.join("");
}

/** Validation for `animation.motion` in icon metadata. */
export function checkMotion(motion: unknown, parts: readonly string[]): string[] {
  if (motion === undefined) return [];
  if (!Array.isArray(motion)) return ["animation.motion must be a list"];
  const errors: string[] = [];
  const seen = new Set<string>();
  const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  const point = (v: unknown) => Array.isArray(v) && v.length === 2 && v.every(num);
  for (const [index, item] of (motion as unknown[]).entries()) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      errors.push(`animation.motion[${index}] must be an object`);
      continue;
    }
    const raw = item as Record<string, unknown>;
    const where = `motion for "${String(raw.part)}"`;
    if (typeof raw.part !== "string" || !parts.includes(raw.part)) {
      errors.push(`${where}: part must be one of animation.parts`);
    } else if (seen.has(raw.part)) {
      errors.push(`${where}: a part can have only one motion`);
    } else seen.add(raw.part);
    if (!PRESETS.includes(raw.preset as Preset)) {
      errors.push(`${where}: preset must be one of ${PRESETS.join(", ")}`);
      continue;
    }
    if (raw.delay !== undefined && !num(raw.delay)) errors.push(`${where}: delay must be a number`);
    if (raw.duration !== undefined && !(num(raw.duration) && (raw.duration as number) > 0)) {
      errors.push(`${where}: duration must be a positive number`);
    }
    if (raw.to !== undefined && typeof raw.to !== "string") {
      errors.push(`${where}: to must be a path string`);
    }
    if (raw.axis !== undefined && raw.axis !== "x" && raw.axis !== "y") {
      errors.push(`${where}: axis must be "x" or "y"`);
    }
    if (raw.origin !== undefined && !point(raw.origin))
      errors.push(`${where}: origin must be [x, y]`);
    const need: Record<Preset, string[]> = {
      swing: ["origin", "angle"],
      nudge: [],
      bounce: [],
      pass: [],
      draw: [],
      spin: [],
      pulse: ["scale"],
      shake: ["x"],
      orbit: ["r"],
      flash: [],
      revolve: ["rx", "radius"],
      blink: ["to"],
      look: ["x"],
    };
    for (const key of need[raw.preset as Preset]) {
      if (raw[key] === undefined) errors.push(`${where}: ${raw.preset as string} needs ${key}`);
    }
    if (raw.beats !== undefined && raw.beats !== 1 && raw.beats !== 2) {
      errors.push(`${where}: beats must be 1 or 2`);
    }
    for (const key of ["angle", "scale", "x", "y", "r", "rx", "radius"]) {
      if (raw[key] !== undefined && !num(raw[key]))
        errors.push(`${where}: ${key} must be a number`);
    }
  }
  return errors;
}

/** Validation for `toggle.motion`: every toggle part needs one, so `active` always shows. */
export function checkToggleMotion(motion: unknown, toggleParts: readonly string[]): string[] {
  if (!Array.isArray(motion)) return ["toggle.motion must list how each toggle part changes"];
  const errors: string[] = [];
  const seen = new Set<string>();
  const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  for (const [index, item] of (motion as unknown[]).entries()) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      errors.push(`toggle.motion[${index}] must be an object`);
      continue;
    }
    const raw = item as Record<string, unknown>;
    const where = `toggle motion for "${String(raw.part)}"`;
    if (typeof raw.part !== "string" || !toggleParts.includes(raw.part)) {
      errors.push(`${where}: part must be one of toggle.parts`);
    } else if (seen.has(raw.part)) {
      errors.push(`${where}: a part can have only one toggle motion`);
    } else seen.add(raw.part);
    if (!TOGGLE_PRESETS.includes(raw.preset as TogglePreset)) {
      errors.push(`${where}: preset must be one of ${TOGGLE_PRESETS.join(", ")}`);
      continue;
    }
    if (raw.morph !== undefined && typeof raw.morph !== "string") {
      errors.push(`${where}: morph must be a path string`);
    }
    if (raw.preset === "trim" && !(num(raw.length) && num(raw.offset))) {
      errors.push(`${where}: trim needs length and offset`);
    }
    for (const key of ["x", "y", "angle"]) {
      if (raw[key] !== undefined && !num(raw[key]))
        errors.push(`${where}: ${key} must be a number`);
    }
  }
  for (const part of toggleParts) {
    if (!seen.has(part)) errors.push(`toggle part "${part}" has no toggle motion`);
  }
  return errors;
}
