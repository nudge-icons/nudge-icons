// Parses the flat, hand-controlled SVG files in icons/ into a tree that templates can render.
// Not a general XML parser: it only knows elements with double-quoted attributes.

export interface SvgNode {
  tag: string;
  attrs: Record<string, string>;
  children: SvgNode[];
}

/** Returns the children of the root `<svg>`, with `<g>` groups nested. */
export function parseSvgTree(svg: string): SvgNode[] {
  const root: SvgNode = { tag: "#root", attrs: {}, children: [] };
  const stack: SvgNode[] = [root];
  const tagRe = /<(\/?)([a-zA-Z]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g;
  for (const [, closing, tag = "", rawAttrs = "", selfClosing] of svg.matchAll(tagRe)) {
    if (closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const [, key = "", value = ""] of rawAttrs.matchAll(/([\w:-]+)="([^"]*)"/g)) {
      attrs[key] = value;
    }
    const node: SvgNode = { tag, attrs, children: [] };
    if (tag === "svg") {
      if (!selfClosing) stack.push(root);
      continue;
    }
    stack.at(-1)?.children.push(node);
    if (!selfClosing) stack.push(node);
  }
  return root.children;
}

/** Drops every element (and its children) whose data-part is in `parts`. */
export function withoutParts(nodes: SvgNode[], parts: ReadonlySet<string>): SvgNode[] {
  return nodes
    .filter((n) => !parts.has(n.attrs["data-part"] ?? ""))
    .map((n) => ({ ...n, children: withoutParts(n.children, parts) }));
}

/** Writes nodes back as SVG source: the given root tag, one element per line. */
export function serializeSvg(rootTag: string, nodes: SvgNode[]): string {
  const lines = (list: SvgNode[], depth: number): string[] =>
    list.flatMap((n) => {
      const pad = "  ".repeat(depth);
      const attrs = Object.entries(n.attrs)
        .map(([k, v]) => ` ${k}="${v}"`)
        .join("");
      if (!n.children.length) return [`${pad}<${n.tag}${attrs}/>`];
      return [`${pad}<${n.tag}${attrs}>`, ...lines(n.children, depth + 1), `${pad}</${n.tag}>`];
    });
  return [rootTag, ...lines(nodes, 1), "</svg>", ""].join("\n");
}
