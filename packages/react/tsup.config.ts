import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/static.ts"],
  format: ["esm"],
  target: "es2022",
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  external: ["react"],
});
