import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["scripts/**/*.test.ts", "packages/**/*.test.{ts,tsx}", "apps/site/src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
