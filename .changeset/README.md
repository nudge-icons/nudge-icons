# Changesets

Every change to a published package comes with a changeset: `pnpm changeset`, then pick the bump and describe the change for users. `@nudge-icons/react`, `@nudge-icons/vue` and `@nudge-icons/svg` share one version, so one changeset bumps all three. A batch of new icons is a minor release, and the `since` field of its icons is that version.

Release: `pnpm version-packages` updates versions and changelogs, then `pnpm release` builds and publishes.
