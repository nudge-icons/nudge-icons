// @vitest-environment jsdom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import * as animated from "./index";
import { Bell, Check, Eye, Heart, HeartFilled, Lock, Menu, StarHalf } from "./index";
import * as still from "./static";

describe("icon defaults", () => {
  it("renders a 24px line icon in the current colour", () => {
    const svg = mount(Heart).element as SVGSVGElement;
    expect(svg.tagName).toBe("svg");
    expect(svg.getAttribute("width")).toBe("24");
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg.getAttribute("fill")).toBe("none");
    expect(svg.getAttribute("stroke")).toBe("currentColor");
    expect(svg.getAttribute("stroke-width")).toBe("2");
    expect(svg.getAttribute("class")).toBe("nudge-icon nudge-heart");
  });

  it("keeps data-part and SVG attribute names", () => {
    expect(mount(Bell).find('[data-part="clapper"]').exists()).toBe(true);
    const filled = mount(HeartFilled).find('[data-part="shape"]');
    expect(filled.attributes("fill")).toBe("currentColor");
  });
});

describe("accessibility", () => {
  it("is hidden from assistive tech without a title", () => {
    const svg = mount(Heart);
    expect(svg.attributes("aria-hidden")).toBe("true");
    expect(svg.attributes("role")).toBeUndefined();
  });

  it("becomes an image with a title or aria-label", () => {
    const titled = mount(Heart, { props: { title: "Liked" } });
    expect(titled.attributes("role")).toBe("img");
    expect(titled.find("title").text()).toBe("Liked");
    const labelled = mount(Heart, { attrs: { "aria-label": "Liked" } });
    expect(labelled.attributes("role")).toBe("img");
    expect(labelled.attributes("aria-hidden")).toBeUndefined();
  });
});

describe("props and attributes", () => {
  it("applies size, colour and stroke width", () => {
    const svg = mount(Heart, { props: { size: 32, color: "red", strokeWidth: 1.5 } });
    expect(svg.attributes("width")).toBe("32");
    expect(svg.attributes("stroke")).toBe("red");
    expect(svg.attributes("stroke-width")).toBe("1.5");
  });

  it("keeps the stroke in pixels with absoluteStrokeWidth", () => {
    const svg = mount(Heart, { props: { size: 48, absoluteStrokeWidth: true } });
    expect(svg.attributes("stroke-width")).toBe("1");
  });

  it("merges class and passes other attributes to the <svg>", () => {
    const svg = mount(Heart, { attrs: { class: "extra", "data-testid": "like" } });
    expect(svg.attributes("class")).toBe("nudge-icon nudge-heart extra");
    expect(svg.attributes("data-testid")).toBe("like");
  });
});

describe("animate and active", () => {
  it("animates on hover by default and can be turned off", () => {
    expect(mount(Heart).attributes("data-animate")).toBe("hover");
    expect(mount(Heart, { props: { animate: "loop" } }).attributes("data-animate")).toBe("loop");
    expect(mount(Heart, { props: { animate: false } }).attributes("data-animate")).toBeUndefined();
  });

  it("plays a number of times with a numeric animate", () => {
    const svg = mount(Bell, { props: { animate: 3 }, attrs: { style: "opacity: 0.5" } });
    expect(svg.attributes("data-animate")).toBe("loop");
    const el = svg.element as SVGSVGElement;
    expect(el.style.getPropertyValue("--nudge-repeat")).toBe("3");
    expect(el.style.opacity).toBe("0.5");
    expect(mount(Bell, { props: { animate: 0 } }).attributes("data-animate")).toBeUndefined();
  });

  it("marks the second state with data-active", () => {
    expect(mount(Menu).attributes("data-active")).toBeUndefined();
    expect(mount(Menu, { props: { active: true } }).attributes("data-active")).toBe("");
    expect(mount(Lock, { props: { active: true } }).attributes("data-active")).toBe("");
  });

  it("only declares active on icons with a second state", () => {
    expect(Object.keys(Menu.props)).toContain("active");
    expect(Object.keys(Heart.props)).not.toContain("active");
  });

  it("puts the CSS of an icon into <head> once, not into each icon", () => {
    const first = mount(Eye);
    mount(Eye, { props: { active: true } });
    expect(document.head.querySelectorAll('style[data-nudge-head="eye"]')).toHaveLength(1);
    expect(document.head.querySelector('style[data-nudge-head="eye"]')?.textContent).toContain(
      '[data-part="slash"]',
    );
    // Client-only rendering has no server markup to match, so no inline copy.
    expect(first.find("style").exists()).toBe(false);
    first.unmount();
    expect(document.head.querySelector('style[data-nudge-head="eye"]')).not.toBeNull();
  });
});

describe("motion", () => {
  it("ships the motion CSS of an icon and gives drawn parts pathLength", () => {
    expect(
      mount(Check).find('[data-part="mark"]').attributes("pathlength") ??
        mount(Check).find('[data-part="mark"]').attributes("pathLength"),
    ).toBe("1");
    const css = document.head.querySelector('style[data-nudge-head="check"]')?.textContent ?? "";
    expect(css).toContain("@keyframes nudge-check-mark");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("switching animate from false to once turns the motion on", async () => {
    const bell = mount(Bell, { props: { animate: false } });
    expect(bell.attributes("data-animate")).toBeUndefined();
    await bell.setProps({ animate: "once" });
    expect(bell.attributes("data-animate")).toBe("once");
  });

  it("static icons have no pathLength", () => {
    expect(mount(still.Check).find("[pathLength]").exists()).toBe(false);
  });
});

describe("variants and entries", () => {
  it("exports filled and half variants with their own class", () => {
    expect(mount(HeartFilled).attributes("class")).toBe("nudge-icon nudge-heart-filled");
    expect(mount(StarHalf).find("[fill]").exists()).toBe(true);
  });

  it("exports the same components from both entries", () => {
    const names = (mod: object) =>
      Object.keys(mod)
        .filter((k) => /^[A-Z]/.test(k))
        .sort();
    expect(names(animated)).toEqual(names(still));
    expect(names(animated)).toHaveLength(65);
  });

  it("static icons have no CSS, animation state, active prop or active-only parts", () => {
    const eye = mount(still.Eye);
    expect(eye.attributes("data-animate")).toBeUndefined();
    expect(eye.find('[data-part="slash"]').exists()).toBe(false);
    expect(eye.find('[data-part="pupil"]').exists()).toBe(true);
    expect(Object.keys(still.Menu.props)).not.toContain("active");
    expect(Object.keys(still.Heart.props)).not.toContain("animate");
  });
});
