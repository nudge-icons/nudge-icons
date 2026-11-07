import * as Icons from "@nudge-icons/react";
import type { ToggleIconComponent } from "@nudge-icons/react";
import list from "@nudge-icons/svg/icons.json";

export interface IconEntry {
  name: string;
  toggle: boolean;
  variants: { variant: string; Icon: ToggleIconComponent }[];
}

// Every export is an icon component; toggle icons are the widest type, and `active` is
// only passed to icons that have a second state.
const byName = Icons as unknown as Record<string, ToggleIconComponent | undefined>;

export const ICONS: IconEntry[] = list.map((meta) => ({
  name: meta.name,
  toggle: "toggle" in meta,
  variants: meta.variants.map(({ variant, component }) => {
    const Icon = byName[component];
    if (!Icon) throw new Error(`@nudge-icons/react has no export ${component}`);
    return { variant, Icon };
  }),
}));

export function iconByName(name: string): IconEntry {
  const icon = ICONS.find((i) => i.name === name);
  if (!icon) throw new Error(`Unknown icon "${name}"`);
  return icon;
}
