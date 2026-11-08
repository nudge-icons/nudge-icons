import { ENTRY_BY_ID } from "./lib/data";
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
  switch (route.page) {
    case "icon": {
      const entry = ENTRY_BY_ID.get(route.name);
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
