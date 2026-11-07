// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { Eye, Heart, Menu } from "./index";

const App = {
  render: () => h("div", [h(Eye), h(Eye, { active: true }), h(Menu), h(Heart), h("p", "text")]),
};

const inlineStyles = (html: string, id: string) =>
  html.match(new RegExp(`<style data-nudge="${id}"`, "g")) ?? [];

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("server rendering", () => {
  it("renders each icon's CSS once per request, inside its first instance", async () => {
    const html = await renderToString(createSSRApp(App));
    expect(inlineStyles(html, "eye")).toHaveLength(1);
    // The first Eye carries the shared base and its own style; the second carries none.
    const eyes = html.match(/<svg[^>]*nudge-eye[^>]*>(?:<style[^>]*>[^<]*<\/style>)*/g) ?? [];
    expect(eyes).toHaveLength(2);
    expect(eyes[0]).toContain('<style data-nudge="base"');
    expect(eyes[0]).toContain('<style data-nudge="eye"');
    expect(eyes[1]).not.toContain("<style");
    expect(inlineStyles(html, "base")).toHaveLength(1);
    expect(inlineStyles(html, "heart")).toHaveLength(1);
    expect(inlineStyles(html, "menu")).toHaveLength(1);
  });

  it("starts fresh for every request", async () => {
    const first = await renderToString(createSSRApp(App));
    const second = await renderToString(createSSRApp(App));
    expect(inlineStyles(first, "eye")).toHaveLength(1);
    expect(inlineStyles(second, "eye")).toHaveLength(1);
  });
});

describe("hydration", () => {
  it("hydrates server markup without mismatches and keeps a lasting copy in <head>", async () => {
    const html = await renderToString(createSSRApp(App));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = createSSRApp(App);
    app.mount(container);

    const messages = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0]));
    expect(messages.filter((m) => /hydrat|mismatch/i.test(m))).toEqual([]);
    expect(container.querySelectorAll('style[data-nudge="eye"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('style[data-nudge-head="eye"]')).toHaveLength(1);

    app.unmount();
    expect(document.head.querySelector('style[data-nudge-head="eye"]')).not.toBeNull();
  });

  it("hydrates several server-rendered apps on one page (islands)", async () => {
    const containers = await Promise.all(
      [1, 2].map(async () => {
        const container = document.createElement("div");
        container.innerHTML = await renderToString(createSSRApp(App));
        document.body.append(container);
        return container;
      }),
    );

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const container of containers) createSSRApp(App).mount(container);

    const messages = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0]));
    expect(messages.filter((m) => /hydrat|mismatch/i.test(m))).toEqual([]);
    for (const container of containers) {
      expect(container.querySelectorAll('style[data-nudge="eye"]')).toHaveLength(1);
    }
  });
});
