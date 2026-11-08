import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bell, Download, Pencil, Refresh, Trash } from "@nudge-icons/react";
import { SET_NAMES, type Entry, type EquivalentSet } from "../data";
import { href, Link } from "../router";
import { forIcon, toAnimate, useSettings } from "../settings";
import { installCommand, reactSnippet, vueSnippet } from "../snippets";
import { CodeBlock, CopyButton, Segmented, Switch } from "../components/controls";
import { AppearanceFields, Field, MODES } from "../components/customizer";
import { IconView } from "../components/icon-view";
import { useReplay } from "../replay";

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
  const [highlight, setHighlight] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${entry.id} · nudge-icons`;
    return () => {
      document.title = "nudge-icons";
    };
  }, [entry.id]);

  const parts = [...new Set([...animation.parts, ...(icon.toggle?.parts ?? [])])];

  return (
    <main className="icon-page" id="main">
      <Link to={href({ page: "gallery" })} className="back">
        ← All icons
      </Link>
      <header className="icon-head">
        <h1>{entry.id}</h1>
        <p className="hint">
          <span className="capitalize">{icon.category}</span> · motion{" "}
          <strong>{animation.name}</strong>
          {icon.toggle && " · second state"}
        </p>
      </header>

      {highlight && (
        // Dims every shape outside the hovered part; part names come from our own metadata.
        <style>{`.parts-preview svg :is(path,circle,ellipse,rect,line,polyline,polygon):not([data-part="${highlight}"],[data-part="${highlight}"] *){opacity:.15}`}</style>
      )}
      <div className="icon-cols">
        <section className="icon-left" aria-label="Preview and settings">
          <div
            className={`preview-300 grid-bg ${paused ? "is-paused" : ""}`}
            key={`${entry.id}-${replay.key}`}
            onAnimationEnd={replay.onAnimationEnd}
          >
            <IconView
              entry={entry}
              size={240}
              strokeWidth={settings.strokeWidth}
              color={settings.color}
              animate={replay.animate}
              active={settings.active}
            />
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
          </div>
        </section>

        <section className="icon-right" aria-label="Code">
          <CodeTabs entry={entry} framework={framework} />

          <h2>Install</h2>
          <div className="install">
            <code>{installCommand(framework)}</code>
            <CopyButton text={installCommand(framework)} />
          </div>

          <h2>In context</h2>
          <InContext entry={entry} />
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
              active={highlight !== null && (icon.toggle?.parts.includes(highlight) ?? false)}
            />
          </div>
          <div className="parts-list">
            <ul className="parts" role="list">
              {parts.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    className="part"
                    onMouseEnter={() => setHighlight(p)}
                    onMouseLeave={() => setHighlight(null)}
                    onFocus={() => setHighlight(p)}
                    onBlur={() => setHighlight(null)}
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
            <CodeBlock
              label="CSS"
              code={`.nudge-${icon.name} [data-part="${highlight ?? parts[0] ?? ""}"] {\n  stroke: #e11d48;\n}`}
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
    </main>
  );
}

function CodeTabs({ entry, framework }: { entry: Entry; framework: "react" | "vue" }) {
  const { settings: raw } = useSettings();
  const settings = forIcon(raw, entry);
  const [tab, setTab] = useState<"component" | "svg">("component");
  const [expanded, setExpanded] = useState(false);
  const svg = useSvgSource(entry.id);
  const component = (framework === "react" ? reactSnippet : vueSnippet)(
    { component: entry.component, hasToggle: entry.icon.hasToggle },
    settings,
  );

  return (
    <div className="tabs">
      <div className="tab-list" role="tablist" aria-label="Code">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "component"}
          onClick={() => setTab("component")}
        >
          {framework === "react" ? "React" : "Vue"} component
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "svg"}
          onClick={() => setTab("svg")}
        >
          SVG
        </button>
      </div>
      <div role="tabpanel">
        {tab === "component" ? (
          <CodeBlock label={entry.component} code={component} />
        ) : (
          <div className={`svg-source ${expanded ? "is-expanded" : ""}`}>
            <CodeBlock label={`${entry.id}.svg · at rest`} code={svg ?? "Loading…"} />
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
  const { icon } = entry;
  return (
    <div className="in-context">
      <div className="ctx-row">
        <button type="button" className="btn btn-primary">
          {view(16)} {icon.name}
        </button>
        <button type="button" className="btn btn-ghost">
          {view(16)} Action
        </button>
        <button type="button" className="btn btn-icon" aria-label={icon.name}>
          {view(20)}
        </button>
      </div>
      <div className="ctx-menu" role="presentation">
        <div className="ctx-item">
          {view(16)} {icon.name}
        </div>
        <div className="ctx-item">
          <Pencil size={16} /> Edit
        </div>
        <div className="ctx-item is-disabled">{view(16)} Disabled item</div>
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

/** Small sizes at real pixels: 1× is the live SVG, 2× a raster of those pixels scaled up without smoothing. */
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
              { value: "2", label: "2×", title: "Raster of the actual pixels, scaled up" },
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
          : "Pixels at 1× scaled up 2× without smoothing: what a non-Retina screen draws."}
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
      <canvas
        ref={canvas}
        width={size}
        height={size}
        className="raster"
        style={{ width: size * 2, height: size * 2 }}
      />
    </>
  );
}
