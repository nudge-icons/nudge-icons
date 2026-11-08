import react from "@vitejs/plugin-react";
import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

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
  // Served from https://dimon85.github.io/nudge-icons/. SITE_BASE overrides it for other hosts.
  base: process.env.SITE_BASE ?? "/nudge-icons/",
  plugins: [react(), spaFallback()],
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
