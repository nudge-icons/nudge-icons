import { describe, expect, it } from "vitest";
import {
  baseCss,
  checkMotion,
  checkToggleMotion,
  iconCss,
  PRESETS,
  type Motion,
} from "./motion.ts";

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
  { part: "n", preset: "fold", origin: [4.5, 20], skew: 17.7, scale: 1.22 },
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

  it("hides motion-only parts at rest", () => {
    const globe = iconCss(
      "globe",
      [{ part: "back", preset: "revolve", rx: 4, radius: 9, offset: 90 }],
      [],
      [],
      {},
      ["back"],
    );
    expect(globe).toContain(':where(.nudge-globe [data-part="back"]){opacity:0}');
  });

  it("fades a revolving meridian out near the edge and keeps a second one inside", () => {
    const frames = (offset: number) =>
      [
        ...iconCss("g", [{ part: "m", preset: "revolve", rx: 4, radius: 9, offset }]).matchAll(
          /rx:([\d.]+)px;opacity:([\d.]+)/g,
        ),
      ].map(([, rx, opacity]) => ({ rx: Number(rx), opacity: Number(opacity) }));
    const front = frames(0);
    const back = frames(90);
    // Never drawn on the outline of the sphere.
    for (const f of [...front, ...back]) if (f.rx > 6.9) expect(f.opacity).toBe(0);
    // At rest the first meridian shows and the second is gone.
    expect(front[0]).toEqual({ rx: 4, opacity: 1 });
    expect(back[0]?.opacity).toBe(0);
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
      checkMotion(every, ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n"]),
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

describe("fold", () => {
  it("leans and stretches the part from its hinge, then returns", () => {
    const css = iconCss("folder-open", [
      { part: "front", preset: "fold", origin: [4.5, 20], skew: 17.7, scale: 1.22 },
    ]);
    expect(css).toContain("transform:skewX(17.7deg) scaleY(1.22)");
    expect(css).toContain("transform-origin:4.5px 20px");
  });

  it("needs a hinge, a lean and a stretch", () => {
    const errors = checkMotion([{ part: "a", preset: "fold" }], ["a"]);
    expect(errors).toContain('motion for "a": fold needs origin');
    expect(errors).toContain('motion for "a": fold needs skew');
    expect(errors).toContain('motion for "a": fold needs scale');
  });
});

describe("draw", () => {
  it("hides the part until it starts drawing, so no round-cap dot shows while it waits", () => {
    const css = iconCss("wifi", [{ part: "outer", preset: "draw", delay: 600 }]);
    expect(css).toMatch(/0%\{[^}]*stroke-dashoffset:1;opacity:0/);
  });
});

describe("morph toggle", () => {
  const toggle = [
    { part: "half", preset: "morph" as const, morph: "M9.5 4L5.5 4L5.5 20L9.5 20L9.5 4" },
    { part: "bar", preset: "draw" as const, fallback: true },
  ];
  const css = iconCss("play", [], ["bar"], toggle);

  it("morphs where the browser can animate paths, and fades the part elsewhere", () => {
    expect(css).toContain(
      '@supports (d:path("M0 0")){:where(.nudge-play[data-active] [data-part="half"]){d:path("M9.5 4L5.5 4L5.5 20L9.5 20L9.5 4")}}',
    );
    expect(css).toContain(
      '@supports not (d:path("M0 0")){:where(.nudge-play[data-active] [data-part="half"]){opacity:0}}',
    );
  });

  it("draws a fallback part in only where the morph cannot play", () => {
    expect(css).toContain(
      ':where(.nudge-play [data-part="bar"]){opacity:0;stroke-dasharray:1 1;stroke-dashoffset:1}',
    );
    expect(css).toContain(
      '@supports not (d:path("M0 0")){:where(.nudge-play[data-active] [data-part="bar"]){opacity:1;stroke-dashoffset:0}}',
    );
  });

  it("needs a path, and allows fallback only on draw", () => {
    expect(checkToggleMotion([{ part: "a", preset: "morph" }], ["a"])).toContain(
      'toggle motion for "a": morph needs the part\'s path in the active state',
    );
    expect(checkToggleMotion([{ part: "a", preset: "hide", fallback: true }], ["a"])).toContain(
      'toggle motion for "a": fallback is true or false, and only for draw',
    );
  });
});
