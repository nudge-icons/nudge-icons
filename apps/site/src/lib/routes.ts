// The site's pages as a table of path patterns. The router matches against it, links are
// built from it, and the build writes one HTML file per concrete path, so every page is
// served with status 200 on GitHub Pages. Paths are relative to the site base. No React
// and no Vite APIs here: vite.config.ts imports this module too.

export const ROUTES = {
  gallery: "/",
  icon: "/icons/:name",
} as const;

export type Page = keyof typeof ROUTES;

/** Names of the `:params` in a path pattern. */
type Params<P extends string> = P extends `${string}:${infer K}/${infer Rest}`
  ? K | Params<`/${Rest}`>
  : P extends `${string}:${infer K}`
    ? K
    : never;

export type Route =
  | { [K in Page]: { page: K } & Record<Params<(typeof ROUTES)[K]>, string> }[Page]
  | { page: "not-found" };

const PARAM = /:([a-z]+)/g;
/** A parameter is one kebab-case segment, like icon ids. */
const SEGMENT = "([a-z0-9-]+)";

const MATCHERS = (Object.entries(ROUTES) as [Page, string][]).map(([page, pattern]) => {
  const names = [...pattern.matchAll(PARAM)].map((m) => m[1] ?? "");
  const re = new RegExp(`^${pattern.replace(PARAM, SEGMENT)}/?$`);
  return { page, names, re };
});

/** The route for a path inside the site, or not-found. */
export function matchPath(path: string): Route {
  for (const { page, names, re } of MATCHERS) {
    const m = re.exec(path === "" ? "/" : path);
    if (!m) continue;
    const params = Object.fromEntries(names.map((n, i) => [n, m[i + 1] ?? ""]));
    return { page, ...params } as Route;
  }
  return { page: "not-found" };
}

/** The path of a route inside the site, without the base. */
export function pathFor(route: Exclude<Route, { page: "not-found" }>): string {
  const params = route as unknown as Record<string, string>;
  return ROUTES[route.page].replace(PARAM, (_, name: string) => params[name] ?? "");
}

/** Every concrete page, for the build: static routes and one page per icon. */
export function allPaths(iconIds: readonly string[]): string[] {
  return [pathFor({ page: "gallery" }), ...iconIds.map((name) => pathFor({ page: "icon", name }))];
}
