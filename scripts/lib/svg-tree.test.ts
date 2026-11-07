import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseSvgTree, serializeSvg, withoutParts } from "./svg-tree.ts";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path data-part="tray" d="M3 15v4"/>
  <g data-part="arrow">
    <path d="M12 3v12"/>
    <path d="M7 10l5 5 5-5"/>
  </g>
  <circle data-part="dot" cx="12" cy="12" r="1"/>
</svg>`;

describe("parseSvgTree", () => {
  it("returns the root's children and nests groups", () => {
    const tree = parseSvgTree(svg);
    expect(tree.map((n) => n.tag)).toEqual(["path", "g", "circle"]);
    expect(tree[1]?.children.map((n) => n.attrs.d)).toEqual(["M12 3v12", "M7 10l5 5 5-5"]);
    expect(tree[2]?.attrs).toEqual({ "data-part": "dot", cx: "12", cy: "12", r: "1" });
  });
});

describe("withoutParts", () => {
  it("drops elements with the given parts, including groups", () => {
    const tree = withoutParts(parseSvgTree(svg), new Set(["arrow", "dot"]));
    expect(tree.map((n) => n.attrs["data-part"])).toEqual(["tray"]);
  });
});

describe("serializeSvg", () => {
  it("writes an icon file back unchanged", () => {
    for (const name of ["bell", "download", "globe"]) {
      const source = readFileSync(new URL(`../../icons/${name}.svg`, import.meta.url), "utf8");
      const rootTag = /<svg[^>]*>/.exec(source)?.[0] ?? "";
      expect(serializeSvg(rootTag, parseSvgTree(source))).toBe(source);
    }
  });

  it("nests groups and leaves out dropped parts", () => {
    const out = serializeSvg("<svg>", withoutParts(parseSvgTree(svg), new Set(["dot"])));
    expect(out).toBe(
      '<svg>\n  <path data-part="tray" d="M3 15v4"/>\n  <g data-part="arrow">\n    <path d="M12 3v12"/>\n    <path d="M7 10l5 5 5-5"/>\n  </g>\n</svg>\n',
    );
  });
});
