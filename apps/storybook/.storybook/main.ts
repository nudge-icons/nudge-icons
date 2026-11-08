import type { StorybookConfig } from "@storybook/react-vite";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";

// Internal Storybook: a visual test bench for Chromatic and Playwright, not the docs site.
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  framework: "@storybook/react-vite",
  // Serves an MCP endpoint at /mcp on the dev server, so coding agents can find stories,
  // read the docs manifest and get preview links.
  addons: ["@storybook/addon-mcp"],
  core: { disableTelemetry: true },
  // Stories use the component source, so they need no package build first.
  viteFinal: (vite) =>
    mergeConfig(vite, {
      // Storybook's own runtime is one big chunk; that is fine for a test bench.
      build: { chunkSizeWarningLimit: 2000 },
      resolve: {
        alias: [
          {
            find: /^@nudge-icons\/react$/,
            replacement: fileURLToPath(
              new URL("../../../packages/react/src/index.ts", import.meta.url),
            ),
          },
        ],
      },
    }),
};

export default config;
