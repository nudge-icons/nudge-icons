import { defineConfig, devices } from "@playwright/test";

// Runs against the built Storybook (pnpm build), in real time: CSS animations and
// transitions are measured as the browser plays them.
export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: "http://127.0.0.1:6007" },
  webServer: {
    command: "vite preview --outDir storybook-static --host 127.0.0.1 --port 6007 --strictPort",
    url: "http://127.0.0.1:6007/iframe.html",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
