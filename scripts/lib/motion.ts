// Motion presets: turn the `animation.motion` metadata of an icon into CSS.
//
// The CSS comes in two layers. baseCss() is shared by every icon and loaded once per page:
// it decides *when* parts play (hover, focus, once, loop, reduced motion). iconCss() is per
// icon and only says *what* plays: keyframes plus a few custom properties on each part.
// Every selector is wrapped in :where() (zero specificity), and the CSS only touches
// transform, opacity and stroke dashes, so users can restyle colour and stroke freely.

export type Point = [x: number, y: number];

interface MotionBase {
  /** The data-part that moves. */
  part: string;
  /** Start after this many milliseconds. */
  delay?: number;
}

export type Motion = MotionBase &
  (
    | { preset: "swing"; origin: Point; angle: number }
    | { preset: "nudge"; x?: number; y?: number }
    | { preset: "bounce"; x?: number; y?: number }
    | { preset: "pass"; x?: number; y?: number }
    | { preset: "draw" }
    | { preset: "spin"; origin?: Point; angle?: number }
    | { preset: "pulse"; origin?: Point; scale: number; beats?: 1 | 2 }
    | { preset: "shake"; x: number }
  );

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
  frames: (m: Motion) => Record<number, string>;
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
const scale = (s: number) => (round(s) === 1 ? REST : `transform:scale(${round(s)})`);
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
      if (m.preset === "pulse" && m.beats === 2) {
        return {
          0: scale(1),
          15: scale(s),
          30: scale(1),
          45: scale(1 + (s - 1) * 0.7),
          65: scale(1),
          100: scale(1),
        };
      }
      return { 0: scale(1), 40: scale(s), 100: scale(1) };
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

/** Parts that the draw preset animates; they need pathLength="1" on their shapes. */
export const drawnParts = (motion: readonly Motion[] = []) =>
  motion.filter((m) => m.preset === "draw").map((m) => m.part);

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
  return [
    `:where(${play.join(",")}){animation:var(--nudge-k,none) ${timing} var(--nudge-w,0s) both}`,
    `:where(.nudge-icon[data-animate=loop] [data-part]){animation:var(--nudge-k,none) var(--nudge-duration,var(--nudge-t)) var(--nudge-easing,var(--nudge-lf,var(--nudge-f))) var(--nudge-w,0s) var(--nudge-repeat,infinite) both}`,
    `@media (prefers-reduced-motion:reduce){:where(.nudge-icon *){animation:none}}`,
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
) {
  const icon = `.nudge-${id}`;
  const rules: string[] = [];

  for (const p of activeOnly) {
    rules.push(`:where(${icon}:not([data-active]) [data-part="${p}"]){opacity:0}`);
  }

  for (const m of motion) {
    const spec = SPECS[m.preset];
    const name = `nudge-${id}-${m.part}`;
    // The motion takes the first part of the cycle; the rest of it is still.
    const share = 1 / (1 + spec.loopRest);
    const frames = Object.fromEntries(
      Object.entries(spec.frames(m)).map(([at, decl]) => [round(Number(at) * share), decl]),
    );
    if (spec.loopRest > 0) frames[100] = spec.frames(m)[100] ?? REST;
    rules.push(frameBlock(name, frames));

    const vars = [
      `--nudge-k:${name}`,
      `--nudge-t:${Math.round(spec.duration * (1 + spec.loopRest))}ms`,
      `--nudge-f:${spec.easing}`,
    ];
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
    };
    for (const key of need[raw.preset as Preset]) {
      if (raw[key] === undefined) errors.push(`${where}: ${raw.preset as string} needs ${key}`);
    }
    if (raw.beats !== undefined && raw.beats !== 1 && raw.beats !== 2) {
      errors.push(`${where}: beats must be 1 or 2`);
    }
    for (const key of ["angle", "scale", "x", "y"]) {
      if (raw[key] !== undefined && !num(raw[key]))
        errors.push(`${where}: ${key} must be a number`);
    }
  }
  return errors;
}
