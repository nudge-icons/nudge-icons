import { describe, expect, it } from "vitest";
import { DEFAULTS } from "./settings";
import { reactSnippet, vueSnippet } from "./snippets";

const bell = { component: "Bell", hasToggle: false };
const eye = { component: "Eye", hasToggle: true };

describe("code snippets", () => {
  it("leave out props that match the defaults", () => {
    expect(reactSnippet(bell, DEFAULTS)).toBe(
      'import { Bell } from "@nudge-icons/react";\n\n<Bell />',
    );
  });

  it("write changed props in React syntax", () => {
    const s = { ...DEFAULTS, size: 32, strokeWidth: 1.5, color: "#0f766e", animate: "3" as const };
    expect(reactSnippet(bell, s)).toContain(
      '<Bell size={32} strokeWidth={1.5} color="#0f766e" animate={3} />',
    );
  });

  it("write changed props in Vue syntax", () => {
    const s = { ...DEFAULTS, strokeWidth: 1.5, animate: "loop" as const };
    expect(vueSnippet(bell, s)).toContain('<Bell :stroke-width="1.5" animate="loop" />');
  });

  it("use the variant's component", () => {
    const filled = { component: "BellFilled", hasToggle: false };
    expect(reactSnippet(filled, DEFAULTS)).toContain("<BellFilled />");
  });

  it("treat no motion as the default for icons with a second state", () => {
    expect(reactSnippet(eye, { ...DEFAULTS, animate: "off", active: true })).toContain(
      "<Eye active />",
    );
    expect(reactSnippet(eye, DEFAULTS)).toContain('<Eye animate="hover" />');
  });

  it("pass active only to icons with a second state", () => {
    expect(vueSnippet(bell, { ...DEFAULTS, active: true })).toContain("<Bell />");
  });
});
