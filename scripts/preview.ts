// Builds preview.html: every icon on the 24px grid, at 16/24/48px on light and dark,
// in both states for icons with a toggle, and in the filled and half variants. Used to review drafts; not published.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PAINTED_VARIANTS, type IconMeta } from "./lib/icon-rules.ts";

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

const variantCounts = PAINTED_VARIANTS.map(
  (v) => `${names.filter((n) => existsSync(join(dir, v, `${n}.svg`))).length} ${v}`,
).join(", ");

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function card(name: string): string {
  const meta = JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8")) as IconMeta;
  const files = [
    join(dir, `${name}.svg`),
    ...PAINTED_VARIANTS.map((v) => join(dir, v, `${name}.svg`)),
  ].filter(existsSync);
  const hidden = (meta.toggle?.activeOnly ?? [])
    .map((p) => `.${name}:not(.active) [data-part="${p}"] { display: none; }`)
    .join("\n");
  const states = meta.toggle ? ["", "active"] : [""];
  const rows = files
    .flatMap((file) => states.map((state) => [file, state] as const))
    .map(([file, state]) => {
      const svg = readFileSync(file, "utf8").trim();
      const sized = (px: number) =>
        svg.replace('width="24" height="24"', `width="${px}" height="${px}"`);
      const variant = PAINTED_VARIANTS.find((v) => file.includes(`/${v}/`)) ?? "";
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
  return `<section>
    <style>${hidden}</style>
    <h2>${name} <small>${meta.category}</small></h2>
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
  ${draftActiveCss}
</style>
</head>
<body>
<h1>nudge-icons · ${names.length} icons, ${variantCounts}</h1>
<main>
${names.map(card).join("\n")}
</main>
<script>
  // Dotted frame: stroke edge (1–23). Dashed frame: safe area for points (2–22).
  // Below each zoomed icon: centre of the drawn shape, red when it is off by more than 0.25.
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
