import { defineConfig } from "vitest/config";
import { registryUrl } from "./scripts/lib/site-url.ts";

export default defineConfig({
  // As in apps/site/vite.config.ts, for the site's tests.
  define: { "import.meta.env.VITE_REGISTRY_URL": JSON.stringify(registryUrl) },
  test: {
    include: ["scripts/**/*.test.ts", "packages/**/*.test.{ts,tsx}", "apps/site/src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
