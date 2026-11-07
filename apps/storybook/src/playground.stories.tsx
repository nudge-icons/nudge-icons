import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Animate } from "@nudge-icons/react";
import { ICONS, iconByName } from "./icons";

interface PlaygroundProps {
  name: string;
  /** "outline", "filled" or "half"; falls back to an error when the icon has no such variant. */
  variant: string;
  /** "hover", "loop", "once", "false" or a number of loops; a string so it fits in the URL. */
  animate: string;
  active: boolean;
  size: number;
}

const toAnimate = (value: string): Animate =>
  value === "false" ? false : /^\d+$/.test(value) ? Number(value) : (value as Animate);

/** One live icon, driven by args; the Playwright tests open it with ?args=. */
function Playground({ name, variant, animate, active, size }: PlaygroundProps) {
  const icon = iconByName(name);
  const Icon = icon.variants.find((v) => v.variant === variant)?.Icon;
  if (!Icon) throw new Error(`${name} has no ${variant} variant`);
  return (
    <Icon
      data-testid="icon"
      size={size}
      animate={toAnimate(animate)}
      {...(icon.toggle ? { active } : {})}
    />
  );
}

const meta = {
  title: "Testing/Playground",
  component: Playground,
  args: { name: "bell", variant: "outline", animate: "hover", active: false, size: 96 },
  argTypes: {
    name: { control: "select", options: ICONS.map((i) => i.name) },
    variant: { control: "select", options: ["outline", "filled", "half"] },
    animate: { control: "select", options: ["hover", "loop", "once", "3", "false"] },
  },
  // Live motion, not a visual baseline.
  parameters: { chromatic: { disableSnapshot: true } },
} satisfies Meta<typeof Playground>;
export default meta;

export const Live: StoryObj<typeof meta> = {};
