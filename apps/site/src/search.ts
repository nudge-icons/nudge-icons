// Pure gallery search, kept apart from the icon data so it can be tested without components.

export type Variant = "outline" | "filled" | "half";
export type Filter = "toggle" | "filled" | "half";

export interface Searchable {
  /** File id: `heart`, `heart-filled`. */
  id: string;
  variant: Variant;
  icon: {
    name: string;
    category: string;
    tags: readonly string[];
    equivalents: Partial<Record<string, readonly string[]>>;
    hasToggle: boolean;
  };
}

const matches = (e: Searchable, q: string) =>
  e.id.includes(q) ||
  e.icon.tags.some((t) => t.includes(q)) ||
  Object.values(e.icon.equivalents).some((ids) => ids?.some((id) => id.includes(q)));

/**
 * Filters by category and the "Show only" filters, then by the query against the id,
 * tags and names in other sets (so `triangle-alert` finds `alert-triangle`). Entries whose
 * id contains the query come first; the order of the set is kept otherwise.
 */
export function searchEntries<T extends Searchable>(
  entries: readonly T[],
  query: string,
  category: string | null,
  filters: ReadonlySet<Filter>,
): T[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, "-");
  const wantVariants = (["filled", "half"] as const).filter((f) => filters.has(f));
  return entries
    .filter((e) => category === null || e.icon.category === category)
    .filter((e) => !filters.has("toggle") || e.icon.hasToggle)
    .filter((e) => wantVariants.length === 0 || (wantVariants as Variant[]).includes(e.variant))
    .filter((e) => q === "" || matches(e, q))
    .sort((a, b) => (q === "" ? 0 : Number(!a.id.includes(q)) - Number(!b.id.includes(q))));
}
