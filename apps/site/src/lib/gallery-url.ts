// Gallery state in the address: search, category, theme, filters, sort and the selected icon.
// Links can be shared, reloading keeps the view, and returning from an icon page restores it.

import type { Filter, Sort } from "./search";

export interface GalleryState {
  query: string;
  category: string | null;
  theme: string | null;
  filters: ReadonlySet<Filter>;
  sort: Sort;
  icon: string | null;
}

const FILTER_IDS: readonly Filter[] = ["new", "toggle", "filled", "half"];
/** Sort in the address: `?sort=za`, `?sort=newest`; A–Z is the default and left out. */
const SORT_PARAMS: Partial<Record<string, Sort>> = { za: "name-desc", newest: "newest" };

/** Reads the state; values that do not exist (`allowed`) are dropped instead of failing. */
export function parseGalleryUrl(
  search: string,
  allowed: {
    categories: readonly string[];
    themes: readonly string[];
    filters: readonly Filter[];
  },
): GalleryState {
  const p = new URLSearchParams(search);
  const category = p.get("category");
  const theme = p.get("theme");
  const only = (p.get("only") ?? "")
    .split(",")
    .filter(
      (f): f is Filter =>
        (FILTER_IDS as readonly string[]).includes(f) && allowed.filters.includes(f as Filter),
    );
  // Filled and half exclude each other; keep the first one given.
  const variants = only.filter((f) => f === "filled" || f === "half");
  const filters = only.filter((f) => !(f === "filled" || f === "half") || f === variants[0]);
  return {
    query: p.get("q") ?? "",
    category: category !== null && allowed.categories.includes(category) ? category : null,
    theme: theme !== null && allowed.themes.includes(theme) ? theme : null,
    filters: new Set(filters),
    sort: SORT_PARAMS[p.get("sort") ?? ""] ?? "name",
    icon: p.get("icon"),
  };
}

/** Writes only what differs from the defaults, in a fixed order, so equal states give equal links. */
export function galleryQuery(s: GalleryState): string {
  const p = new URLSearchParams();
  if (s.query.trim() !== "") p.set("q", s.query.trim());
  if (s.category !== null) p.set("category", s.category);
  if (s.theme !== null) p.set("theme", s.theme);
  const only = FILTER_IDS.filter((f) => s.filters.has(f));
  if (only.length > 0) p.set("only", only.join(","));
  if (s.sort !== "name") p.set("sort", s.sort === "name-desc" ? "za" : s.sort);
  if (s.icon !== null) p.set("icon", s.icon);
  const text = p.toString().replace(/%2C/g, ",");
  return text === "" ? "" : `?${text}`;
}
