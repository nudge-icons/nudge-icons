import { href, Link } from "../router";
import { useSettings } from "../settings";
import { Logo } from "./logo";

const REPO = "https://github.com/dimon85/nudge-icons";

/** The official GitHub mark (Octicons `mark-github`), used only to link to the repository. */
function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

// Geometry of `sun` and `moon` from icon batch 0. Swap for the library components once
// that batch is merged. The button shows the theme it switches to.
function ThemeGlyph({ to }: { to: "light" | "dark" }) {
  return (
    <svg
      className="theme-glyph"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {to === "dark" ? (
        <path className="theme-moon" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
      ) : (
        <>
          <circle cx="12" cy="12" r="4" />
          <path
            className="theme-rays"
            d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"
          />
        </>
      )}
    </svg>
  );
}

export function Header() {
  const { theme, setTheme } = useSettings();
  return (
    <header className="header">
      <Link to={href({ page: "gallery" })} className="brand" aria-label="nudge-icons home">
        <Logo />
        <span>nudge-icons</span>
      </Link>
      <nav className="header-actions">
        <button
          type="button"
          className="btn btn-icon theme-button"
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <ThemeGlyph to={theme === "light" ? "dark" : "light"} />
        </button>
        <a className="btn btn-icon" href={REPO} aria-label="nudge-icons on GitHub">
          <GitHubMark />
        </a>
      </nav>
    </header>
  );
}
