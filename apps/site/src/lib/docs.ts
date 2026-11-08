// The documentation sections, in menu order. The menu, the routes, the page tags and the
// sitemap read this list; the content of each section lives in pages/docs/. No React here:
// vite.config.ts imports this module too.

export interface DocSection {
  slug: string;
  title: string;
  /** One sentence for search results and link previews. */
  description: string;
}

export const DOCS = [
  {
    slug: "getting-started",
    title: "Getting started",
    description:
      "Install nudge-icons for React or Vue, or copy the source with the shadcn CLI, and choose when each icon moves.",
  },
  {
    slug: "styling",
    title: "Styling",
    description:
      "Size, colour and stroke props, motion timing through CSS variables, and colouring single parts of an icon.",
  },
  {
    slug: "accessibility",
    title: "Accessibility",
    description:
      "Icons are hidden from screen readers by default, take a title when they carry meaning, and stop moving under reduced motion.",
  },
  {
    slug: "migrate-from-lucide",
    title: "Migrate from Lucide",
    description:
      "The same props as lucide-react, and a table of matching icon names, to switch a project over icon by icon.",
  },
  {
    slug: "license",
    title: "License",
    description:
      "nudge-icons is free to use under the MIT license, in personal and commercial work.",
  },
  {
    slug: "support",
    title: "Support",
    description: "Star the repository, ask for an icon, report a problem or contribute one.",
  },
] as const satisfies readonly DocSection[];

export type DocSlug = (typeof DOCS)[number]["slug"];

export const docBySlug = (slug: string): DocSection | undefined =>
  DOCS.find((d) => d.slug === slug);
