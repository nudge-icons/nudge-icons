import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bell, Download, Pencil, Refresh, Trash } from "@nudge-icons/react";
import { CORE_DIR, ICONS_DIR } from "../../../../scripts/lib/registry-layout.ts";
import { related, SET_NAMES, type Entry, type EquivalentSet } from "../lib/data";
import { galleryHref, href, Link } from "../state/router";
import { forIcon, toAnimate, useSettings } from "../state/settings";
import {
  contextSnippet,
  humanName,
  installCommand,
  registryCommand,
  PART_COLOR,
  partsCss,
  reactSnippet,
  vueSnippet,
} from "../lib/snippets";
import { CodeBlock, CopyButton, FrameworkSwitch, Segmented, Switch } from "../components/controls";
import { AppearanceFields, Field, MODES, ResetButton } from "../components/customizer";
import { Blueprint } from "../components/blueprint";
import { IconView } from "../components/icon-view";
import { useReplay } from "../state/replay";

// Raw SVG files from @nudge-icons/svg, loaded only when an icon page asks for one.
const SVG_FILES = import.meta.glob<string>("../../../../packages/svg/icons/*.svg", {
  query: "?raw",
  import: "default",
});

function useSvgSource(id: string) {
  const [source, setSource] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setSource(null);
    const load = SVG_FILES[`../../../../packages/svg/icons/${id}.svg`];
    void load?.().then((s) => live && setSource(s.trim()));
    return () => {
      live = false;
    };
  }, [id]);
  return source;
}

export function IconPage({ entry }: { entry: Entry }) {
  const { settings: raw, update, framework } = useSettings();
  const settings = forIcon(raw, entry);
  const { icon, animation } = entry;
  const replay = useReplay(toAnimate(settings.animate));
  const [paused, setPaused] = useState(false);
  // React/Vue code or the raw SVG; with SVG the page shows the SVG package and no JSX.
  const [codeTab, setCodeTab] = useState<CodeTab>("code");
  const [view, setView] = useState<"blueprint" | "clean">("blueprint");
  // Clicked parts stay highlighted; hovering a name previews just that one.
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const shown = hovered !== null ? [hovered] : [...picked];
  const togglePart = (p: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  useEffect(() => {
    document.title = `${entry.id} · nudge-icons`;
    return () => {
      document.title = "nudge-icons";
    };
  }, [entry.id]);

  const parts = [...new Set([...animation.parts, ...(icon.toggle?.parts ?? [])])];

  return (
    <main className="icon-page" id="main">
      <Link to={galleryHref()} className="back">
        ← All icons
      </Link>
      <header className="icon-head">
        <h1>{entry.id}</h1>
        {/* One row: the category first, then the second state, then the search tags. */}
        <ul className="tags" role="list" aria-label="Category and tags">
          <li>
            <Link
              to={`${href({ page: "gallery" })}?category=${icon.category}`}
              className="tag capitalize"
              title={`All ${icon.category} icons`}
            >
              {icon.category}
            </Link>
          </li>
          {icon.toggle && (
            <li>
              <Link
                to={`${href({ page: "gallery" })}?only=toggle`}
                className="tag"
                title="Icons with a second state"
              >
                second state
              </Link>
            </li>
          )}
          {icon.tags.map((t) => (
            <li key={t}>
              <Link
                to={`${href({ page: "gallery" })}?q=${encodeURIComponent(t)}`}
                className="tag"
                title={`Search “${t}”`}
              >
                {t}
              </Link>
            </li>
          ))}
        </ul>
      </header>

      {shown.length > 0 && (
        // The preview shows what the CSS below does: the chosen parts take its colour (filled
        // shapes too), the rest are dimmed. Part names come from our own metadata.
        <style>{`.parts-preview svg :is(${shown
          .map((p) => `[data-part="${p}"],[data-part="${p}"] *`)
          .join(",")}){stroke:${PART_COLOR}}.parts-preview svg :is(${shown
          .map(
            (p) =>
              `[data-part="${p}"] [fill="currentColor"],[data-part="${p}"][fill="currentColor"]`,
          )
          .join(
            ",",
          )}){fill:${PART_COLOR}}.parts-preview svg :is(path,circle,ellipse,rect,line,polyline,polygon):not(${shown
          .map((p) => `[data-part="${p}"],[data-part="${p}"] *`)
          .join(",")}){opacity:.15}`}</style>
      )}
      <div className="icon-cols">
        <section className="icon-left" aria-label="Preview and settings">
          {/* Big preview and the icon at its real size play, replay and pause together. */}
          <div
            className={`preview-stack ${paused ? "is-paused" : ""}`}
            key={`${entry.id}-${replay.key}`}
            onAnimationEnd={replay.onAnimationEnd}
          >
            <Blueprint
              entry={entry}
              mode={view}
              strokeWidth={settings.strokeWidth}
              color={settings.color}
              animate={replay.animate}
              active={settings.active}
            />
            <div className="preview-meta">
              <Segmented
                label="Preview"
                size="sm"
                value={view}
                options={[
                  {
                    value: "blueprint",
                    label: "Blueprint",
                    title:
                      "Grid and safe area. Solid line: stroke centre; dashed: edge of a filled shape",
                  },
                  { value: "clean", label: "Clean" },
                ]}
                onChange={setView}
              />
              <span className="preview-meta-actual">
                Actual size · {settings.size} px
                <span className="actual-box">
                  <IconView
                    entry={entry}
                    size={settings.size}
                    strokeWidth={settings.strokeWidth}
                    color={settings.color}
                    animate={replay.animate}
                    active={settings.active}
                  />
                </span>
              </span>
            </div>
          </div>
          <div className="player">
            <div className="player-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={replay.replay}>
                <Refresh size={16} /> Replay
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-pressed={paused}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? "Play" : "Pause"}
              </button>
            </div>
            <Field label="Play on">
              <Segmented
                label="Play on"
                size="sm"
                value={settings.animate}
                options={MODES}
                onChange={(animate) => update({ animate })}
              />
            </Field>
          </div>
          <p className="motion-line">{animation.description}.</p>

          <div className="compact-customizer">
            <AppearanceFields />
            <Switch
              label="active"
              checked={settings.active}
              disabled={!icon.hasToggle}
              onChange={(active) => update({ active })}
            />
            {icon.toggle && <p className="hint">{icon.toggle.description}.</p>}
            <div className="customizer-footer">
              <ResetButton />
            </div>
          </div>
        </section>

        <section className="icon-right" aria-label="Code">
          <CodeTabs entry={entry} tab={codeTab} setTab={setCodeTab} />

          <h2>Install</h2>
          <div className="install">
            <code>{installCommand(codeTab === "svg" ? "svg" : framework)}</code>
            <CopyButton text={installCommand(codeTab === "svg" ? "svg" : framework)} />
          </div>
          {codeTab === "svg" ? (
            <p className="hint">
              Plain SVG files, at rest: no motion and no second state. For those, use the React or
              Vue component.
            </p>
          ) : (
            <>
              <p className="hint">
                Or copy the source into your project, with no package to install. The first icon
                also adds the shared core to <code>{CORE_DIR}/</code>; then import from{" "}
                <code>
                  @/{ICONS_DIR}/{entry.id}
                </code>
                .
              </p>
              <div className="install registry-install">
                <code>{registryCommand(entry.id, framework)}</code>
                <CopyButton text={registryCommand(entry.id, framework)} />
              </div>
            </>
          )}

          <h2>In context</h2>
          <InContext entry={entry} />
          {/* The in-context code is about components animating with their parent; a plain SVG does not move. */}
          {codeTab === "code" && (
            <CodeBlock
              label="In context"
              toolbar={<FrameworkSwitch />}
              code={contextSnippet(entry.component, entry.id, framework)}
              lang={framework === "react" ? "tsx" : "vue"}
            />
          )}
        </section>
      </div>

      <section className="icon-section">
        <h2>Data parts</h2>
        <p className="hint">
          Every moving part is a separate element with <code>data-part</code>. The names are a
          public styling API: colour or hide single parts with CSS. Hover a name to see the part.
        </p>
        <div className="parts-row">
          <div className="parts-preview grid-bg">
            <IconView
              entry={entry}
              size={96}
              strokeWidth={settings.strokeWidth}
              color={settings.color}
              animate={false}
              active={shown.some((p) => icon.toggle?.parts.includes(p) ?? false)}
            />
          </div>
          <div className="parts-code">
            <div className="parts-block">
              <span className="field-label">Parts · click to select</span>
              <ul className="parts" role="list">
                {parts.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      className="part"
                      aria-pressed={picked.has(p)}
                      onClick={() => togglePart(p)}
                      onMouseEnter={() => setHovered(p)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
              {picked.size > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm parts-clear"
                  onClick={() => setPicked(new Set())}
                >
                  Clear
                </button>
              )}
            </div>
            <CodeBlock
              label="CSS"
              lang="css"
              code={partsCss(
                entry.id,
                shown.length > 0 ? shown : parts.slice(0, 1),
                entry.variant !== "outline",
              )}
            />
          </div>
        </div>
      </section>

      <SmallSizeTest entry={entry} />

      <div className="icon-cols icon-cols-even">
        <section className="icon-section">
          <h2>Same icon elsewhere</h2>
          <Equivalents icon={icon} />
        </section>
        <section className="icon-section">
          <h2>Variants</h2>
          <ul className="variants" role="list">
            {entry.siblings().map((v) => (
              <li key={v.id}>
                <Link
                  to={href({ page: "icon", name: v.id })}
                  className="variant"
                  aria-current={v.id === entry.id ? "page" : undefined}
                >
                  <IconView entry={v} size={32} animate="hover" />
                  <span>{v.component}</span>
                </Link>
              </li>
            ))}
          </ul>
          <h2>Motion</h2>
          <ul className="motion-steps" role="list">
            {animation.motion.map((m, i) => (
              <li key={i}>
                <code>{m.part}</code> · {m.preset}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <MoreLikeThis entry={entry} />
    </main>
  );
}

/** Similar icons by tags, name and category; the same grid cells as the gallery. */
function MoreLikeThis({ entry }: { entry: Entry }) {
  const items = related(entry);
  if (items.length === 0) return null;
  return (
    <section className="icon-section">
      <h2>More like this</h2>
      <ul className="grid" role="list">
        {items.map((e) => (
          <li key={e.id}>
            <Link to={href({ page: "icon", name: e.id })} className="cell">
              <IconView entry={e} animate="hover" />
              <span className="cell-name">{e.id}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

type CodeTab = "code" | "svg";

function CodeTabs({
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

function InContext({ entry }: { entry: Entry }) {
  const view = (size: number) => <IconView entry={entry} size={size} animate="hover" />;
  // Same text as in the code below, so the example and the snippet match.
  const text = humanName(entry.id);
  return (
    <div className="in-context">
      <div className="ctx-row">
        <button type="button" className="btn btn-primary">
          {view(16)} {text}
        </button>
        <button type="button" className="btn btn-ghost">
          {view(16)} Action
        </button>
        <button type="button" className="btn btn-icon" aria-label={text}>
          {view(20)}
        </button>
      </div>
      {/* Menu items animate their icon when the whole row is hovered or focused. */}
      <div className="ctx-menu" role="menu" aria-label="Example menu">
        <div className="ctx-item" role="menuitem" tabIndex={-1}>
          {view(16)} {text}
        </div>
        <div className="ctx-item" role="menuitem" tabIndex={-1}>
          <Pencil size={16} /> Edit
        </div>
        <div className="ctx-item is-disabled" role="menuitem" aria-disabled="true" tabIndex={-1}>
          <IconView entry={entry} size={16} animate={false} /> Disabled item
        </div>
      </div>
      <p className="ctx-text">
        Inline with 14 px text: press {view(14)} to continue, or <Download size={14} /> save it for
        later. Alerts use <Bell size={14} />, removal <Trash size={14} />.
      </p>
    </div>
  );
}

function Equivalents({ icon }: { icon: Entry["icon"] }) {
  const sets = Object.keys(SET_NAMES) as EquivalentSet[];
  return (
    <table className="equivalents">
      <tbody>
        {sets.map((s) => (
          <tr key={s}>
            <th scope="row">{SET_NAMES[s]}</th>
            <td>
              {icon.equivalents[s]?.length ? (
                icon.equivalents[s]?.map((id) => <code key={id}>{id}</code>)
              ) : (
                <span className="hint">no close match</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const SMALL_SIZES = [12, 14, 16, 20] as const;
/** Pixel view scale: large enough to see single pixels and their antialiasing. */
const ZOOM = 4;

/** Small sizes at real pixels: 1× is the live SVG; Pixels is a raster of those pixels, 4× with a grid. */
function SmallSizeTest({ entry }: { entry: Entry }) {
  const { settings } = useSettings();
  const [zoom, setZoom] = useState<"1" | "2">("1");
  const [animating, setAnimating] = useState(false);
  return (
    <section className="icon-section">
      <div className="section-head">
        <h2>Small size test</h2>
        <div className="section-tools">
          <Segmented
            label="Zoom"
            size="sm"
            value={zoom}
            options={[
              { value: "1", label: "1×", title: "Actual pixels · 100%" },
              {
                value: "2",
                label: "Pixels ×4",
                title: "The actual pixels, scaled up with a pixel grid",
              },
            ]}
            onChange={(z) => {
              setZoom(z);
              if (z === "2") setAnimating(false);
            }}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-pressed={animating}
            disabled={zoom === "2"}
            onClick={() => setAnimating((a) => !a)}
          >
            {animating ? "Stop" : "Animate"} <ArrowRight size={14} />
          </button>
        </div>
      </div>
      <p className="hint">
        {zoom === "1"
          ? "Actual pixels · 100%. Animate loops the motion to check that it does not blur together at small sizes."
          : "Each square is one screen pixel at 1×, scaled up 4×. Grey squares are antialiasing: this is what a non-Retina screen draws."}
      </p>
      <div className="small-sizes">
        {SMALL_SIZES.map((s) => (
          <figure key={s}>
            {zoom === "1" ? (
              <IconView
                entry={entry}
                size={s}
                strokeWidth={settings.strokeWidth}
                color={settings.color}
                animate={animating ? "loop" : false}
              />
            ) : (
              <Raster
                entry={entry}
                size={s}
                strokeWidth={settings.strokeWidth}
                color={settings.color}
              />
            )}
            <figcaption>{s}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Raster({
  entry,
  size,
  strokeWidth,
  color,
}: {
  entry: Entry;
  size: number;
  strokeWidth: number;
  color: string | null;
}) {
  const source = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const svg = source.current?.querySelector("svg");
    const ctx = canvas.current?.getContext("2d");
    if (!svg || !ctx) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("color", getComputedStyle(svg).color);
    // The image has no page CSS, so drop what that CSS hides at rest (active-only parts).
    const live = [...svg.querySelectorAll("*")];
    [...clone.querySelectorAll("*")].forEach((el, i) => {
      const node = live[i];
      if (node && getComputedStyle(node).opacity === "0") el.remove();
    });
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }),
    );
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [entry, size, strokeWidth, color]);

  return (
    <>
      <span ref={source} className="raster-source" aria-hidden="true">
        <IconView
          entry={entry}
          size={size}
          strokeWidth={strokeWidth}
          color={color}
          animate={false}
        />
      </span>
      <span className="raster-frame" style={{ width: size * ZOOM, height: size * ZOOM }}>
        <canvas ref={canvas} width={size} height={size} className="raster" />
      </span>
    </>
  );
}
