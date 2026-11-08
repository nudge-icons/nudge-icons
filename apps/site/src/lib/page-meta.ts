// Title, description and preview image of every page. The build writes them into each HTML
// file (for search engines and link previews, which do not run JS); the app sets the same
// title when it navigates. No React and no Vite APIs: vite.config.ts imports this module.
import type { Route } from "./routes";

export const SITE_NAME = "nudge-icons";

const SITE_DESCRIPTION =
  "Animated line icons for React and Vue. Each icon has its own small motion, made with CSS only.";

/** What a page needs to know about an icon variant. */
export interface MetaIcon {
  id: string;
  motion: { name: string; description: string };
}

export interface PageMeta {
  title: string;
  description: string;
  /** Path of the preview image inside the site, without the base: og/clock.png. */
  image: string;
  /** Pages that should not be indexed, like not-found. */
  noindex?: boolean;
}

/** `heart-filled` → `Heart filled`. */
const words = (id: string) => {
  const text = id.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const sentence = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);

export const ogImagePath = (name: string) => `og/${name}.png`;

export function pageMeta(route: Route, icon?: MetaIcon): PageMeta {
  if (route.page === "icon" && icon) {
    const name = words(icon.id);
    return {
      title: `${name} animated icon for React and Vue · ${SITE_NAME}`,
      description: `${name} line icon that moves with CSS only: ${sentence(icon.motion.description.charAt(0).toLowerCase() + icon.motion.description.slice(1))} For React and Vue, or as a plain SVG.`,
      image: ogImagePath(icon.id),
    };
  }
  if (route.page === "gallery") {
    return {
      title: `${SITE_NAME}: animated line icons for React and Vue`,
      description: SITE_DESCRIPTION,
      image: ogImagePath("home"),
    };
  }
  return {
    title: `Page not found · ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    image: ogImagePath("home"),
    noindex: true,
  };
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The <head> tags of a page; `url` is its canonical address, `siteUrl` ends with a slash. */
export function headTags(meta: PageMeta, url: string, siteUrl: string): string {
  const image = `${siteUrl}${meta.image}`;
  const tags = [
    `<title>${escape(meta.title)}</title>`,
    `<meta name="description" content="${escape(meta.description)}" />`,
    meta.noindex
      ? `<meta name="robots" content="noindex" />`
      : `<link rel="canonical" href="${escape(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escape(meta.title)}" />`,
    `<meta property="og:description" content="${escape(meta.description)}" />`,
    `<meta property="og:url" content="${escape(url)}" />`,
    `<meta property="og:image" content="${escape(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ];
  return tags.join("\n    ");
}
