// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import * as animated from "./index";
import { Bell, Check, Eye, Globe, Heart, HeartFilled, Lock, Menu, StarHalf } from "./index";
import * as still from "./static";

afterEach(cleanup);

const svgOf = (container: HTMLElement) => {
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("no <svg> rendered");
  return svg;
};

describe("icon defaults", () => {
  it("renders a 24px line icon in the current colour", () => {
    const svg = svgOf(render(<Heart />).container);
    expect(svg.getAttribute("width")).toBe("24");
    expect(svg.getAttribute("height")).toBe("24");
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg.getAttribute("fill")).toBe("none");
    expect(svg.getAttribute("stroke")).toBe("currentColor");
    expect(svg.getAttribute("stroke-width")).toBe("2");
    expect(svg.getAttribute("class")).toBe("nudge-icon nudge-heart");
  });

  it("keeps data-part on the drawn elements", () => {
    const svg = svgOf(render(<Bell />).container);
    expect(svg.querySelector('[data-part="clapper"]')).not.toBeNull();
  });

  it("forwards the ref to the <svg>", () => {
    const ref = createRef<SVGSVGElement>();
    render(<Heart ref={ref} />);
    expect(ref.current?.tagName).toBe("svg");
  });
});

describe("accessibility", () => {
  it("is hidden from assistive tech without a title", () => {
    const svg = svgOf(render(<Heart />).container);
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("role")).toBeNull();
  });

  it("becomes an image with a title", () => {
    const svg = svgOf(render(<Heart title="Liked" />).container);
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-hidden")).toBeNull();
    expect(svg.querySelector("title")?.textContent).toBe("Liked");
  });

  it("treats aria-label as an accessible name", () => {
    const svg = svgOf(render(<Heart aria-label="Liked" />).container);
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-hidden")).toBeNull();
  });
});

describe("props", () => {
  it("applies size, colour, stroke width and class names", () => {
    const svg = svgOf(
      render(<Heart size={32} color="red" strokeWidth={1.5} className="extra" />).container,
    );
    expect(svg.getAttribute("width")).toBe("32");
    expect(svg.getAttribute("stroke")).toBe("red");
    expect(svg.getAttribute("stroke-width")).toBe("1.5");
    expect(svg.getAttribute("class")).toBe("nudge-icon nudge-heart extra");
  });

  it("keeps the stroke in pixels with absoluteStrokeWidth", () => {
    const svg = svgOf(render(<Heart size={48} absoluteStrokeWidth />).container);
    expect(svg.getAttribute("stroke-width")).toBe("1");
  });

  it("passes other SVG props through", () => {
    const svg = svgOf(render(<Heart data-testid="like" style={{ opacity: 0.5 }} />).container);
    expect(svg.getAttribute("data-testid")).toBe("like");
    expect(svg.style.opacity).toBe("0.5");
  });
});

describe("animate and active", () => {
  it("animates on hover by default and can be turned off", () => {
    expect(svgOf(render(<Heart />).container).dataset.animate).toBe("hover");
    cleanup();
    expect(svgOf(render(<Heart animate="loop" />).container).dataset.animate).toBe("loop");
    cleanup();
    expect(svgOf(render(<Heart animate={false} />).container).dataset.animate).toBeUndefined();
  });

  it("plays a number of times with a numeric animate", () => {
    const svg = svgOf(render(<Bell animate={3} style={{ opacity: 0.5 }} />).container);
    expect(svg.dataset.animate).toBe("loop");
    expect(svg.style.getPropertyValue("--nudge-repeat")).toBe("3");
    expect(svg.style.opacity).toBe("0.5");
    cleanup();
    expect(svgOf(render(<Bell animate={0} />).container).dataset.animate).toBeUndefined();
  });

  it("does not move icons with a second state on hover by default", () => {
    expect(svgOf(render(<Menu />).container).dataset.animate).toBeUndefined();
    cleanup();
    expect(svgOf(render(<Menu animate="hover" />).container).dataset.animate).toBe("hover");
  });

  it("marks the second state with data-active", () => {
    expect(svgOf(render(<Menu />).container).dataset.active).toBeUndefined();
    cleanup();
    expect(svgOf(render(<Menu active />).container).dataset.active).toBe("");
  });

  it("only allows active on icons with a second state", () => {
    // @ts-expect-error Heart has no second state.
    render(<Heart active />);
    render(<Lock active />);
  });

  it("hoists the CSS of an icon into <head> once", () => {
    render(
      <>
        <Eye />
        <Eye active />
      </>,
    );
    const styles = document.head.querySelectorAll('style[data-href="nudge-eye"]');
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toContain('[data-part="slash"]');
  });
});

describe("motion", () => {
  it("ships the motion CSS of an icon and gives drawn parts pathLength", () => {
    const { container } = render(<Check />);
    expect(svgOf(container).querySelector('[data-part="mark"]')?.getAttribute("pathLength")).toBe(
      "1",
    );
    const css = document.head.querySelector('style[data-href="nudge-check"]')?.textContent ?? "";
    expect(css).toContain("@keyframes nudge-check-mark");
    const base = document.head.querySelectorAll('style[data-href="nudge-base"]');
    expect(base).toHaveLength(1);
    expect(base[0]?.textContent).toContain("prefers-reduced-motion");
  });

  it("switching animate from false to once turns the motion on", () => {
    const { container, rerender } = render(<Bell animate={false} />);
    expect(svgOf(container).dataset.animate).toBeUndefined();
    rerender(<Bell animate="once" />);
    expect(svgOf(container).dataset.animate).toBe("once");
    const base = document.head.querySelector('style[data-href="nudge-base"]')?.textContent ?? "";
    expect(base).toContain(".nudge-icon[data-animate=once] [data-part]");
  });

  it("static icons have no pathLength", () => {
    const { container } = render(<still.Check />);
    expect(svgOf(container).querySelector("[pathLength]")).toBeNull();
  });
});

describe("variants", () => {
  it("exports filled and half variants with their own class", () => {
    expect(svgOf(render(<HeartFilled />).container).getAttribute("class")).toBe(
      "nudge-icon nudge-heart-filled",
    );
    cleanup();
    expect(svgOf(render(<StarHalf />).container).querySelector("[fill]")).not.toBeNull();
  });

  it("exports the same components from both entries", () => {
    const names = (mod: object) =>
      Object.keys(mod)
        .filter((k) => /^[A-Z]/.test(k))
        .sort();
    expect(names(animated)).toEqual(names(still));
    expect(names(animated)).toHaveLength(64);
  });
});

describe("static entry", () => {
  it("renders no CSS, no animation state and no active-only parts", () => {
    const { container } = render(<still.Eye />);
    const svg = svgOf(container);
    expect(svg.dataset.animate).toBeUndefined();
    expect(svg.querySelector('[data-part="slash"]')).toBeNull();
    expect(svg.querySelector('[data-part="pupil"]')).not.toBeNull();
    expect(container.querySelector("style")).toBeNull();
  });

  it("drops parts that only show in motion", () => {
    expect(
      svgOf(render(<Globe />).container).querySelector('[data-part="meridian-back"]'),
    ).not.toBeNull();
    cleanup();
    expect(
      svgOf(render(<still.Globe />).container).querySelector('[data-part="meridian-back"]'),
    ).toBeNull();
  });

  it("does not accept animate or active", () => {
    // @ts-expect-error Static icons have no animation.
    render(<still.Heart animate="loop" />);
    // @ts-expect-error Static icons have no second state.
    render(<still.Menu active />);
  });
});
