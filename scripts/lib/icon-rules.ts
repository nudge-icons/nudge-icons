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
  category: "actions" | "interface" | "status";
  tags: string[];
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
}

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

/** End points of every path segment in absolute coordinates. Control points are ignored. */
export function pathPoints(d: string): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  let x = 0;
  let y = 0;
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
      continue;
    }
    for (let i = 0; i + n <= args.length; i += n) {
      const a = args.slice(i, i + n);
      const at = (k: number) => a[k] ?? 0;
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

function elementPoints(el: Element): Array<[number, number]> {
  const n = (k: string) => Number(el.attrs[k] ?? 0);
  switch (el.tag) {
    case "path":
      return pathPoints(el.attrs.d ?? "");
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
export function checkIcon(name: string, svg: string, meta: unknown): string[] {
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
  for (const el of children) {
    if (!SHAPES.has(el.tag)) {
      errors.push(`<${el.tag}> is not allowed`);
      continue;
    }
    const allowed = CHILD_ATTRS[el.tag] ?? [];
    for (const [k, v] of Object.entries(el.attrs)) {
      if (k === "data-part") {
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
          `<${el.tag}> point (${x}, ${y}) is outside the ${SAFE_MIN}–${SAFE_MAX} safe area`,
        );
      }
    }
  }

  errors.push(...checkMeta(name, meta, parts));
  return errors;
}

function checkMeta(name: string, meta: unknown, parts: Set<string>): string[] {
  const m = meta as Partial<IconMeta> | null;
  if (!m || typeof m !== "object") return ["metadata must be a JSON object"];
  const errors: string[] = [];
  if (m.name !== name) errors.push(`metadata name "${String(m.name)}" must match the file name`);
  if (!["actions", "interface", "status"].includes(m.category as string)) {
    errors.push("metadata category must be actions, interface or status");
  }
  if (!Array.isArray(m.tags) || m.tags.length < 2) errors.push("metadata needs at least 2 tags");
  const a = m.animation;
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
