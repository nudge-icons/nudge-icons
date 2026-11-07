// Checks that every id in icons/*.json "equivalents" exists in the published icon set.
// The sets are dev dependencies, so updating one re-checks every mapping. Exits with 1 on errors.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ICON_SETS, type IconMeta, type IconSet } from "./lib/icon-rules.ts";

const root = join(import.meta.dirname, "..");
const pkg = (name: string, ...path: string[]) => join(root, "node_modules", name, ...path);
const svgNames = (dir: string) =>
  new Set(
    readdirSync(dir)
      .filter((f) => f.endsWith(".svg"))
      .map((f) => f.slice(0, -4)),
  );
const pascal = (id: string) =>
  id
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");

// Lucide also exports old names as aliases (Loader2 for loader-circle); accept those too.
const lucideFiles = svgNames(pkg("lucide-static", "icons"));
const lucideExports = new Set(
  readFileSync(pkg("lucide-static", "dist", "lucide-static.d.ts"), "utf8").match(
    /\b[A-Z][A-Za-z0-9]*\b/g,
  ),
);
const materialNames = new Set(
  [...readFileSync(pkg("material-symbols", "index.d.ts"), "utf8").matchAll(/"([a-z0-9_]+)"/g)].map(
    (m) => m[1],
  ),
);

const heroicons = svgNames(pkg("heroicons", "24", "outline"));
const tabler = svgNames(pkg("@tabler/icons", "icons", "outline"));
const phosphor = svgNames(pkg("@phosphor-icons/core", "assets", "regular"));

const exists: Record<IconSet, (id: string) => boolean> = {
  lucide: (id) => lucideFiles.has(id) || lucideExports.has(pascal(id)),
  heroicons: (id) => heroicons.has(id),
  tabler: (id) => tabler.has(id),
  phosphor: (id) => phosphor.has(id),
  material: (id) => materialNames.has(id),
};

const dir = join(root, "icons");
let errors = 0;
let checked = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const meta = JSON.parse(readFileSync(join(dir, file), "utf8")) as IconMeta;
  for (const set of ICON_SETS) {
    for (const id of meta.equivalents?.[set] ?? []) {
      checked++;
      if (!exists[set](id)) {
        errors++;
        console.log(`✗ ${meta.name}: ${set} has no icon "${id}"`);
      }
    }
  }
}

console.log(`${checked - errors}/${checked} equivalents found in their icon sets`);
if (errors) process.exitCode = 1;
