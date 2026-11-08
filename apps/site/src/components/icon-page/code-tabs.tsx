import { useEffect, useState } from "react";
import type { Entry } from "../../lib/data";
import { reactSnippet, vueSnippet } from "../../lib/snippets";
import { forIcon, useSettings } from "../../state/settings";
import { CodeBlock } from "../controls";

// Raw SVG files from @nudge-icons/svg, loaded only when an icon page asks for one.
const SVG_FILES = import.meta.glob<string>("../../../../../packages/svg/icons/*.svg", {
  query: "?raw",
  import: "default",
});

function useSvgSource(id: string) {
  const [source, setSource] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setSource(null);
    const load = SVG_FILES[`../../../../../packages/svg/icons/${id}.svg`];
    void load?.().then((s) => live && setSource(s.trim()));
    return () => {
      live = false;
    };
  }, [id]);
  return source;
}

export type CodeTab = "code" | "svg";

export function CodeTabs({
  entry,
  tab,
  setTab,
}: {
  entry: Entry;
  tab: CodeTab;
  setTab: (t: CodeTab) => void;
}) {
  const { settings: raw, framework, setFramework } = useSettings();
  const settings = forIcon(raw, entry);
  // React and Vue tabs set the site-wide framework, so every other sample follows.
  const [expanded, setExpanded] = useState(false);
  const svg = useSvgSource(entry.id);
  const component = (framework === "react" ? reactSnippet : vueSnippet)(
    { component: entry.component, hasToggle: entry.icon.hasToggle },
    settings,
  );
  const tabs = [
    { id: "react", label: "React", selected: tab === "code" && framework === "react" },
    { id: "vue", label: "Vue", selected: tab === "code" && framework === "vue" },
    { id: "svg", label: "SVG", selected: tab === "svg" },
  ] as const;

  return (
    <div className="tabs">
      <div className="tab-list" role="tablist" aria-label="Code">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.selected}
            onClick={() => {
              if (t.id === "svg") setTab("svg");
              else {
                setFramework(t.id);
                setTab("code");
              }
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "code" ? (
          <CodeBlock
            label={entry.component}
            code={component}
            lang={framework === "react" ? "tsx" : "vue"}
          />
        ) : (
          <div className={`svg-source ${expanded ? "is-expanded" : ""}`}>
            <CodeBlock label={`${entry.id}.svg · at rest`} code={svg ?? "Loading…"} lang="html" />
            {!expanded && (
              <button
                type="button"
                className="btn btn-ghost btn-sm svg-expand"
                onClick={() => setExpanded(true)}
              >
                Show full SVG
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
