// Checks every icon in icons/ against the drawing rules. Exits with 1 on any violation.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checkIcon } from "./lib/icon-rules.ts";

const dir = join(import.meta.dirname, "..", "icons");
const names = readdirSync(dir)
  .filter((f) => f.endsWith(".svg"))
  .map((f) => f.slice(0, -4))
  .sort();

let failed = 0;
for (const name of names) {
  let meta: unknown = null;
  try {
    meta = JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8"));
  } catch {
    // Reported by checkIcon as missing metadata.
  }
  const errors = checkIcon(name, readFileSync(join(dir, `${name}.svg`), "utf8"), meta);
  if (errors.length) {
    failed++;
    console.log(`✗ ${name}`);
    for (const e of errors) console.log(`    ${e}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

console.log(`\n${names.length - failed}/${names.length} icons pass`);
if (failed) process.exitCode = 1;
