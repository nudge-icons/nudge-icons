// Drawing rules for source icons in icons/. See CONTRIBUTING.md, "Drawing rules".

export const CANVAS = 24;
export const SAFE_MIN = 2;
export const SAFE_MAX = 22;
export const GRID = 0.5;

const ROOT_ATTRS: Record<string, string> = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};

const SHAPES = new Set(["path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "g"]);

// Attributes a child element may carry. Paint and stroke come from the root only.
const CHILD_ATTRS: Record<string, string[]> = {
  path: ["d"],
  circle: ["cx", "cy", "r"],
  ellipse: ["cx", "cy", "rx", "ry"],
  rect: ["x", "y", "width", "height", "rx", "ry"],
  line: ["x1", "y1", "x2", "y2"],
  polyline: ["points"],
  polygon: ["points"],
  g: [],
};

export interface IconMeta {
  name: string;
  category: "actions" | "interface" | "status" | "objects";
  tags: string[];
  /**
   * The closest icon in other sets, by each set's own icon id (file name), not its
   * component name: `{ "lucide": ["triangle-alert"], "material": ["warning"] }`.
   * Feeds the migration tables in the docs and llms.txt.
   */
  equivalents?: Partial<Record<IconSet, string[]>>;
  /** Motion played by `animate`: the icon moves and returns to its resting drawing. */
  animation: { name: string; description: string; parts: string[] };
  /** Optional second state shown by `active`. */
  toggle?: {
    description: string;
    /** Parts that change between the two states. */
    parts: string[];
    /** Parts drawn only in the active state. Hidden by default and dropped from `/static`. */
    activeOnly?: string[];
  };
  /**
   * Present when icons/filled/<name>.svg exists. The filled icon reuses `animation`
   * and `toggle` unless it overrides `animation`, for example when a detail becomes a hole.
   */
  filled?: VariantMeta;
  /** Present when icons/half/<name>.svg exists: the left half is filled, for ratings. */
  half?: VariantMeta;
}

/** Icon sets we map to in `equivalents`. */
export const ICON_SETS = ["lucide", "heroicons", "tabler", "phosphor", "material"] as const;
export type IconSet = (typeof ICON_SETS)[number];

export interface VariantMeta {
  animation?: IconMeta["animation"];
}

/** Painted variants live in icons/<variant>/<name>.svg and may fill their shapes. */
export const PAINTED_VARIANTS = ["filled", "half"] as const;
export type Variant = "outline" | (typeof PAINTED_VARIANTS)[number];

export interface Element {
  tag: string;
  attrs: Record<string, string>;
}

/** Parses the flat, hand-controlled SVG we keep in icons/. Not a general XML parser. */
export function parseSvg(svg: string): Element[] {
  const elements: Element[] = [];
  const tagRe = /<([a-zA-Z]+)((?:\s+[\w:-]+="[^"]*")*)\s*\/?>/g;
  for (const m of svg.matchAll(tagRe)) {
    const attrs: Record<string, string> = {};
    for (const [, key = "", value = ""] of (m[2] ?? "").matchAll(/([\w:-]+)="([^"]*)"/g))
      attrs[key] = value;
    elements.push({ tag: m[1] ?? "", attrs });
  }
  return elements;
}

const numbers = (s: string) => (s.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
const onGrid = (n: number) => Math.abs(n / GRID - Math.round(n / GRID)) < 1e-9;

/**
 * End points of every path segment in absolute coordinates. With `extremes`, also adds
 * the extreme points of arcs and the control points of curves: a Bézier curve stays inside
 * the hull of its control points, so this bounds everything the path draws.
 */
export function pathPoints(d: string, extremes = false): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  let x = 0;
  let y = 0;
  // Last cubic / quadratic control point, for the reflected control of S and T.
  let lastC: [number, number] | null = null;
  let lastQ: [number, number] | null = null;
  let startX = 0;
  let startY = 0;
  const arity: Record<string, number> = {
    m: 2,
    l: 2,
    h: 1,
    v: 1,
    c: 6,
    s: 4,
    q: 4,
    t: 2,
    a: 7,
    z: 0,
  };
  for (const seg of d.match(/[a-zA-Z][^a-zA-Z]*/g) ?? []) {
    const cmd = seg.charAt(0);
    const lower = cmd.toLowerCase();
    const rel = cmd === lower;
    const args = numbers(seg.slice(1));
    const n = arity[lower];
    if (n === undefined) throw new Error(`Unknown path command "${cmd}"`);
    if (n === 0) {
      x = startX;
      y = startY;
      lastC = lastQ = null;
      continue;
    }
    for (let i = 0; i + n <= args.length; i += n) {
      const a = args.slice(i, i + n);
      const at = (k: number) => a[k] ?? 0;
      const abs = (k: number): [number, number] => [
        (rel ? x : 0) + at(k),
        (rel ? y : 0) + at(k + 1),
      ];
      const reflect = (c: [number, number] | null): [number, number] =>
        c ? [2 * x - c[0], 2 * y - c[1]] : [x, y];
      let nextC: [number, number] | null = null;
      let nextQ: [number, number] | null = null;
      if (lower === "c") {
        nextC = abs(2);
        if (extremes) points.push(abs(0), nextC);
      } else if (lower === "s") {
        nextC = abs(0);
        if (extremes) points.push(reflect(lastC), nextC);
      } else if (lower === "q") {
        nextQ = abs(0);
        if (extremes) points.push(nextQ);
      } else if (lower === "t") {
        nextQ = reflect(lastQ);
        if (extremes) points.push(nextQ);
      } else if (lower === "a" && extremes) {
        const [ex, ey] = abs(5);
        points.push(...arcExtremes(x, y, at(0), at(1), at(3) !== 0, at(4) !== 0, ex, ey));
      }
      lastC = nextC;
      lastQ = nextQ;
      if (lower === "h") x = (rel ? x : 0) + at(0);
      else if (lower === "v") y = (rel ? y : 0) + at(0);
      else {
        x = (rel ? x : 0) + at(n - 2);
        y = (rel ? y : 0) + at(n - 1);
      }
      // Pairs after the first in an M command are implicit line-tos.
      if (lower === "m" && i === 0) {
        startX = x;
        startY = y;
      }
      points.push([x, y]);
    }
  }
  return points;
}

/** Points where an arc reaches its left, right, top and bottom. Ignores x-axis rotation. */
function arcExtremes(
  x1: number,
  y1: number,
  rxIn: number,
  ryIn: number,
  large: boolean,
  sweep: boolean,
  x2: number,
  y2: number,
): Array<[number, number]> {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (!rx || !ry || (x1 === x2 && y1 === y2)) return [];
  const hx = (x1 - x2) / 2;
  const hy = (y1 - y2) / 2;
  const scale = (hx * hx) / (rx * rx) + (hy * hy) / (ry * ry);
  if (scale > 1) {
    rx *= Math.sqrt(scale);
    ry *= Math.sqrt(scale);
  }
  const num = rx * rx * ry * ry - rx * rx * hy * hy - ry * ry * hx * hx;
  const den = rx * rx * hy * hy + ry * ry * hx * hx;
  const coef = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cx = (coef * rx * hy) / ry + (x1 + x2) / 2;
  const cy = (-coef * ry * hx) / rx + (y1 + y2) / 2;
  const start = Math.atan2((y1 - cy) / ry, (x1 - cx) / rx);
  let delta = Math.atan2((y2 - cy) / ry, (x2 - cx) / rx) - start;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  const out: Array<[number, number]> = [];
  for (let k = 0; k < 4; k++) {
    const angle = (k * Math.PI) / 2;
    // Distance from the start angle to this angle, measured in the sweep direction.
    let t = sweep ? angle - start : start - angle;
    t = ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (t <= Math.abs(delta)) out.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
  }
  return out;
}

function elementPoints(el: Element): Array<[number, number]> {
  const n = (k: string) => Number(el.attrs[k] ?? 0);
  switch (el.tag) {
    case "path":
      return pathPoints(el.attrs.d ?? "", true);
    case "circle":
      return [
        [n("cx") - n("r"), n("cy") - n("r")],
        [n("cx") + n("r"), n("cy") + n("r")],
      ];
    case "ellipse":
      return [
        [n("cx") - n("rx"), n("cy") - n("ry")],
        [n("cx") + n("rx"), n("cy") + n("ry")],
      ];
    case "rect":
      return [
        [n("x"), n("y")],
        [n("x") + n("width"), n("y") + n("height")],
      ];
    case "line":
      return [
        [n("x1"), n("y1")],
        [n("x2"), n("y2")],
      ];
    case "polyline":
    case "polygon": {
      const v = numbers(el.attrs.points ?? "");
      const out: Array<[number, number]> = [];
      for (let i = 0; i + 1 < v.length; i += 2) out.push([v[i] ?? 0, v[i + 1] ?? 0]);
      return out;
    }
    default:
      return [];
  }
}

/** Returns a list of rule violations; an empty list means the icon is valid. */
export function checkIcon(
  name: string,
  svg: string,
  meta: unknown,
  variant: Variant = "outline",
): string[] {
  const errors: string[] = [];
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) errors.push(`name "${name}" is not kebab-case`);

  const [root, ...children] = parseSvg(svg);
  if (root?.tag !== "svg") return [...errors, "file must start with an <svg> element"];
  for (const [k, v] of Object.entries(ROOT_ATTRS)) {
    if (root.attrs[k] !== v) errors.push(`<svg> must have ${k}="${v}"`);
  }
  const extraRoot = Object.keys(root.attrs).filter((k) => !(k in ROOT_ATTRS));
  if (extraRoot.length) errors.push(`<svg> has unexpected attributes: ${extraRoot.join(", ")}`);
  if (!children.length) errors.push("icon has no shapes");

  const parts = new Set<string>();
  let hasFill = false;
  for (const el of children) {
    if (!SHAPES.has(el.tag)) {
      errors.push(`<${el.tag}> is not allowed`);
      continue;
    }
    const allowed = CHILD_ATTRS[el.tag] ?? [];
    for (const [k, v] of Object.entries(el.attrs)) {
      if (variant !== "outline" && k === "fill") {
        if (v !== "currentColor") errors.push(`<${el.tag}> fill must be "currentColor"`);
        hasFill = true;
      } else if (variant !== "outline" && k === "fill-rule") {
        if (v !== "evenodd") errors.push(`<${el.tag}> fill-rule must be "evenodd"`);
      } else if (k === "data-part") {
        if (!/^[a-z]+(-[a-z]+)*$/.test(v)) errors.push(`data-part "${v}" is not kebab-case`);
        parts.add(v);
      } else if (!allowed.includes(k)) {
        errors.push(`<${el.tag}> must not have "${k}": paint and stroke come from the root`);
      } else if (k !== "d" && k !== "points" && !onGrid(Number(v))) {
        errors.push(`<${el.tag}> ${k}="${v}" is off the ${GRID}px grid`);
      }
    }
    for (const value of [el.attrs.d, el.attrs.points]) {
      for (const num of value ? numbers(value) : []) {
        if (!onGrid(num)) errors.push(`<${el.tag}> number ${num} is off the ${GRID}px grid`);
      }
    }
    for (const [x, y] of elementPoints(el)) {
      if (x < SAFE_MIN || x > SAFE_MAX || y < SAFE_MIN || y > SAFE_MAX) {
        errors.push(
          `<${el.tag}> point (${+x.toFixed(2)}, ${+y.toFixed(2)}) is outside the ${SAFE_MIN}–${SAFE_MAX} safe area`,
        );
      }
    }
  }

  if (variant !== "outline" && !hasFill) {
    errors.push(`${variant} icon needs at least one element with fill="currentColor"`);
  }
  errors.push(...checkMeta(name, meta, parts, variant));
  return errors;
}

function checkMeta(name: string, meta: unknown, parts: Set<string>, variant: Variant): string[] {
  const m = meta as Partial<IconMeta> | null;
  if (!m || typeof m !== "object") return ["metadata must be a JSON object"];
  const errors: string[] = [];
  if (m.name !== name) errors.push(`metadata name "${String(m.name)}" must match the file name`);
  if (!["actions", "interface", "status", "objects"].includes(m.category as string)) {
    errors.push("metadata category must be actions, interface, status or objects");
  }
  if (!Array.isArray(m.tags) || m.tags.length < 2) errors.push("metadata needs at least 2 tags");
  errors.push(...checkEquivalents(m.equivalents));
  const own = variant === "outline" ? undefined : m[variant];
  if (variant !== "outline" && (typeof own !== "object" || own === null)) {
    errors.push(`metadata needs a ${variant} block when icons/${variant}/<name>.svg exists`);
  }
  const a = own?.animation ?? m.animation;
  if (!a || typeof a.name !== "string" || typeof a.description !== "string") {
    errors.push("metadata animation needs a name and a description");
  } else {
    for (const p of a.parts ?? []) {
      if (!parts.has(p)) errors.push(`animation part "${p}" has no element with data-part="${p}"`);
    }
  }
  errors.push(...checkToggle(m.toggle, parts, a?.parts ?? []));
  return errors;
}

function checkEquivalents(eq: unknown): string[] {
  if (eq === undefined) return [];
  if (typeof eq !== "object" || eq === null || Array.isArray(eq)) {
    return ["metadata equivalents must be an object of icon set to icon ids"];
  }
  const errors: string[] = [];
  for (const [set, ids] of Object.entries(eq)) {
    if (!(ICON_SETS as readonly string[]).includes(set)) {
      errors.push(`equivalents set "${set}" is not one of ${ICON_SETS.join(", ")}`);
    } else if (
      !Array.isArray(ids) ||
      !ids.length ||
      !ids.every((id) => typeof id === "string" && /^[a-z0-9]+([-_][a-z0-9]+)*$/.test(id))
    ) {
      errors.push(`equivalents.${set} must be a non-empty list of icon ids like "triangle-alert"`);
    }
  }
  return errors;
}

function checkToggle(t: IconMeta["toggle"] | undefined, parts: Set<string>, motion: string[]) {
  if (t === undefined) return [];
  if (typeof t !== "object" || typeof t.description !== "string" || !Array.isArray(t.parts)) {
    return ["metadata toggle needs a description and parts"];
  }
  const errors: string[] = [];
  if (!t.parts.length) errors.push("metadata toggle needs at least 1 part");
  for (const p of t.parts) {
    if (!parts.has(p)) errors.push(`toggle part "${p}" has no element with data-part="${p}"`);
  }
  for (const p of t.activeOnly ?? []) {
    if (!t.parts.includes(p)) errors.push(`toggle activeOnly part "${p}" must be in toggle parts`);
    if (motion.includes(p)) errors.push(`animation must not move the active-only part "${p}"`);
  }
  return errors;
}
