import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";

// A two-route site does not need a router library: paths are read from location and
// links push history entries. BASE_URL is "/nudge-icons/" on GitHub Pages.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export type Route = { page: "gallery" } | { page: "icon"; name: string };

export function parse(pathname: string): Route {
  const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  const m = /^\/icons\/([a-z0-9-]+)\/?$/.exec(path);
  return m?.[1] ? { page: "icon", name: m[1] } : { page: "gallery" };
}

export const href = (route: Route): string =>
  route.page === "icon" ? `${BASE}/icons/${route.name}` : `${BASE}/`;

const listeners = new Set<() => void>();

export function navigate(to: string, { replace = false } = {}) {
  if (replace) history.replaceState(null, "", to);
  else history.pushState(null, "", to);
  listeners.forEach((l) => l());
}

export function useLocation() {
  const [loc, setLoc] = useState(() => ({ pathname: location.pathname, search: location.search }));
  useEffect(() => {
    const update = () => setLoc({ pathname: location.pathname, search: location.search });
    listeners.add(update);
    addEventListener("popstate", update);
    return () => {
      listeners.delete(update);
      removeEventListener("popstate", update);
    };
  }, []);
  return loc;
}

/** A plain link that navigates in place; modified clicks still open a new tab. */
export function Link({
  to,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();
    navigate(to);
    scrollTo(0, 0);
  };
  return <a href={to} onClick={handle} {...rest} />;
}

// The last gallery view (search, filters, sort, selection), so "All icons" returns to it.
let lastGallerySearch = "";

export function rememberGallerySearch(search: string) {
  lastGallerySearch = search;
}

export const galleryHref = () => `${href({ page: "gallery" })}${lastGallerySearch}`;
