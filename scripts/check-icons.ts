// Checks every icon in icons/ and icons/<variant>/ against the drawing rules.
// Exits with 1 on any violation.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checkIcon, PAINTED_VARIANTS, type Variant } from "./lib/icon-rules.ts";

const dir = join(import.meta.dirname, "..", "icons");
const svgNames = (d: string) =>
  existsSync(d)
    ? readdirSync(d)
        .filter((f) => f.endsWith(".svg"))
        .map((f) => f.slice(0, -4))
        .sort()
    : [];

function readMeta(name: string): unknown {
  try {
    return JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8"));
  } catch {
    return null; // Reported by checkIcon as missing metadata.
  }
}

const jobs: Array<{ name: string; variant: Variant; label: string; extra: string[] }> = [];
for (const name of svgNames(dir)) {
  const meta = readMeta(name) as Record<string, unknown> | null;
  const extra = PAINTED_VARIANTS.filter(
    (v) => meta?.[v] !== undefined && !existsSync(join(dir, v, `${name}.svg`)),
  ).map((v) => `metadata has a ${v} block but icons/${v}/<name>.svg is missing`);
  jobs.push({ name, variant: "outline", label: name, extra });
}
for (const variant of PAINTED_VARIANTS) {
  for (const name of svgNames(join(dir, variant))) {
    const extra = existsSync(join(dir, `${name}.svg`))
      ? []
      : [`${variant} icon has no outline icon with the same name`];
    jobs.push({ name, variant, label: `${variant}/${name}`, extra });
  }
}

let failed = 0;
for (const { name, variant, label, extra } of jobs) {
  const file = join(variant === "outline" ? dir : join(dir, variant), `${name}.svg`);
  const errors = [
    ...extra,
    ...checkIcon(name, readFileSync(file, "utf8"), readMeta(name), variant),
  ];
  if (errors.length) {
    failed++;
    console.log(`✗ ${label}`);
    for (const e of errors) console.log(`    ${e}`);
  } else {
    console.log(`✓ ${label}`);
  }
}

console.log(`\n${jobs.length - failed}/${jobs.length} icons pass`);
if (failed) process.exitCode = 1;
