import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { registryUrl, siteUrl } from "../../scripts/lib/site-url.ts";
import { allPaths } from "./src/lib/routes.ts";

/**
 * One HTML file per page, so GitHub Pages serves every page with status 200: it maps
 * /icons/bell to icons/bell.html. The app then routes on the client. 404.html, served for
 * every other path, is the same app and shows its not-found page.
 */
const pageFiles = (): Plugin => ({
  name: "page-files",
  apply: "build",
  writeBundle(options) {
    const dir = options.dir ?? "dist";
    const list = JSON.parse(
      readFileSync(new URL("../../packages/svg/icons.json", import.meta.url), "utf8"),
    ) as { variants: { id: string }[] }[];
    const ids = list.flatMap((icon) => icon.variants.map((v) => v.id));
    for (const path of allPaths(ids)) {
      if (path === "/") continue;
      const file = join(dir, `${path.slice(1)}.html`);
      mkdirSync(dirname(file), { recursive: true });
      copyFileSync(join(dir, "index.html"), file);
    }
    copyFileSync(join(dir, "index.html"), join(dir, "404.html"));
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
