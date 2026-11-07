// Bundles a single icon import from each built package entry and fails if any other icon
// ends up in the bundle. Run after `pnpm -r build`; prints the minified size of one icon.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";

const root = join(import.meta.dirname, "..");
const icons = JSON.parse(readFileSync(join(root, "packages", "svg", "icons.json"), "utf8")) as {
  variants: { component: string }[];
}[];
const components = icons.flatMap((i) => i.variants.map((v) => v.component));
const PICK = "Heart";

const entries = [
  { pkg: "react", entry: "index", external: ["react", "react/jsx-runtime"] },
  { pkg: "react", entry: "static", external: ["react", "react/jsx-runtime"] },
  { pkg: "vue", entry: "index", external: ["vue"] },
  { pkg: "vue", entry: "static", external: ["vue"] },
];

let failed = false;
for (const { pkg, entry, external } of entries) {
  const dist = join(root, "packages", pkg, "dist", `${entry}.js`);
  const result = await build({
    stdin: { contents: `export { ${PICK} } from ${JSON.stringify(dist)};`, resolveDir: root },
    bundle: true,
    format: "esm",
    minify: true,
    write: false,
    external,
    logLevel: "silent",
  });
  const code = result.outputFiles[0]?.text ?? "";
  // Component names survive minification as display names, so they mark which icons got in.
  const leaked = components.filter((c) => c !== PICK && code.includes(`"${c}"`));
  const label = `@nudge-icons/${pkg}${entry === "index" ? "" : `/${entry}`}`;
  if (leaked.length) {
    failed = true;
    console.log(`✗ ${label}: importing ${PICK} also bundles ${leaked.join(", ")}`);
  } else {
    console.log(`✓ ${label}: ${PICK} alone, ${code.length} bytes minified`);
  }
}
if (failed) process.exitCode = 1;
