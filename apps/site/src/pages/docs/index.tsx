import type { ReactNode } from "react";
import { DOCS, type DocSection, type DocSlug } from "../../lib/docs";
import { href, Link } from "../../state/router";
import { AccessibilityDoc } from "./accessibility";
import { GettingStartedDoc } from "./getting-started";
import { LicenseDoc } from "./license";
import { MigrateFromLucideDoc } from "./migrate-from-lucide";
import { StylingDoc } from "./styling";
import { SupportDoc } from "./support";

const CONTENT: Record<DocSlug, () => ReactNode> = {
  "getting-started": GettingStartedDoc,
  styling: StylingDoc,
  accessibility: AccessibilityDoc,
  "migrate-from-lucide": MigrateFromLucideDoc,
  license: LicenseDoc,
  support: SupportDoc,
};

const isSlug = (slug: string): slug is DocSlug => slug in CONTENT;

/** A doc section with the section menu beside it (above it on phones). */
export function DocsPage({ doc }: { doc: DocSection }) {
  const Content = isSlug(doc.slug) ? CONTENT[doc.slug] : null;
  const index = DOCS.findIndex((d) => d.slug === doc.slug);
  const prev = index > 0 ? DOCS[index - 1] : undefined;
  const next = DOCS[index + 1];
  return (
    <div className="docs">
      <nav className="docs-nav" aria-label="Docs">
        <ul role="list">
          {DOCS.map((d) => (
            <li key={d.slug}>
              <Link
                to={href({ page: "doc", slug: d.slug })}
                aria-current={d.slug === doc.slug ? "page" : undefined}
              >
                {d.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="docs-main" id="main">
        <article className="prose">
          <h1>{doc.title}</h1>
          <p className="lead">{doc.description}</p>
          {Content && <Content />}
        </article>
        {(prev ?? next) && (
          <nav className="docs-pager" aria-label="Previous and next">
            {prev && (
              <Link
                to={href({ page: "doc", slug: prev.slug })}
                className="docs-pager-link"
                rel="prev"
              >
                <span className="hint">Previous</span>
                {"←\u00a0"}
                {prev.title}
              </Link>
            )}
            {next && (
              <Link
                to={href({ page: "doc", slug: next.slug })}
                className="docs-pager-link is-next"
                rel="next"
              >
                <span className="hint">Next</span>
                {next.title}
                {"\u00a0→"}
              </Link>
            )}
          </nav>
        )}
      </main>
    </div>
  );
}
