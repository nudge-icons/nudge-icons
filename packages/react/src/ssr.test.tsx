// @vitest-environment jsdom
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Eye, Heart, Menu } from "./index";

const App = () => (
  <div>
    <Eye />
    <Eye active />
    <Menu />
    <Heart />
  </div>
);

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("server rendering and hydration", () => {
  it("renders the CSS of an icon once per server render", () => {
    const html = renderToString(<App />);
    expect(html.match(/data-href="nudge-eye"/g)).toHaveLength(1);
  });

  it("hydrates several server-rendered roots on one page (islands)", async () => {
    const containers = [1, 2].map(() => {
      const container = document.createElement("div");
      container.innerHTML = renderToString(<App />);
      document.body.append(container);
      return container;
    });

    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverable: unknown[] = [];
    await act(async () => {
      for (const container of containers) {
        hydrateRoot(container, <App />, { onRecoverableError: (e) => recoverable.push(e) });
      }
    });

    expect(recoverable).toEqual([]);
    expect(
      error.mock.calls.map((c) => String(c[0])).filter((m) => /hydrat|match/i.test(m)),
    ).toEqual([]);
    for (const container of containers) {
      expect(container.querySelectorAll("svg.nudge-eye")).toHaveLength(2);
    }
  });
});
