import { expect, test } from "@playwright/test";
import list from "@nudge-icons/svg/icons.json" with { type: "json" };
import { attached, open, partStyles, running, settled, update } from "./playground";

// Every exported component: each icon in each of its variants.
const components = list.flatMap((i) =>
  i.variants.map((v) => ({
    name: i.name,
    variant: v.variant,
    component: v.component,
    toggle: "toggle" in i,
  })),
);
const toggles = components.filter((c) => c.toggle);

// Hover runs in real time, so it would grow with every batch. It covers the components of the
// latest release (the batch under review) and the first component of every motion preset;
// older icons keep their snapshots in Chromatic and their rules in check:icons.
type Listed = (typeof list)[number];
type Animation = { motion?: { preset: string }[] };
const animationOf = (icon: Listed, variant: string): Animation => {
  const own = (icon as Record<string, unknown>)[variant] as { animation?: Animation } | undefined;
  return own?.animation ?? (icon.animation as Animation);
};
// "0.10.0" after "0.9.0": compare each number, padded, as text.
const sortable = (v: string) => v.replace(/\d+/g, (n) => n.padStart(6, "0"));
const latest = list.map((i) => i.since).sort((a, b) => sortable(b).localeCompare(sortable(a)))[0];
const seenPresets = new Set<string>();
const hoverSample = components.filter(({ name, variant }) => {
  const icon = list.find((i) => i.name === name);
  if (!icon) return false;
  const presets = (animationOf(icon, variant).motion ?? []).map((m) => m.preset);
  const firstOfPreset = presets.some((p) => !seenPresets.has(p));
  presets.forEach((p) => seenPresets.add(p));
  return icon.since === latest || firstOfPreset;
});

test.describe("animate", () => {
  test("hover plays each sampled component while the pointer is over it and stops after", async ({
    page,
  }) => {
    await open(page, { name: "bell", variant: "outline", animate: "hover" });
    const rest = await partStyles(page);
    for (const { name, variant, component } of hoverSample) {
      // Explicit, because icons with a second state default to animate={false}.
      await update(page, { name, variant, animate: "hover" });
      await page.mouse.move(0, 0);
      await settled(page);
      await page.getByTestId("icon").hover();
      await expect
        .poll(async () => (await running(page)).length, { message: component })
        .toBeGreaterThan(0);
      await page.mouse.move(0, 0);
      await settled(page);
    }
    await update(page, { name: "bell", variant: "outline" });
    await settled(page);
    expect(await partStyles(page)).toEqual(rest);
  });

  test("eye blinks and looks around (CSS d morph and transform together)", async ({ page }) => {
    await open(page, { name: "eye", animate: "once" });
    const parts = new Set((await running(page)).map((a) => a.part));
    expect(parts).toEqual(new Set(["outline", "pupil"]));
    await settled(page);
    expect(await attached(page)).toBe(0);
  });

  test("once plays on mount, then leaves the drawing exactly at rest", async ({ page }) => {
    await open(page, { name: "bell", animate: "false" });
    const rest = await partStyles(page);
    await open(page, { name: "bell", animate: "once" });
    const moving = await running(page);
    expect(moving.length).toBeGreaterThan(0);
    expect(moving.every((a) => a.iterations < 1.01)).toBe(true);
    await settled(page);
    // No animation left holding its last frame, so the lines are drawn crisp again.
    expect(await attached(page)).toBe(0);
    expect(await partStyles(page)).toEqual(rest);
  });

  test("loop repeats without end", async ({ page }) => {
    await open(page, { name: "bell", animate: "loop" });
    const moving = await running(page);
    expect(moving.length).toBeGreaterThan(0);
    expect(moving.every((a) => a.iterations === Infinity)).toBe(true);
    await page.waitForTimeout(2500);
    expect((await running(page)).length).toBe(moving.length);
  });

  test("a number plays the loop that many times", async ({ page }) => {
    await open(page, { name: "check", animate: "3" });
    const moving = await running(page);
    expect(moving.length).toBeGreaterThan(0);
    expect(moving.every((a) => a.iterations === 3)).toBe(true);
    await settled(page, 10_000);
    expect(await attached(page)).toBe(0);
  });

  test("false never moves, even on hover", async ({ page }) => {
    await open(page, { name: "bell", animate: "false" });
    await page.getByTestId("icon").hover();
    await page.waitForTimeout(300);
    expect(await running(page)).toEqual([]);
  });
});

test.describe("active", () => {
  for (const { name, variant, component } of toggles) {
    test(`${component} turns active and back with transitions`, async ({ page }) => {
      await open(page, { name, variant, animate: "false" });
      const rest = await partStyles(page);
      await update(page, { active: true });
      await expect.poll(async () => (await running(page)).length).toBeGreaterThan(0);
      await settled(page);
      expect(await partStyles(page)).not.toEqual(rest);
      await update(page, { active: false });
      await settled(page);
      expect(await partStyles(page)).toEqual(rest);
    });
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("loop does not move", async ({ page }) => {
    await open(page, { name: "bell", animate: "loop" });
    await page.waitForTimeout(300);
    expect(await running(page)).toEqual([]);
  });

  test("hover does not move", async ({ page }) => {
    await open(page, { name: "bell", animate: "hover" });
    await page.getByTestId("icon").hover();
    await page.waitForTimeout(300);
    expect(await running(page)).toEqual([]);
  });

  test("active switches instantly", async ({ page }) => {
    await open(page, { name: "menu", animate: "false" });
    const rest = await partStyles(page);
    await update(page, { active: true });
    await expect.poll(() => partStyles(page)).not.toEqual(rest);
    expect(await running(page)).toEqual([]);
  });
});
