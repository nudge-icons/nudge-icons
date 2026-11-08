import type { Animate } from "@nudge-icons/react";
import type { Entry } from "../data";

/** Renders one gallery entry; `active` is passed only to icons with a second state. */
export function IconView({
  entry,
  size = 24,
  strokeWidth = 2,
  color = null,
  animate,
  active = false,
  title,
}: {
  entry: Entry;
  size?: number;
  strokeWidth?: number;
  color?: string | null;
  animate: Animate;
  active?: boolean;
  title?: string;
}) {
  const { Icon } = entry;
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      animate={animate}
      {...(color !== null && { color })}
      {...(entry.icon.hasToggle && { active })}
      {...(title !== undefined && { title })}
    />
  );
}
