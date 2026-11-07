import { describe, expect, it } from "vitest";
import { checkIcon, pathPoints } from "./icon-rules.ts";

const root =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const svg = (body: string) => `${root}\n  ${body}\n</svg>\n`;
const meta = (parts: string[] = []) => ({
  name: "dot",
  category: "status",
  tags: ["dot", "point"],
  animation: {
    name: "pulse",
    description: "Pulses",
    parts,
    motion: parts.map((part) => ({ part, preset: "pulse" as const, scale: 1.1 })),
  },
});

describe("pathPoints", () => {
  it("tracks absolute and relative end points", () => {
    expect(pathPoints("M4 12l5 5L20 6")).toEqual([
      [4, 12],
      [9, 17],
      [20, 6],
    ]);
  });

  it("handles H, V, arcs and closepath", () => {
    expect(pathPoints("M3 3h4v4a2 2 0 0 1-4 0z")).toEqual([
      [3, 3],
      [7, 3],
      [7, 7],
      [3, 7],
    ]);
  });
});

describe("pathPoints with extremes", () => {
  it("adds the lowest point of an arc between its end points", () => {
    expect(pathPoints("M10 20a2 2 0 0 0 4 0", true)).toContainEqual([12, 22]);
  });

  it("adds control points of curves", () => {
    expect(pathPoints("M4 12c0 6 8 8 8 8", true)).toContainEqual([4, 18]);
  });
});

describe("checkIcon", () => {
  it("accepts a valid icon", () => {
    expect(
      checkIcon("dot", svg('<circle data-part="core" cx="12" cy="12" r="4"/>'), meta(["core"])),
    ).toEqual([]);
  });

  it("rejects paint on child elements", () => {
    const errors = checkIcon("dot", svg('<circle cx="12" cy="12" r="4" fill="red"/>'), meta());
    expect(errors).toContain('<circle> must not have "fill": paint and stroke come from the root');
  });

  it("rejects numbers off the grid", () => {
    const errors = checkIcon("dot", svg('<path d="M4.3 12h10"/>'), meta());
    expect(errors).toContain("<path> number 4.3 is off the 0.5px grid");
  });

  it("rejects shapes outside the safe area", () => {
    const errors = checkIcon("dot", svg('<circle cx="12" cy="12" r="11"/>'), meta());
    expect(errors.some((e) => e.includes("outside the 2–22 safe area"))).toBe(true);
  });

  it("rejects an arc that bulges out of the safe area", () => {
    const errors = checkIcon("dot", svg('<path d="M10 20.5a2 2 0 0 0 4 0"/>'), meta());
    expect(errors).toContain("<path> point (12, 22.5) is outside the 2–22 safe area");
  });

  it("rejects a wrong root stroke width", () => {
    const errors = checkIcon(
      "dot",
      svg('<circle cx="12" cy="12" r="4"/>').replace('stroke-width="2"', 'stroke-width="1.5"'),
      meta(),
    );
    expect(errors).toContain('<svg> must have stroke-width="2"');
  });

  it("requires animated parts to exist", () => {
    const errors = checkIcon("dot", svg('<circle cx="12" cy="12" r="4"/>'), meta(["core"]));
    expect(errors).toContain('animation part "core" has no element with data-part="core"');
  });

  it("accepts equivalents in known icon sets", () => {
    const errors = checkIcon("dot", svg('<circle data-part="core" cx="12" cy="12" r="4"/>'), {
      ...meta(["core"]),
      equivalents: { lucide: ["circle-dot"], material: ["radio_button_checked"] },
    });
    expect(errors).toEqual([]);
  });

  it("rejects equivalents in unknown sets or with bad ids", () => {
    const errors = checkIcon("dot", svg('<circle cx="12" cy="12" r="4"/>'), {
      ...meta(),
      equivalents: { feather: ["circle"], lucide: ["CircleDot"] },
    });
    expect(errors).toContain(
      'equivalents set "feather" is not one of lucide, heroicons, tabler, phosphor, material',
    );
    expect(errors).toContain(
      'equivalents.lucide must be a non-empty list of icon ids like "triangle-alert"',
    );
  });

  it("requires every icon to move and every toggle part to change", () => {
    const still = { ...meta(), animation: { name: "x", description: "x", parts: [] } };
    expect(checkIcon("dot", svg('<circle cx="12" cy="12" r="4"/>'), still)).toContain(
      "metadata animation needs motion (see the presets in motion.ts)",
    );
    const errors = checkIcon("dot", svg('<path data-part="slash" d="M4 4l16 16"/>'), {
      ...meta(),
      toggle: { description: "Hides", parts: ["slash"] },
    });
    expect(errors).toContain("toggle.motion must list how each toggle part changes");
  });

  it("checks that a morph keeps the path's commands and stays in bounds", () => {
    const shackle = svg('<path data-part="shackle" d="M16 10.5V7.5a4 4 0 0 0-8 0v3"/>');
    const toggle = (morph: string) => ({
      ...meta(["shackle"]),
      toggle: {
        description: "Opens",
        parts: ["shackle"],
        motion: [{ part: "shackle", preset: "trim" as const, length: 30, offset: -3.5, morph }],
      },
    });
    expect(checkIcon("dot", shackle, toggle("M16 9V6a4 4 0 0 0-8 0v4.5"))).toEqual([]);
    expect(checkIcon("dot", shackle, toggle("M16 9L16 6a4 4 0 0 0-8 0v4.5"))).toContain(
      'toggle morph for "shackle": must use the same commands as the source path to morph smoothly',
    );
    expect(
      checkIcon("dot", shackle, toggle("M16 6V3a4 4 0 0 0-8 0v4.5")).some((e) =>
        e.includes("outside the safe area"),
      ),
    ).toBe(true);
  });

  it("requires metadata to match the file name", () => {
    const errors = checkIcon("dot", svg('<circle cx="12" cy="12" r="4"/>'), {
      ...meta(),
      name: "ring",
    });
    expect(errors).toContain('metadata name "ring" must match the file name');
  });

  it("accepts a toggle with an active-only part", () => {
    const errors = checkIcon(
      "dot",
      svg(
        '<circle data-part="core" cx="12" cy="12" r="4"/>\n  <path data-part="slash" d="M4 4l16 16"/>',
      ),
      {
        ...meta(["core"]),
        toggle: {
          description: "Hides",
          parts: ["slash"],
          activeOnly: ["slash"],
          motion: [{ part: "slash", preset: "draw" as const }],
        },
      },
    );
    expect(errors).toEqual([]);
  });

  it("requires toggle parts to exist", () => {
    const errors = checkIcon("dot", svg('<circle cx="12" cy="12" r="4"/>'), {
      ...meta(),
      toggle: { description: "Hides", parts: ["slash"] },
    });
    expect(errors).toContain('toggle part "slash" has no element with data-part="slash"');
  });

  it("keeps active-only parts out of the motion animation", () => {
    const errors = checkIcon("dot", svg('<path data-part="slash" d="M4 4l16 16"/>'), {
      ...meta(["slash"]),
      toggle: { description: "Hides", parts: ["slash"], activeOnly: ["slash"] },
    });
    expect(errors).toContain('animation must not move the active-only part "slash"');
  });

  it("accepts a motion-only part that revolves", () => {
    const errors = checkIcon(
      "dot",
      svg(
        '<circle data-part="core" cx="12" cy="12" r="9"/>\n  <ellipse data-part="back" cx="12" cy="12" rx="8" ry="9"/>',
      ),
      {
        ...meta(["core"]),
        animation: {
          name: "revolve",
          description: "Turns",
          parts: ["core", "back"],
          motionOnly: ["back"],
          motion: [
            { part: "core", preset: "pulse" as const, scale: 1.1 },
            { part: "back", preset: "revolve" as const, rx: 4, radius: 9, offset: 90 },
          ],
        },
      },
    );
    expect(errors).toEqual([]);
  });

  it("rejects a motion-only part whose motion cannot bring it in", () => {
    const errors = checkIcon("dot", svg('<circle data-part="core" cx="12" cy="12" r="4"/>'), {
      ...meta(["core"]),
      animation: { ...meta(["core"]).animation, motionOnly: ["core"] },
    });
    expect(errors).toContain(
      'motionOnly part "core" needs a motion that sets its opacity (revolve)',
    );
  });

  it("accepts fill on children of a filled icon", () => {
    const errors = checkIcon(
      "dot",
      svg('<circle data-part="core" fill="currentColor" cx="12" cy="12" r="4"/>'),
      { ...meta(["core"]), filled: {} },
      "filled",
    );
    expect(errors).toEqual([]);
  });

  it("rejects fill on children of an outline icon", () => {
    const errors = checkIcon(
      "dot",
      svg('<circle fill="currentColor" cx="12" cy="12" r="4"/>'),
      meta(),
    );
    expect(errors).toContain('<circle> must not have "fill": paint and stroke come from the root');
  });

  it("requires a filled icon to fill something and to be declared in metadata", () => {
    const errors = checkIcon("dot", svg('<circle cx="12" cy="12" r="4"/>'), meta(), "filled");
    expect(errors).toContain('filled icon needs at least one element with fill="currentColor"');
    expect(errors).toContain("metadata needs a filled block when icons/filled/<name>.svg exists");
  });

  it("checks parts against the filled animation override", () => {
    const errors = checkIcon(
      "dot",
      svg('<circle data-part="badge" fill="currentColor" cx="12" cy="12" r="4"/>'),
      {
        ...meta(["core"]),
        filled: {
          animation: {
            name: "pop",
            description: "Pops",
            parts: ["badge"],
            motion: [{ part: "badge", preset: "pulse", scale: 1.1 }],
          },
        },
      },
      "filled",
    );
    expect(errors).toEqual([]);
  });
});
