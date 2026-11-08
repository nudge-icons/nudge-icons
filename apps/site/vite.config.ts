import react from "@vitejs/plugin-react";
import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { registryUrl, siteUrl } from "../../scripts/lib/site-url.ts";

// GitHub Pages serves 404.html for unknown paths; a copy of the app lets
// /nudge-icons/icons/bell load the app, which then routes on the client.
const spaFallback = (): Plugin => ({
  name: "spa-fallback",
  apply: "build",
  writeBundle(options) {
    const dir = options.dir ?? "dist";
    copyFileSync(`${dir}/index.html`, `${dir}/404.html`);
  },
});

export default defineConfig({
  // The path of the site URL (scripts/lib/site-url.ts); SITE_URL moves it to another host.
  base: new URL(siteUrl).pathname,
  plugins: [react(), spaFallback()],
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
