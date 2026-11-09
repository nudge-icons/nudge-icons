import { useState } from "react";
import { Refresh } from "@nudge-icons/react";
import { CORE_DIR, ICONS_DIR } from "../../../../scripts/lib/registry-layout.ts";
import { themeLabel, type Entry } from "../lib/data";
import { galleryHref, href, Link } from "../state/router";
import { forIcon, toAnimate, useSettings } from "../state/settings";
import {
  contextSnippet,
  installCommand,
  registryCommand,
  PART_COLOR,
  partsCss,
} from "../lib/snippets";
import { CodeBlock, CopyButton, FrameworkSwitch, Segmented, Switch } from "../components/controls";
import { AppearanceFields, Field, MODES, ResetButton } from "../components/customizer";
import { Blueprint } from "../components/blueprint";
import { IconView } from "../components/icon-view";
import { useReplay } from "../state/replay";
import { CodeTabs, type CodeTab } from "../components/icon-page/code-tabs";
import { Equivalents } from "../components/icon-page/equivalents";
import { InContext } from "../components/icon-page/in-context";
import { MoreLikeThis } from "../components/icon-page/more-like-this";
import { SmallSizeTest } from "../components/icon-page/small-size-test";

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

  const parts = [...new Set([...animation.parts, ...(icon.toggle?.parts ?? [])])];

  return (
    <main className="icon-page" id="main">
      <Link to={galleryHref()} className="back">
        ← All icons
      </Link>
      <header className="icon-head">
        <h1>{entry.id}</h1>
        {/* One row: the category first, then themes, the second state and the search tags. */}
        <ul className="tags" role="list" aria-label="Category, themes and tags">
          <li>
            <Link
              to={`${href({ page: "gallery" })}?category=${icon.category}`}
              className="tag capitalize"
              title={`All ${icon.category} icons`}
            >
              {icon.category}
            </Link>
          </li>
          {(icon.themes ?? []).map((t) => (
            <li key={t}>
              <Link
                to={`${href({ page: "gallery" })}?theme=${t}`}
                className="tag"
                title={`All ${themeLabel(t)} icons`}
              >
                {themeLabel(t)}
              </Link>
            </li>
          ))}
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
          {/* A tag that repeats a theme ("ai") is already shown as the theme link. */}
          {icon.tags
            .filter((t) => !(icon.themes ?? []).includes(t))
            .map((t) => (
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
