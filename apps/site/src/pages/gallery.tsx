import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Refresh, Search, Settings as SettingsIcon, X } from "@nudge-icons/react";
import {
  CATEGORIES,
  ENTRIES,
  ENTRY_BY_ID,
  FILTERS,
  HAS_NEW,
  search,
  type Entry,
  type Filter,
  type Sort,
} from "../lib/data";
import { href, Link, navigate, rememberGallerySearch } from "../state/router";
import { galleryQuery, parseGalleryUrl } from "../lib/gallery-url";
import { forIcon, toAnimate, useSettings, type PageMotion } from "../state/settings";
import { installCommand, reactSnippet, vueSnippet } from "../lib/snippets";
import { CodeBlock, CopyButton, FrameworkSwitch, Segmented, Switch } from "../components/controls";
import { ActiveField, AppearanceFields, MotionField, ResetButton } from "../components/customizer";
import { IconView } from "../components/icon-view";
import { useReplay } from "../state/replay";

const PAGE_MOTION = [
  { value: "play", label: "Play" },
  { value: "hover", label: "On hover" },
  { value: "off", label: "Off" },
] as const satisfies readonly { value: PageMotion; label: string }[];

// Apple keyboards show ⌘, others Ctrl.
const MOD_KEY =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";

const pageAnimate = (m: PageMotion) => (m === "play" ? "loop" : m === "hover" ? "hover" : false);

function useIntro() {
  const [shown, setShown] = useState(() => {
    try {
      return localStorage.getItem("nudge-intro-closed") === null;
    } catch {
      return true;
    }
  });
  const close = () => {
    setShown(false);
    try {
      localStorage.setItem("nudge-intro-closed", "1");
    } catch {
      // Not remembered; it shows again next visit.
    }
  };
  return [shown, close] as const;
}

export function GalleryPage({ selected }: { selected: string | null }) {
  const { settings, applyToAll, pageMotion, setPageMotion, framework } = useSettings();
  // The view lives in the address (?q, ?category, ?only, ?sort, ?icon): shareable,
  // kept on reload and restored when coming back from an icon page.
  const [initial] = useState(() =>
    parseGalleryUrl(location.search, {
      categories: CATEGORIES.map((c) => c.name),
      filters: FILTERS.map((f) => f.id),
    }),
  );
  const [query, setQuery] = useState(initial.query);
  const [category, setCategory] = useState<string | null>(initial.category);
  const [filters, setFilters] = useState<ReadonlySet<Filter>>(initial.filters);
  const [sort, setSort] = useState<Sort>(initial.sort);
  // With the New filter every icon is from the same release, so Newest falls back to A–Z.
  const newestUseful = HAS_NEW && !filters.has("new");
  const shownSort: Sort = sort === "newest" && !newestUseful ? "name" : sort;
  const [sheetOpen, setSheetOpen] = useState(false);
  // "Show active" in the second-state note: a quick look at every icon's other drawing.
  const [showActive, setShowActive] = useState(false);
  const [intro, closeIntro] = useIntro();
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // A newly selected icon starts at the top of the panel, where its preview is.
  // Changing settings keeps the scroll position.
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [selected]);

  const results = useMemo(
    () => search(query, category, filters, shownSort),
    [query, category, filters, shownSort],
  );
  const entry = selected ? (ENTRY_BY_ID.get(selected) ?? null) : null;

  // ⌘K / Ctrl K focuses the search, like on most docs sites; "/" works too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      const modK = e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey);
      if (!modK && (e.key !== "/" || typing)) return;
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  // Clicking the selected icon again, Esc or × clears the selection.
  const urlFor = (icon: string | null) =>
    `${href({ page: "gallery" })}${galleryQuery({ query, category, filters, sort: shownSort, icon })}`;
  const select = (name: string | null) => navigate(urlFor(name), { replace: true });

  // Keep the address in step with the view, without adding history entries.
  useEffect(() => {
    const search = galleryQuery({ query, category, filters, sort: shownSort, icon: selected });
    rememberGallerySearch(search);
    if (search !== location.search) navigate(urlFor(selected), { replace: true });
  }, [query, category, filters, shownSort, selected]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target instanceof HTMLInputElement)) select(null);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [selected]);

  // A selection hidden by the search or a filter is cleared, so the panel never shows an
  // icon the grid does not.
  useEffect(() => {
    if (selected && !results.some((e) => e.id === selected)) select(null);
  }, [results, selected]);

  // A card has exactly one variant, so Filled and Half exclude each other; Second state
  // combines with either.
  const toggleFilter = (f: Filter) =>
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else {
        next.add(f);
        if (f === "filled") next.delete("half");
        if (f === "half") next.delete("filled");
      }
      return next;
    });

  // With no icon selected the Customizer styles the whole gallery; with one selected,
  // only when "Apply to all icons" is on.
  const styleGrid = applyToAll || entry === null;
  const cellSize = styleGrid ? Math.min(settings.size, 48) : 24;

  return (
    <div className="gallery-layout">
      <aside className="sidebar" aria-label="Categories and filters">
        <div className="side-group">
          <span className="side-title">Categories</span>
          <button
            type="button"
            className="side-item"
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
          >
            <span>All icons</span>
            <span className="count">{ENTRIES.length}</span>
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              type="button"
              className="side-item"
              aria-pressed={category === c.name}
              onClick={() => setCategory(category === c.name ? null : c.name)}
            >
              <span className="capitalize">{c.name}</span>
              <span className="count">
                {c.count}
                {category === c.name && (
                  <span className="clear-mark" aria-hidden="true">
                    <X size={12} animate={false} />
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="side-group">
          <span className="side-title">Show only</span>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="side-item"
              aria-pressed={filters.has(f.id)}
              title={f.hint}
              onClick={() => toggleFilter(f.id)}
            >
              <span>{f.label}</span>
              <span className="count">
                {f.count}
                {filters.has(f.id) && (
                  <span className="clear-mark" aria-hidden="true">
                    <X size={12} animate={false} />
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="gallery-main" id="main">
        {intro && (
          <div className="intro">
            <p>
              Animated line icons for React and Vue. Each icon has its own small motion, made with
              CSS only — no animation runtime.
            </p>
            <div className="intro-install">
              <code>{installCommand(framework)}</code>
              <CopyButton text={installCommand(framework)} />
            </div>
            <button
              type="button"
              className="btn btn-icon btn-sm intro-close"
              aria-label="Close"
              onClick={closeIntro}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="toolbar">
          <label className="search">
            <Search size={18} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              placeholder={`Search ${ENTRIES.length} icons`}
              aria-keyshortcuts={`${MOD_KEY === "⌘" ? "Meta" : "Control"}+K /`}
              aria-label="Search icons"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && query !== "") {
                  e.stopPropagation();
                  setQuery("");
                }
              }}
            />
            {query !== "" && (
              <button
                type="button"
                className="clear-button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
              >
                <X size={16} animate={false} />
              </button>
            )}
            <kbd className="search-key" title={`Press ${MOD_KEY} K to search`}>
              {MOD_KEY === "⌘" ? "⌘K" : "Ctrl K"}
            </kbd>
          </label>
          <div className="toolbar-motion">
            <span className="field-label">Motion</span>
            <Segmented
              label="Gallery motion"
              size="sm"
              value={pageMotion}
              options={PAGE_MOTION}
              onChange={setPageMotion}
            />
          </div>
        </div>

        <div className="mobile-filters" aria-label="Categories">
          <button
            type="button"
            className="chip"
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
          >
            All {ENTRIES.length}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              type="button"
              className="chip capitalize"
              aria-pressed={category === c.name}
              onClick={() => setCategory(category === c.name ? null : c.name)}
            >
              {c.name} {c.count}
              {category === c.name && (
                <span className="clear-mark" aria-hidden="true">
                  <X size={10} animate={false} />
                </span>
              )}
            </button>
          ))}
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="chip"
              aria-pressed={filters.has(f.id)}
              title={f.hint}
              onClick={() => toggleFilter(f.id)}
            >
              {f.label} {f.count}
              {filters.has(f.id) && (
                <span className="clear-mark" aria-hidden="true">
                  <X size={10} animate={false} />
                </span>
              )}
            </button>
          ))}
        </div>

        {filters.has("toggle") && (
          <div className="note">
            <p>
              These icons have a second drawing, switched by the <code>active</code> prop: the menu
              folds into a cross, the eye gets a slash, the lock opens, copy shows it was copied.
              The change animates both ways.
            </p>
            <Switch label="Show active" checked={showActive} onChange={setShowActive} />
          </div>
        )}

        <div className="gallery-meta">
          <p className="hint">
            {results.length} {results.length === 1 ? "icon" : "icons"} · Hover to animate · Click to
            select
          </p>
          <Segmented
            label="Sort"
            size="sm"
            value={shownSort}
            options={[
              { value: "name", label: "A–Z" },
              { value: "name-desc", label: "Z–A" },
              // Newest only means something when the view mixes releases.
              ...(newestUseful ? [{ value: "newest" as const, label: "Newest" }] : []),
            ]}
            onChange={setSort}
          />
        </div>

        {results.length === 0 ? (
          <div className="empty">
            {query.trim() !== "" ? (
              <>
                <p>No icons match “{query.trim()}”.</p>
                <p className="hint">
                  Names from Lucide, Heroicons, Tabler, Phosphor and Material Symbols work too.
                </p>
              </>
            ) : (
              <p>No icons match these filters.</p>
            )}
            {(category !== null || filters.size > 0) && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setCategory(null);
                  setFilters(new Set());
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <ul className="grid" role="list">
            {results.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="cell"
                  aria-pressed={e.id === selected}
                  aria-label={e.id}
                  onClick={() => select(e.id === selected ? null : e.id)}
                >
                  <IconView
                    entry={e}
                    animate={pageAnimate(pageMotion)}
                    {...(styleGrid && {
                      size: cellSize,
                      strokeWidth: settings.strokeWidth,
                      color: settings.color,
                      active: settings.active,
                    })}
                    {...(showActive && filters.has("toggle") && { active: true })}
                  />
                  <span className="cell-name">{e.id}</span>
                  {e.icon.isNew && <span className="badge-new">new</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <aside
        ref={panelRef}
        className={`panel ${sheetOpen ? "is-open" : ""}`}
        aria-label="Customizer"
      >
        <div className="panel-sheet-bar">
          <span>Customize</span>
          <button
            type="button"
            className="btn btn-icon btn-sm"
            aria-label="Close customizer"
            onClick={() => setSheetOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <Customizer entry={entry} framework={framework} onClear={() => select(null)} />
      </aside>

      <button
        type="button"
        className="btn btn-primary sheet-button"
        onClick={() => setSheetOpen(true)}
      >
        <SettingsIcon size={18} />
        Customize{entry ? ` · ${entry.id}` : ""}
      </button>
    </div>
  );
}

function Customizer({
  entry,
  framework,
  onClear,
}: {
  entry: Entry | null;
  framework: "react" | "vue";
  onClear: () => void;
}) {
  const { settings, applyToAll, setApplyToAll } = useSettings();
  const replay = useReplay(toAnimate(settings.animate));

  return (
    <div className="customizer">
      {entry ? (
        <>
          <div className="panel-head">
            <h2 title={`${entry.id} · details`}>
              <Link to={href({ page: "icon", name: entry.id })} className="panel-title-link">
                {entry.id}
              </Link>
            </h2>
            <button
              type="button"
              className="btn btn-icon btn-sm btn-ghost"
              aria-label="Clear selection"
              title="Clear selection (Esc)"
              onClick={onClear}
            >
              <X size={16} />
            </button>
          </div>
          <div
            className="preview-row"
            key={`${entry.id}-${replay.key}`}
            onAnimationEnd={replay.onAnimationEnd}
          >
            <div className="preview-96 grid-bg">
              <IconView
                entry={entry}
                size={96}
                strokeWidth={settings.strokeWidth}
                color={settings.color}
                animate={replay.animate}
                active={settings.active}
              />
            </div>
            <div className="preview-actual">
              <IconView
                entry={entry}
                size={settings.size}
                strokeWidth={settings.strokeWidth}
                color={settings.color}
                animate={replay.animate}
                active={settings.active}
              />
            </div>
          </div>
          <p className="preview-caption">Preview · 96 px / Actual size · {settings.size} px</p>
          <p className="motion-line">
            <strong>{entry.animation.name}</strong> — {entry.animation.description}
          </p>
          <div className="panel-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={replay.replay}>
              <Refresh size={16} /> Replay
            </button>
            <Link to={href({ page: "icon", name: entry.id })} className="btn btn-sm">
              Details <ArrowRight size={16} />
            </Link>
          </div>
        </>
      ) : (
        <div className="panel-empty">
          <h2>All icons</h2>
          <p className="hint">
            These settings style the whole gallery. Select an icon to preview its motion and copy
            the code.
          </p>
        </div>
      )}

      {entry && (
        <section className="group">
          <h3>Motion</h3>
          <MotionField />
        </section>
      )}
      {entry && (
        <section className="group">
          <h3>State</h3>
          <ActiveField entry={entry} />
        </section>
      )}
      <section className="group">
        <h3>Appearance</h3>
        <AppearanceFields />
      </section>

      <div className="group group-row">
        {entry ? (
          <Switch label="Apply to all icons" checked={applyToAll} onChange={setApplyToAll} />
        ) : (
          <span />
        )}
        <ResetButton />
      </div>

      {entry && (
        <CodeBlock
          label={entry.component}
          toolbar={<FrameworkSwitch />}
          lang={framework === "react" ? "tsx" : "vue"}
          code={(framework === "react" ? reactSnippet : vueSnippet)(
            { component: entry.component, hasToggle: entry.icon.hasToggle },
            forIcon(settings, entry),
          )}
        />
      )}
    </div>
  );
}
