import { useEffect } from "react";
import { ENTRY_BY_ID } from "./lib/data";
import { pageMeta } from "./lib/page-meta";
import { Header } from "./components/header";
import { GalleryPage } from "./pages/gallery";
import { IconPage } from "./pages/icon";
import { href, Link, parse, useLocation } from "./state/router";
import { SettingsProvider } from "./state/settings";

function NotFound({ title }: { title: string }) {
  return (
    <main className="not-found" id="main">
      <h1>{title}</h1>
      <Link to={href({ page: "gallery" })}>← All icons</Link>
    </main>
  );
}

function Routes() {
  const { pathname, search } = useLocation();
  const route = parse(pathname);
  const entry = route.page === "icon" ? ENTRY_BY_ID.get(route.name) : undefined;
  // The same title the build wrote into this page's HTML, kept as the app navigates.
  const title = pageMeta(
    entry ? route : route.page === "icon" ? { page: "not-found" } : route,
    entry && { id: entry.id, motion: entry.animation },
  ).title;
  useEffect(() => {
    document.title = title;
  }, [title]);
  switch (route.page) {
    case "icon": {
      if (!entry) return <NotFound title={`No icon called “${route.name}”`} />;
      return <IconPage key={entry.id} entry={entry} />;
    }
    case "gallery": {
      const selected = new URLSearchParams(search).get("icon");
      return (
        <GalleryPage selected={selected !== null && ENTRY_BY_ID.has(selected) ? selected : null} />
      );
    }
    case "not-found":
      return <NotFound title="Page not found" />;
  }
}

export function App() {
  return (
    <SettingsProvider>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <Routes />
      <footer className="footer">
        <span>MIT License</span>
      </footer>
    </SettingsProvider>
  );
}
