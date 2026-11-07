import { describe, expect, it } from "vitest";
import { checkIcon, pathPoints } from "./icon-rules.ts";

const root =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const svg = (body: string) => `${root}\n  ${body}\n</svg>\n`;
const meta = (parts: string[] = []) => ({
  name: "dot",
  category: "status",
  tags: ["dot", "point"],
  animation: { name: "pulse", description: "Pulses", parts },
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

  it("requires metadata to match the file name", () => {
    const errors = checkIcon("dot", svg('<circle cx="12" cy="12" r="4"/>'), {
      ...meta(),
      name: "ring",
    });
    expect(errors).toContain('metadata name "ring" must match the file name');
  });
});
