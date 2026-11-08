// Site-wide addresses. Values used by one component stay next to it.

import { REPO_URL } from "../../../../scripts/lib/project.ts";

export { REPO_URL };

/** Where scripts/build-registry.ts output is served: the shadcn registry, and vue/ under it. */
export const REGISTRY_URL = import.meta.env.VITE_REGISTRY_URL;

export const ISSUES_URL = `${REPO_URL}/issues`;
export const NEW_ISSUE_URL = `${REPO_URL}/issues/new`;
export const CONTRIBUTING_URL = `${REPO_URL}/blob/main/CONTRIBUTING.md`;
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;
export const SKILL_URL = `${REPO_URL}/tree/main/skills/nudge-icons`;
