import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/storybook-static/**",
      "packages/*/src/generated/**",
      // Not in git and only refreshed by the Storybook scripts, so a stale copy would be linted.
      "apps/storybook/src/generated/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
);
