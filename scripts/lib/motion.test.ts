import { describe, expect, it } from "vitest";
import { baseCss, checkMotion, iconCss, PRESETS, type Motion } from "./motion.ts";

const every: Motion[] = [
  { part: "a", preset: "swing", origin: [12, 3], angle: 12 },
  { part: "b", preset: "nudge", y: 2 },
  { part: "c", preset: "draw" },
  { part: "d", preset: "spin", angle: 90 },
  { part: "e", preset: "pulse", scale: 1.2, beats: 2 },
  { part: "f", preset: "shake", x: 1 },
  { part: "g", preset: "bounce", y: 2 },
  { part: "h", preset: "pass", y: 5 },
  { part: "i", preset: "orbit", r: 1.5 },
  { part: "j", preset: "flash" },
  { part: "k", preset: "revolve", rx: 4, radius: 9 },
  { part: "l", preset: "blink", to: "M2 13h20" },
  { part: "m", preset: "look", x: 2, blink: true },
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

describe("baseCss", () => {
  const css = baseCss();

  it("wraps every selector in :where() so users can always override it", () => {
    for (const [selector] of rules(css)) expect(selector).toMatch(/^:where\(.*\)$/);
  });

  it("plays parts on hover or focus of the icon or an interactive parent, and once", () => {
    expect(css).toContain(".nudge-icon[data-animate=hover]:is(:hover,:focus-visible) [data-part]");
    expect(css).toContain(":is(:hover,:focus-visible) .nudge-icon[data-animate=hover] [data-part]");
    expect(css).toContain(".nudge-icon[data-animate=once] [data-part]");
  });

  it("repeats a loop --nudge-repeat times, forever by default", () => {
    expect(css).toMatch(
      /\[data-animate=loop\] \[data-part\]\)\{animation:[^}]*var\(--nudge-repeat,infinite\)/,
    );
  });

  it("ends hover and once after the motion share, so nothing stays animated", () => {
    expect(css).toContain("var(--nudge-w,0s) var(--nudge-s,1) backwards}");
    expect(css).not.toContain(" both}");
  });

  it("lets users override duration and easing", () => {
    expect(css).toContain("var(--nudge-duration,var(--nudge-t))");
    expect(css).toContain("var(--nudge-easing,var(--nudge-f))");
  });

  it("turns every animation off for reduced motion, after the other rules", () => {
    expect(
      css.endsWith(
        "@media (prefers-reduced-motion:reduce){:where(.nudge-icon *){animation:none;transition:none}}",
      ),
    ).toBe(true);
  });
});

describe("iconCss", () => {
  const css = iconCss("demo", every, ["slash"], [], { l: "M2 12h20" });

  it("covers every preset", () => {
    expect(PRESETS.sort()).toEqual(every.map((m) => m.preset).sort());
  });

  it("wraps every selector in :where() so users can always override it", () => {
    const selectors = rules(css).map(([s]) => s);
    expect(selectors).toHaveLength(every.length + 1);
    for (const s of selectors) expect(s).toMatch(/^:where\(.*\)$/);
  });

  it("never sets colour or stroke width", () => {
    const declared = [...rules(css), ...rules(baseCss())]
      .flatMap(([, body]) => body.split(";"))
      .map((d) => d.split(":")[0]?.trim())
      .filter(Boolean);
    for (const prop of ["color", "fill", "stroke", "stroke-width"]) {
      expect(declared).not.toContain(prop);
    }
  });

  it("gives each moving part its keyframes, cycle length, easing and delay", () => {
    expect(css).toContain("@keyframes nudge-demo-a{");
    expect(css).toContain(
      ':where(.nudge-demo [data-part="a"]){--nudge-k:nudge-demo-a;--nudge-t:1620ms;--nudge-f:ease-in-out;--nudge-s:0.556;transform-box:view-box;transform-origin:12px 3px}',
    );
    expect(iconCss("d", [{ part: "p", preset: "draw", delay: 60 }])).toContain("--nudge-w:60ms");
    // A continuous spin does not rest and runs linear in a loop.
    expect(iconCss("s", [{ part: "p", preset: "spin" }])).toContain("--nudge-t:700ms;--nudge-f:");
    expect(iconCss("s", [{ part: "p", preset: "spin" }])).toContain("--nudge-lf:linear");
  });

  it("puts the rest after the motion and merges identical steps", () => {
    expect(css).toContain("@keyframes nudge-demo-a{0%,55.56%,100%{transform:none}");
  });

  it("hides active-only parts until data-active", () => {
    expect(css).toContain(':where(.nudge-demo:not([data-active]) [data-part="slash"]){opacity:0}');
  });

  it("adds a morph to the active state and transitions d", () => {
    const morphed = iconCss(
      "lock",
      [],
      [],
      [{ part: "shackle", preset: "trim", length: 30, offset: -3.5, morph: "M16 9V6" }],
    );
    expect(morphed).toContain(
      ':where(.nudge-lock[data-active] [data-part="shackle"]){stroke-dashoffset:-3.5;d:path("M16 9V6")}',
    );
    expect(baseCss()).toContain(",d var(--nudge-toggle-duration");
  });

  it("blinks by morphing the part's own path to the target and back", () => {
    expect(css).toContain(
      '@keyframes nudge-demo-l{0%,12.14%,71.43%,100%{d:path("M2 12h20")}5%,7.14%{d:path("M2 13h20")}}',
    );
  });

  it("plays a bump once when the icon becomes active, except with reduced motion", () => {
    const css = iconCss("copy", [], [], [{ part: "front", preset: "bump", x: -1, y: -1 }]);
    expect(css).toMatch(
      /^@media \(prefers-reduced-motion:no-preference\)\{@keyframes nudge-copy-front-on\{/,
    );
    expect(css).toContain(
      ':where(.nudge-copy[data-active] [data-part="front"]){animation:nudge-copy-front-on .5s ease-out backwards}',
    );
  });

  it("returns nothing for an icon without motion or toggle", () => {
    expect(iconCss("plain")).toBe("");
  });
});

describe("checkMotion", () => {
  it("accepts valid motion", () => {
    expect(
      checkMotion(every, ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"]),
    ).toEqual([]);
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
