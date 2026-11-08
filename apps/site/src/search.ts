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

/** `users` → `user`, so plural and singular names match. */
const stem = (w: string) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);
const nameWords = (name: string) => name.split("-").map(stem);

/**
 * Icons like this one, best first: shared tags weigh most, then a tag that names the
 * other icon, then shared words in the name (`arrow-up`, `arrow-down`, `user`, `users`).
 * When fewer than `min` are found, the rest come from the same category. Only other
 * icons, outline only: variants of the same icon are listed separately.
 */
export function relatedEntries<T extends Searchable>(
  entries: readonly T[],
  current: Searchable,
  { limit = 12, min = 6 } = {},
): T[] {
  const tags = new Set(current.icon.tags.map(stem));
  const words = new Set(nameWords(current.icon.name));
  const others = entries.filter(
    (e) => e.variant === "outline" && e.icon.name !== current.icon.name,
  );
  const scored = others
    .map((e) => {
      const theirWords = nameWords(e.icon.name);
      const score =
        e.icon.tags.filter((t) => tags.has(stem(t))).length * 3 +
        theirWords.filter((w) => tags.has(w)).length * 2 +
        current.icon.tags.filter((t) => theirWords.includes(stem(t))).length * 2 +
        theirWords.filter((w) => words.has(w)).length * 2;
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.e.id.localeCompare(b.e.id))
    .map((x) => x.e);
  const fill =
    scored.length >= min
      ? []
      : others
          .filter((e) => e.icon.category === current.icon.category && !scored.includes(e))
          .sort((a, b) => a.id.localeCompare(b.id))
          .slice(0, min - scored.length);
  return [...scored, ...fill].slice(0, limit);
}
