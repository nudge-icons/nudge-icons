import { describe, expect, it } from "vitest";
import { checkMotion, iconCss, PRESETS, type Motion } from "./motion.ts";

const every: Motion[] = [
  { part: "a", preset: "swing", origin: [12, 3], angle: 12 },
  { part: "b", preset: "nudge", y: 2 },
  { part: "c", preset: "draw" },
  { part: "d", preset: "spin", angle: 90 },
  { part: "e", preset: "pulse", scale: 1.2, beats: 2 },
  { part: "f", preset: "shake", x: 1 },
  { part: "g", preset: "bounce", y: 2 },
  { part: "h", preset: "pass", y: 5 },
];

/** Splits CSS into [selector, body] pairs, looking inside @media and skipping @keyframes. */
function rules(css: string): [string, string][] {
  const out: [string, string][] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  const flat = css
    .replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*\}/g, "")
    .replace(/@media[^{]+\{/g, "");
  for (const [, selector = "", body = ""] of flat.matchAll(re)) out.push([selector.trim(), body]);
  return out;
}

describe("iconCss", () => {
  const css = iconCss("demo", every, ["slash"]);

  it("covers every preset", () => {
    expect(PRESETS.sort()).toEqual(every.map((m) => m.preset).sort());
  });

  it("wraps every selector in :where() so users can always override it", () => {
    const selectors = rules(css).map(([s]) => s);
    expect(selectors.length).toBeGreaterThan(10);
    for (const s of selectors) expect(s).toMatch(/^:where\(.*\)$/);
  });

  it("never sets colour or stroke width", () => {
    const declared = rules(css)
      .flatMap(([, body]) => body.split(";"))
      .map((d) => d.split(":")[0]?.trim())
      .filter(Boolean);
    for (const prop of ["color", "fill", "stroke", "stroke-width"]) {
      expect(declared).not.toContain(prop);
    }
  });

  it("plays on hover of the icon or an interactive parent, once, and in a loop", () => {
    expect(css).toContain(':is(:hover,:focus-visible) .nudge-demo[data-animate="hover"]');
    // The icon itself can be focusable (tabIndex, role="button").
    expect(css).toContain(
      '.nudge-demo[data-animate="hover"]:is(:hover,:focus-visible) [data-part="a"]',
    );
    expect(css).toContain('.nudge-demo[data-animate="once"] [data-part="a"]');
    expect(css).toMatch(/\.nudge-demo\[data-animate="loop"\] \[data-part="a"\]\)\{animation:/);
  });

  it("repeats a loop --nudge-repeat times, forever by default", () => {
    expect(css).toMatch(
      /\[data-animate="loop"\] \[data-part="a"\]\)\{animation:[^}]*var\(--nudge-repeat,infinite\)/,
    );
  });

  it("uses the CSS variables for duration and easing", () => {
    expect(css).toContain("var(--nudge-duration,900ms)");
    expect(css).toContain("var(--nudge-easing,");
  });

  it("turns every animation off for reduced motion, after the other rules", () => {
    expect(
      css.endsWith("@media (prefers-reduced-motion:reduce){:where(.nudge-demo *){animation:none}}"),
    ).toBe(true);
  });

  it("hides active-only parts until data-active", () => {
    expect(css).toContain(':where(.nudge-demo:not([data-active]) [data-part="slash"]){opacity:0}');
  });

  it("returns nothing for an icon without motion or toggle", () => {
    expect(iconCss("plain")).toBe("");
  });
});

describe("checkMotion", () => {
  it("accepts valid motion", () => {
    expect(checkMotion(every, ["a", "b", "c", "d", "e", "f", "g", "h"])).toEqual([]);
  });

  it("reports malformed entries instead of crashing", () => {
    expect(checkMotion([null, 3], ["a"])).toEqual([
      "animation.motion[0] must be an object",
      "animation.motion[1] must be an object",
    ]);
  });

  it("allows only one or two beats", () => {
    expect(checkMotion([{ part: "a", preset: "pulse", scale: 1.2, beats: 99 }], ["a"])).toContain(
      'motion for "a": beats must be 1 or 2',
    );
  });

  it("rejects unknown parts, presets, duplicates and missing parameters", () => {
    const errors = checkMotion(
      [
        { part: "x", preset: "draw" },
        { part: "a", preset: "wobble" },
        { part: "b", preset: "swing" },
        { part: "b", preset: "draw" },
      ],
      ["a", "b"],
    );
    expect(errors).toContain('motion for "x": part must be one of animation.parts');
    expect(errors.some((e) => e.includes("preset must be one of"))).toBe(true);
    expect(errors).toContain('motion for "b": swing needs origin');
    expect(errors).toContain('motion for "b": a part can have only one motion');
  });
});
