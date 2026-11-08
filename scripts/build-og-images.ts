// Renders the link-preview images of the site (1200×630 PNG): one per icon variant and one
// for the home page, into apps/site/public/og/. An image is rendered again only when its
// inputs change (the icon, its motion text, this script), so most builds skip the browser.
// Images of removed icons are deleted on every run. `--check` changes nothing and reports how
// many images are stale; CI uses it to skip installing Chromium.
import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { iconVariants, svgPackage, type IconVariantInfo } from "./lib/icon-list.ts";

const root = join(import.meta.dirname, "..");
const out = join(root, "apps", "site", "public", "og");
const manifestFile = join(out, "manifest.json");
const fonts = join(root, "apps", "site", "node_modules", "@fontsource");

const WIDTH = 1200;
const HEIGHT = 630;
const HOME_ICONS = [
  "bell",
  "heart",
  "download",
  "menu",
  "clock",
  "check-circle",
  "eye",
  "send",
  "star",
];

// Site colours (apps/site/src/styles/tokens.css, light theme).
const C = {
  bg: "#fafaf9",
  surface: "#ffffff",
  text: "#18181b",
  text2: "#6b6b70",
  border: "#e4e4e2",
  accent: "#0f766e",
  grid: "rgb(24 24 27 / 0.06)",
  safe: "rgb(15 118 110 / 0.35)",
};

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const sentence = (t: string) => (/[.!?]$/.test(t) ? t : `${t}.`);

const svgOf = (id: string) => readFileSync(join(svgPackage, "icons", `${id}.svg`), "utf8");

const fontFace = (family: string, file: string, weight: number) => {
  const data = readFileSync(join(fonts, file)).toString("base64");
  return `@font-face{font-family:"${family}";font-weight:${weight};src:url(data:font/woff2;base64,${data}) format("woff2")}`;
};

const FONTS = [
  fontFace("Plex", "ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2", 400),
  fontFace("Plex", "ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2", 600),
  fontFace("Plex Mono", "ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2", 400),
].join("");

const LOGO = `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="${C.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h4M2.5 12h3M3 15h4"/><circle cx="15" cy="12" r="6"/></svg>`;

/** The 24-unit grid with the 2–22 safe area, like the site's blueprint view. */
const GRID = (() => {
  const lines = Array.from({ length: 25 }, (_, i) => {
    const w = i % 12 === 0 ? 0.08 : i % 4 === 0 ? 0.05 : 0.03;
    return `<line x1="${i}" y1="0" x2="${i}" y2="24" stroke-width="${w}"/><line x1="0" y1="${i}" x2="24" y2="${i}" stroke-width="${w}"/>`;
  }).join("");
  return `<svg class="grid" viewBox="0 0 24 24"><g stroke="${C.grid}">${lines}</g><rect x="2" y="2" width="20" height="20" fill="none" stroke="${C.safe}" stroke-width="0.06" stroke-dasharray="0.3 0.3"/></svg>`;
})();

const page = (
  art: string,
  text: string,
) => `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
*{box-sizing:border-box;margin:0}
body{width:${WIDTH}px;height:${HEIGHT}px;display:flex;background:${C.bg};font-family:Plex,sans-serif;color:${C.text}}
.art{position:relative;width:${HEIGHT}px;height:${HEIGHT}px;flex:none;background:${C.surface};border-right:2px solid ${C.border}}
.grid,.icon{position:absolute;inset:75px;width:480px;height:480px}
/* At 20× a 2-unit stroke turns heavy; a lighter one keeps the line look at this size. */
.icon svg{width:100%;height:100%;color:${C.accent};stroke-width:1.5}
.icons{position:absolute;inset:75px;display:grid;grid-template-columns:repeat(3,1fr);place-items:center}
.icons svg{width:112px;height:112px;color:${C.accent}}
.text{flex:1;display:flex;flex-direction:column;padding:64px 56px}
.brand{display:flex;align-items:center;gap:14px;font-size:30px;font-weight:600}
.main{margin:auto 0}
h1{font-size:68px;font-weight:600;line-height:1.08;letter-spacing:-0.01em;overflow-wrap:anywhere}
.motion{margin-top:20px;font:400 24px "Plex Mono",monospace;color:${C.accent}}
p{margin-top:16px;font-size:28px;line-height:1.35;color:${C.text2};display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.foot{font:400 22px "Plex Mono",monospace;color:${C.text2}}
</style></head><body><div class="art">${art}</div><div class="text">
<div class="brand">${LOGO}nudge-icons</div><div class="main">${text}</div>
<div class="foot">React · Vue · SVG</div></div></body></html>`;

/** Long names get a smaller title, so they stay on one line (Plex 600 is about 0.56em wide). */
const titleSize = (name: string) => Math.min(68, Math.floor(430 / (name.length * 0.56)));

function iconPage(icon: IconVariantInfo): string {
  return page(
    `${GRID}<div class="icon">${svgOf(icon.id)}</div>`,
    `<h1 style="font-size:${titleSize(icon.id)}px">${escape(icon.id)}</h1><div class="motion">motion: ${escape(icon.motion.name)}</div><p>${escape(sentence(icon.motion.description))}</p>`,
  );
}

function homePage(ids: ReadonlySet<string>): string {
  const icons = HOME_ICONS.filter((id) => ids.has(id))
    .map(svgOf)
    .join("");
  return page(
    `<div class="icons">${icons}</div>`,
    `<h1>Animated line icons</h1><p>Each icon has its own small motion, made with CSS only. For React and Vue.</p>`,
  );
}

const SELF = readFileSync(import.meta.filename, "utf8");
const hash = (html: string) =>
  createHash("sha256").update(SELF).update(html).digest("hex").slice(0, 16);

const icons = iconVariants();
const jobs = [
  ...icons.map((icon) => ({ name: icon.id, html: iconPage(icon) })),
  { name: "home", html: homePage(new Set(icons.map((i) => i.id))) },
];

const manifest: Record<string, string> = existsSync(manifestFile)
  ? (JSON.parse(readFileSync(manifestFile, "utf8")) as Record<string, string>)
  : {};
const names = new Set(jobs.map((j) => j.name));
const stale = jobs.filter(
  (j) => manifest[j.name] !== hash(j.html) || !existsSync(join(out, `${j.name}.png`)),
);
// Images of icons that no longer exist, by file, so a lost manifest does not keep them.
const obsolete = existsSync(out)
  ? readdirSync(out)
      .filter((f) => f.endsWith(".png") && !names.has(f.slice(0, -4)))
      .map((f) => f.slice(0, -4))
  : [];
// Manifest entries of removed icons, even when their image is already gone.
const orphanEntries = Object.keys(manifest).filter((name) => !names.has(name));

const writeManifest = () => {
  const current = Object.fromEntries(
    jobs.filter((j) => manifest[j.name] !== undefined).map((j) => [j.name, manifest[j.name]]),
  );
  writeFileSync(manifestFile, `${JSON.stringify(current, null, 2)}\n`);
};

if (process.argv.includes("--check")) {
  // Read-only: only stale images need the browser; obsolete ones are removed without it.
  console.log(
    `OG images: ${stale.length} of ${jobs.length} to render, ${obsolete.length} to remove`,
  );
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `stale=${stale.length}\n`);
} else {
  // Removed icons would otherwise be deployed from a restored cache; this needs no browser,
  // so it runs even when nothing is rendered.
  for (const name of obsolete) rmSync(join(out, `${name}.png`), { force: true });
  if (stale.length > 0) {
    const { chromium } = await import("playwright");
    mkdirSync(out, { recursive: true });
    const browser = await chromium.launch();
    const tab = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
    for (const job of stale) {
      await tab.setContent(job.html, { waitUntil: "load" });
      await tab.evaluate(() => document.fonts.ready);
      await tab.screenshot({ path: join(out, `${job.name}.png`) });
      manifest[job.name] = hash(job.html);
    }
    await browser.close();
  }
  if (stale.length > 0 || obsolete.length > 0 || orphanEntries.length > 0) writeManifest();
  console.log(
    `OG images: rendered ${stale.length}, removed ${obsolete.length}, ${jobs.length} in all`,
  );
}
