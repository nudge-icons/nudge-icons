// Checks the manifests of the published packages against one source: the repository and
// author in scripts/lib/project.ts and the site address in scripts/lib/site-url.ts. JSON
// cannot import those constants, so this keeps the addresses on npm from drifting.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AUTHOR, PACKAGES, REPO_URL } from "./lib/project.ts";
import { siteUrl } from "./lib/site-url.ts";

interface Manifest {
  name?: string;
  version?: string;
  homepage?: string;
  license?: string;
  author?: string;
  bugs?: { url?: string };
  repository?: { type?: string; url?: string; directory?: string };
  files?: string[];
  scripts?: Record<string, string>;
  publishConfig?: { access?: string };
}

const root = join(import.meta.dirname, "..");
const problems: string[] = [];
const versions = new Set<string>();

for (const pkg of PACKAGES) {
  const dir = join(root, "packages", pkg);
  const m = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as Manifest;
  const fail = (what: string) => problems.push(`packages/${pkg}: ${what}`);
  if (m.name !== `@nudge-icons/${pkg}`) fail(`name should be @nudge-icons/${pkg}`);
  if (m.version) versions.add(m.version);
  if (!m.homepage?.startsWith(siteUrl)) fail(`homepage should start with ${siteUrl}`);
  if (m.repository?.url !== `git+${REPO_URL}.git`)
    fail(`repository.url should be git+${REPO_URL}.git`);
  if (m.repository?.directory !== `packages/${pkg}`)
    fail(`repository.directory should be packages/${pkg}`);
  if (m.bugs?.url !== `${REPO_URL}/issues`) fail(`bugs.url should be ${REPO_URL}/issues`);
  if (m.license !== "MIT") fail("license should be MIT");
  if (m.author !== AUTHOR) fail(`author should be ${AUTHOR}`);
  if (m.publishConfig?.access !== "public")
    fail("publishConfig.access should be public (scoped package)");
  for (const file of ["LICENSE", "README.md"]) {
    if (!m.files?.includes(file)) fail(`files should include ${file}`);
  }
  if (!existsSync(join(dir, "README.md"))) fail("README.md is missing");
  if (!m.scripts?.prepack?.includes("LICENSE")) fail("prepack should copy the root LICENSE");
}
if (versions.size > 1)
  problems.push(`the packages are released together but have versions ${[...versions].join(", ")}`);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`${PACKAGES.length}/${PACKAGES.length} package manifests match the project`);
