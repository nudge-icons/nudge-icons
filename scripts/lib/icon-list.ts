// Every icon variant with its motion, read from packages/svg/icons.json (written by
// build-icons.ts). Used by the site build for page tags and by build-og-images.ts.
import { readFileSync } from "node:fs";
import { join } from "node:path";

interface Animation {
  name: string;
  description: string;
}

interface ListedIcon {
  name: string;
  animation: Animation;
  filled?: { animation?: Animation };
  half?: { animation?: Animation };
  variants: { variant: "outline" | "filled" | "half"; id: string; component: string }[];
}

export interface IconVariantInfo {
  /** Kebab id of the variant: `heart-filled`. */
  id: string;
  variant: "outline" | "filled" | "half";
  /** The variant's own motion, or the outline's when it has none. */
  motion: Animation;
}

export const svgPackage = join(import.meta.dirname, "..", "..", "packages", "svg");

export function iconVariants(): IconVariantInfo[] {
  const list = JSON.parse(readFileSync(join(svgPackage, "icons.json"), "utf8")) as ListedIcon[];
  return list.flatMap((icon) =>
    icon.variants.map((v) => ({
      id: v.id,
      variant: v.variant,
      motion: (v.variant === "outline" ? undefined : icon[v.variant]?.animation) ?? icon.animation,
    })),
  );
}
