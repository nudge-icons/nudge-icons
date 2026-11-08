// Where the site and the shadcn registry are served (the Vue registry is under r/vue/). The
// registry build writes these into the items, the site shows them in the install command.
// SITE_URL moves both; REGISTRY_URL moves only the registry, for example to test
// `shadcn add` against a local server.
const noSlash = (url: string) => url.replace(/\/+$/, "");

export const siteUrl = `${noSlash(process.env.SITE_URL ?? "https://dimon85.github.io/nudge-icons")}/`;

export const registryUrl = noSlash(process.env.REGISTRY_URL ?? `${siteUrl}r`);
