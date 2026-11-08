import react from "@vitejs/plugin-react";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { iconVariants, type IconVariantInfo } from "../../scripts/lib/icon-list.ts";
import { registryUrl, siteUrl } from "../../scripts/lib/site-url.ts";
import { DOCS, docBySlug } from "./src/lib/docs.ts";
import { headTags, pageMeta } from "./src/lib/page-meta.ts";
import { allPaths, matchPath, type Route } from "./src/lib/routes.ts";

const MARKER = "<!-- page-meta -->";
// Kept around the tags in the built index.html, so each page file swaps in its own.
const START = "<!-- page-meta:start -->";
const END = "<!-- page-meta:end -->";

let icons: IconVariantInfo[] | undefined;

/** The head tags of a route, with the canonical address of its path. */
function tagsFor(route: Route, path: string) {
  icons ??= iconVariants();
  const icon = route.page === "icon" ? icons.find((i) => i.id === route.name) : undefined;
  const doc = route.page === "doc" ? docBySlug(route.slug) : undefined;
  const url = `${siteUrl}${path.slice(1)}`;
  return `${START}\n    ${headTags(pageMeta(route, { icon, doc }), url, siteUrl)}\n    ${END}`;
}

/**
 * Head tags, one HTML file per page and the sitemap. GitHub Pages serves /icons/bell from
 * icons/bell.html with status 200, and each file carries that page's title, description,
 * canonical address and preview image; the app then routes on the client. 404.html, served
 * for every other path, is the same app with not-found tags and shows its not-found page.
 */
const pageFiles = (): Plugin => ({
  name: "page-files",
  transformIndexHtml: (html) => html.replace(MARKER, tagsFor({ page: "gallery" }, "/")),
  writeBundle(options) {
    const dir = options.dir ?? "dist";
    icons = iconVariants();
    const index = readFileSync(join(dir, "index.html"), "utf8");
    const withTags = (tags: string) =>
      index.replace(new RegExp(`${START}[\\s\\S]*?${END}`), () => tags);
    const paths = allPaths(
      icons.map((i) => i.id),
      DOCS.map((d) => d.slug),
    );
    for (const path of paths) {
      if (path === "/") continue;
      const file = join(dir, `${path.slice(1)}.html`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, withTags(tagsFor(matchPath(path), path)));
    }
    writeFileSync(join(dir, "404.html"), withTags(tagsFor({ page: "not-found" }, "/")));
    const urls = paths.map((p) => `  <url><loc>${siteUrl}${p.slice(1)}</loc></url>`);
    writeFileSync(
      join(dir, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
    );
    // Crawlers read robots.txt only at the root of a host; under a project path like
    // /nudge-icons/ it would be ignored, so the sitemap is submitted in Search Console.
    if (new URL(siteUrl).pathname === "/") {
      writeFileSync(
        join(dir, "robots.txt"),
        `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`,
      );
    }
  },
});

export default defineConfig({
  // The path of the site URL (scripts/lib/site-url.ts); SITE_URL moves it to another host.
  base: new URL(siteUrl).pathname,
  plugins: [react(), pageFiles()],
  // The same registry URL the items are built with (REGISTRY_URL overrides both).
  define: { "import.meta.env.VITE_REGISTRY_URL": JSON.stringify(registryUrl) },
  resolve: {
    alias: [
      {
        // The site runs on the component source, like Storybook, so it needs no package build.
        find: /^@nudge-icons\/react$/,
        replacement: fileURLToPath(new URL("../../packages/react/src/index.ts", import.meta.url)),
      },
    ],
  },
});
