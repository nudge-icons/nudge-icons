import { describe, expect, it } from "vitest";
import { DEFAULTS } from "./settings";
import {
  contextSnippet,
  humanName,
  partsCss,
  reactSnippet,
  registryCommand,
  vueSnippet,
} from "./snippets";

const bell = { component: "Bell", hasToggle: false };
const eye = { component: "Eye", hasToggle: true };

describe("code snippets", () => {
  it("point the registry command at the item of the chosen framework", () => {
    expect(registryCommand("heart-filled", "react")).toBe(
      "npx shadcn@latest add https://dimon85.github.io/nudge-icons/r/heart-filled.json",
    );
    expect(registryCommand("heart-filled", "vue")).toBe(
      "npx shadcn-vue@latest add https://dimon85.github.io/nudge-icons/r/vue/heart-filled.json",
    );
  });

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

describe("in-context snippet", () => {
  it("names the button after the icon, without the variant", () => {
    expect(humanName("alert-triangle-filled")).toBe("Alert triangle");
  });

  it("writes React with JSX comments and className", () => {
    const code = contextSnippet("Comment", "comment", "react");
    expect(code).toContain("<button><Comment size={16} /> Comment</button>");
    expect(code).toContain('<button aria-label="Comment"><Comment size={20} /></button>');
    expect(code).toContain('<div className="nudge-trigger">');
    expect(code).toContain("{/* Animates when the whole button is hovered or focused. */}");
  });

  it("writes Vue inside a template with class", () => {
    const code = contextSnippet("Comment", "comment", "vue");
    expect(code.startsWith("<template>")).toBe(true);
    expect(code).toContain('<Comment :size="16" />');
    expect(code).toContain('<div class="nudge-trigger">');
  });
});

describe("parts CSS", () => {
  it("styles one part directly", () => {
    expect(partsCss("bell", ["clapper"])).toBe(
      '.nudge-bell [data-part="clapper"] {\n  stroke: #e11d48;\n}',
    );
  });

  it("uses color for filled and half icons, so the fill follows", () => {
    expect(partsCss("bell-filled", ["body"], true)).toContain("  color: #e11d48;");
  });

  it("groups several parts in :is()", () => {
    expect(partsCss("eye", ["outline", "pupil"])).toContain(
      '.nudge-eye :is([data-part="outline"], [data-part="pupil"]) {',
    );
  });
});
