import * as Icons from "@nudge-icons/react";
import type { ToggleIconComponent } from "@nudge-icons/react";
import list from "@nudge-icons/svg/icons.json";
import {
  compareVersions,
  relatedEntries,
  searchEntries,
  type Filter,
  type Sort,
  type Variant,
} from "./search";

export type { Filter, Sort, Variant };

export interface MotionStep {
  part: string;
  preset: string;
}

export interface Animation {
  name: string;
  description: string;
  parts: string[];
  motion: MotionStep[];
}

export type EquivalentSet = "lucide" | "heroicons" | "tabler" | "phosphor" | "material";

interface IconMeta {
  name: string;
  category: string;
  tags: string[];
  since: string;
  equivalents: Partial<Record<EquivalentSet, string[]>>;
  animation: Animation;
  toggle?: { description: string; parts: string[] };
  filled?: { animation?: Animation };
  half?: { animation?: Animation };
  variants: { variant: Variant; id: string; component: string }[];
}

export interface IconMetaEntry extends IconMeta {
  hasToggle: boolean;
  isNew: boolean;
}

/**
 * One drawing the gallery shows: an icon in one variant. `heart`, `heart-filled` and
 * `heart-half` are three entries of one icon, so filled and half are found like any other.
 */
export interface Entry {
  id: string;
  variant: Variant;
  /** Export name: `Heart`, `HeartFilled`. */
  component: string;
  Icon: ToggleIconComponent;
  /** A variant may move differently, for example when the animated detail is a hole. */
  animation: Animation;
  icon: IconMetaEntry;
  /** Every variant of the same icon, outline first. */
  siblings: () => Entry[];
}

export const SET_NAMES: Record<EquivalentSet, string> = {
  lucide: "Lucide",
  heroicons: "Heroicons",
  tabler: "Tabler",
  phosphor: "Phosphor",
  material: "Material Symbols",
};

const byName = Icons as unknown as Record<string, ToggleIconComponent | undefined>;

const META = list as unknown as IconMeta[];

/** The latest release that added icons; its icons are shown as new. */
export const LATEST = META.map((m) => m.since).reduce((a, b) =>
  compareVersions(a, b) >= 0 ? a : b,
);

export const ENTRIES: Entry[] = META.flatMap((meta) => {
  const icon: IconMetaEntry = {
    ...meta,
    hasToggle: meta.toggle !== undefined,
    // Nothing is new while every icon comes from the same, first release.
    isNew: meta.since === LATEST && META.some((m) => m.since !== LATEST),
  };
  const own: Entry[] = meta.variants.map((v) => {
    const Icon = byName[v.component];
    if (!Icon) throw new Error(`@nudge-icons/react has no export ${v.component}`);
    const override = v.variant === "outline" ? undefined : meta[v.variant]?.animation;
    return {
      id: v.id,
      variant: v.variant,
      component: v.component,
      Icon,
      animation: override ?? meta.animation,
      icon,
      siblings: () => own,
    };
  });
  return own;
});

export const ENTRY_BY_ID = new Map(ENTRIES.map((e) => [e.id, e]));

/** Categories in a fixed order, counted from the current set, so new icons show up on their own. */
const CATEGORY_ORDER = ["actions", "interface", "status", "objects"];
export const CATEGORIES = [...new Set(ENTRIES.map((e) => e.icon.category))]
  .sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  })
  .map((name) => ({ name, count: ENTRIES.filter((e) => e.icon.category === name).length }));

// "New" only makes sense once there is an older release to compare with.
export const FILTERS: { id: Filter; label: string; hint: string; count: number }[] = (
  [
    {
      id: "new",
      label: "New",
      hint: `Added in ${LATEST}`,
      count: ENTRIES.filter((e) => e.icon.isNew).length,
    },
    {
      id: "toggle",
      label: "Second state",
      hint: "Icons with an active prop that switches to a second drawing, like menu to a cross",
      count: ENTRIES.filter((e) => e.icon.hasToggle).length,
    },
    {
      id: "filled",
      label: "Filled",
      hint: "Solid versions, for selected or on states",
      count: ENTRIES.filter((e) => e.variant === "filled").length,
    },
    {
      id: "half",
      label: "Half",
      hint: "Half filled, for ratings",
      count: ENTRIES.filter((e) => e.variant === "half").length,
    },
  ] as const satisfies readonly { id: Filter; label: string; hint: string; count: number }[]
).filter((f) => f.count > 0);

/** Sorting by release only helps when some icons are newer than others. */
export const HAS_NEW = ENTRIES.some((e) => e.icon.isNew);

export const search = (
  query: string,
  category: string | null,
  filters: ReadonlySet<Filter>,
  sort: Sort,
) => searchEntries(ENTRIES, query, category, filters, sort);

export const related = (entry: Entry) => relatedEntries(ENTRIES, entry);
