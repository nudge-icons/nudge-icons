// Builds preview.html: every icon on the 24px grid, at 16/24/48px on light and dark,
// in both states for icons with a toggle, and in the filled and half variants, with their
// motion CSS. Used to review drafts; not published.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PAINTED_VARIANTS, type IconMeta } from "./lib/icon-rules.ts";
import { drawnParts, iconCss } from "./lib/motion.ts";
import { parseSvgTree, type SvgNode } from "./lib/svg-tree.ts";

const root = join(import.meta.dirname, "..");
const dir = join(root, "icons");
const names = readdirSync(dir)
  .filter((f) => f.endsWith(".svg"))
  .map((f) => f.slice(0, -4))
  .sort();

// Draft second states for icons whose toggle moves existing parts. The real CSS
// comes from the component templates later; this only shows the target drawing.
const draftActiveCss = `
.active [data-part="middle"] { opacity: 0; }
.active [data-part="top"] { transform: translateY(6px) rotate(45deg); transform-origin: 12px 6px; }
.active [data-part="bottom"] { transform: translateY(-6px) rotate(-45deg); transform-origin: 12px 18px; }
.lock.active [data-part="shackle"] { stroke-dasharray: 30; stroke-dashoffset: -3.5; }
`;

const hasMotion = (name: string) =>
  Boolean(
    (JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8")) as IconMeta).animation.motion,
  );
// Icons with motion first, so the ones to review are on top.
const ordered = [...names.filter(hasMotion), ...names.filter((n) => !hasMotion(n))];
const moving = names.filter(hasMotion).length;

const variantCounts = PAINTED_VARIANTS.map(
  (v) => `${names.filter((n) => existsSync(join(dir, v, `${n}.svg`))).length} ${v}`,
).join(", ");

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// Motion CSS of every component, once each.
const motionCss = new Map<string, string>();

const SHAPES = new Set(["path", "line", "polyline", "polygon", "circle", "ellipse", "rect"]);

/** Serialises the drawing, adding pathLength="1" inside drawn parts like the generator does. */
function shapes(nodes: SvgNode[], drawn: Set<string>, inside = false): string {
  return nodes
    .map((n) => {
      const isDrawn = inside || drawn.has(n.attrs["data-part"] ?? "");
      const attrs = { ...n.attrs, ...(isDrawn && SHAPES.has(n.tag) ? { pathLength: "1" } : {}) };
      const text = Object.entries(attrs)
        .map(([k, v]) => ` ${k}="${v}"`)
        .join("");
      return `<${n.tag}${text}>${shapes(n.children, drawn, isDrawn)}</${n.tag}>`;
    })
    .join("");
}

function card(name: string): string {
  const meta = JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8")) as IconMeta;
  const files = [
    join(dir, `${name}.svg`),
    ...PAINTED_VARIANTS.map((v) => join(dir, v, `${name}.svg`)),
  ].filter(existsSync);
  const states = meta.toggle ? ["", "active"] : [""];
  const rows = files
    .flatMap((file) => states.map((state) => [file, state] as const))
    .map(([file, state]) => {
      const variant = PAINTED_VARIANTS.find((v) => file.includes(`/${v}/`)) ?? "";
      const id = variant ? `${name}-${variant}` : name;
      const motion =
        ((variant ? meta[variant]?.animation : undefined) ?? meta.animation).motion ?? [];
      motionCss.set(id, iconCss(id, motion, meta.toggle?.activeOnly ?? []));
      const rootTag = readFileSync(file, "utf8").match(/<svg[^>]*>/)?.[0] ?? "<svg>";
      const body = shapes(parseSvgTree(readFileSync(file, "utf8")), new Set(drawnParts(motion)));
      const svg = `${rootTag.replace(">", ` class="nudge-icon nudge-${id}" data-animate="hover"${state ? " data-active" : ""}>`)}${body}</svg>`;
      const sized = (px: number) =>
        svg.replace('width="24" height="24"', `width="${px}" height="${px}"`);
      const label = [variant, state].filter(Boolean).join(" · ");
      const cls = `${name} ${state}`.trim();
      const big = sized(192);
      const skeleton = big
        .replace('stroke-width="2"', 'stroke-width="0.08"')
        .replace(/fill="currentColor"/g, 'fill="none"');
      return `<div class="row">
        <div class="zoom ${cls}">${big}<div class="skeleton">${skeleton}</div></div>
        <div class="sizes light ${cls}">${sized(16)}${sized(24)}${sized(48)}</div>
        <div class="sizes dark ${cls}">${sized(16)}${sized(24)}${sized(48)}</div>
        ${label ? `<span class="state">${label}</span>` : ""}
      </div>`;
    })
    .join("\n");
  const toggle = meta.toggle ? ` · toggle: ${escape(meta.toggle.description)}` : "";
  const own = meta.filled?.animation;
  const filledNote = own ? ` · filled ${escape(own.name)}: ${escape(own.description)}` : "";
  const moves = meta.animation.motion ? "" : ` <small class="todo">no motion yet</small>`;
  return `<section class="nudge-trigger${meta.animation.motion ? "" : " still"}">
    <h2>${name} <small>${meta.category}</small>${moves}</h2>
    <p>${escape(meta.animation.name)}: ${escape(meta.animation.description)}${toggle}${filledNote}</p>
    ${rows}
  </section>`;
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>nudge-icons preview</title>
<style>
  body { font: 14px/1.4 system-ui, sans-serif; margin: 24px; background: #f6f6f4; color: #222; }
  main { display: grid; grid-template-columns: repeat(auto-fill, minmax(520px, 1fr)); gap: 16px; }
  section { background: #fff; border-radius: 8px; padding: 12px 16px; }
  h2 { margin: 0; font-size: 16px; } small { color: #888; font-weight: 400; }
  p { margin: 4px 0 8px; color: #555; }
  .row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .zoom { position: relative; width: 192px; height: 192px; color: #222;
    background:
      linear-gradient(#0000 calc(100% - 1px), #e4e4e4 0) 0 0 / 8px 8px,
      linear-gradient(90deg, #0000 calc(100% - 1px), #e4e4e4 0) 0 0 / 8px 8px; }
  .zoom::after { content: ""; position: absolute; inset: 16px; outline: 1px dashed #f0a; }
  .zoom::before { content: ""; position: absolute; inset: 8px; outline: 1px dotted #bbb; }
  .centre { position: absolute; left: 0; bottom: -18px; font-size: 11px; color: #888; }
  .centre.off { color: #e11; font-weight: 600; }
  .zoom > svg { position: relative; color: #222; opacity: 0.55; }
  .skeleton { position: absolute; inset: 0; color: #e11; }
  .sizes { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 6px; }
  .light { background: #fff; color: #222; border: 1px solid #eee; }
  .dark { background: #18181b; color: #f4f4f5; }
  .state { color: #888; font-size: 12px; }
  .todo { color: #c60; }
  body.only-moving .still { display: none; }
  .modes { position: sticky; top: 0; z-index: 1; display: flex; gap: 8px; align-items: center;
    padding: 8px 0; background: #f6f6f4; }
  .modes button { font: inherit; padding: 4px 10px; border: 1px solid #ccc; border-radius: 6px; background: #fff; }
  .modes button[aria-pressed="true"] { background: #222; color: #fff; }
  ${draftActiveCss}
</style>
</head>
<body>
<h1>nudge-icons · ${names.length} icons, ${variantCounts} · ${moving} with motion</h1>
<div class="modes">Animate:
  <button data-mode="hover" aria-pressed="true">hover (card)</button>
  <button data-mode="loop">loop</button>
  <button data-mode="once">once (replay)</button>
  <button data-mode="3">3×</button>
  <button data-mode="false">off</button>
  <label><input type="checkbox" id="only-moving"> only icons with motion</label>
</div>
<main>
${ordered.map(card).join("\n")}
</main>
<style>${[...motionCss.values()].join("")}</style>
<script>
  // Dotted frame: stroke edge (1–23). Dashed frame: safe area for points (2–22).
  // Below each zoomed icon: centre of the drawn shape, red when it is off by more than 0.25.
  document.getElementById("only-moving").addEventListener("change", (e) => {
    document.body.classList.toggle("only-moving", e.target.checked);
  });
  for (const button of document.querySelectorAll(".modes button")) {
    button.addEventListener("click", () => {
      for (const b of document.querySelectorAll(".modes button")) b.setAttribute("aria-pressed", String(b === button));
      const icons = document.querySelectorAll(".nudge-icon");
      // Removing the attribute first lets "once" replay.
      for (const icon of icons) {
        icon.removeAttribute("data-animate");
        icon.style.removeProperty("--nudge-repeat");
      }
      const mode = button.dataset.mode;
      const times = Number(mode);
      requestAnimationFrame(() => {
        for (const icon of icons) {
          if (mode === "false") continue;
          icon.setAttribute("data-animate", times > 0 ? "loop" : mode);
          if (times > 0) icon.style.setProperty("--nudge-repeat", String(times));
        }
      });
    });
  }
  for (const zoom of document.querySelectorAll(".zoom")) {
    const svg = zoom.querySelector(":scope > svg");
    const b = svg.getBBox();
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    const label = document.createElement("span");
    label.className = Math.abs(cx - 12) > 0.25 || Math.abs(cy - 12) > 0.25 ? "centre off" : "centre";
    label.textContent = "centre " + cx.toFixed(2) + ", " + cy.toFixed(2);
    zoom.append(label);
  }
</script>
</body>
</html>
`;

writeFileSync(join(root, "preview.html"), html);
console.log(`preview.html: ${names.length} icons`);
