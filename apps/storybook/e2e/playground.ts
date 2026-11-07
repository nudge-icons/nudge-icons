import { expect, type Page } from "@playwright/test";

export interface Args {
  name?: string;
  variant?: string;
  animate?: string;
  active?: boolean;
}

/** Opens the Testing/Playground story with these args and waits for the icon. */
export async function open(page: Page, args: Args) {
  const query = Object.entries(args)
    .map(([k, v]) => `${k}:${typeof v === "boolean" ? `!${v}` : v}`)
    .join(";");
  await page.goto(`/iframe.html?id=testing-playground--live&viewMode=story&args=${query}`);
  await expect(page.getByTestId("icon")).toBeVisible();
}

/** Changes args of the open story in place, without reloading, like a re-render in an app. */
export async function update(page: Page, args: Args) {
  await page.evaluate((updatedArgs) => {
    const channel = (
      window as unknown as { __STORYBOOK_ADDONS_CHANNEL__: { emit(e: string, p: unknown): void } }
    ).__STORYBOOK_ADDONS_CHANNEL__;
    channel.emit("updateStoryArgs", { storyId: "testing-playground--live", updatedArgs });
  }, args);
}

export interface Running {
  kind: "animation" | "transition";
  part: string | null;
  iterations: number;
}

/** CSS animations and transitions running on the icon right now. */
export const running = (page: Page): Promise<Running[]> =>
  page.getByTestId("icon").evaluate((svg) =>
    svg
      .getAnimations({ subtree: true })
      .filter((a) => a.playState === "running")
      .map((a) => ({
        kind: a instanceof CSSTransition ? ("transition" as const) : ("animation" as const),
        part: (a.effect as KeyframeEffect | null)?.target?.getAttribute("data-part") ?? null,
        iterations: Number(a.effect?.getComputedTiming().iterations),
      })),
  );

/**
 * Animations still attached to the icon in any state. A finished animation that holds its
 * end frame (fill forwards) keeps the part on its own layer, and Chrome draws it blurred.
 */
export const attached = (page: Page): Promise<number> =>
  page.getByTestId("icon").evaluate((svg) => svg.getAnimations({ subtree: true }).length);

/** What CSS decides for each part: the values motion and toggles change. */
export const partStyles = (page: Page): Promise<Record<string, string>> =>
  page.getByTestId("icon").evaluate((svg) =>
    Object.fromEntries(
      [...svg.querySelectorAll("[data-part]")].map((el) => {
        const cs = getComputedStyle(el);
        return [
          el.getAttribute("data-part") ?? "",
          [
            cs.transform,
            cs.opacity,
            cs.strokeDashoffset,
            cs.getPropertyValue("rx"),
            cs.getPropertyValue("d"),
          ].join(" | "),
        ];
      }),
    ),
  );

/** Waits until nothing moves on the icon. */
export async function settled(page: Page, timeout = 5000) {
  await expect.poll(() => running(page), { timeout }).toEqual([]);
}
