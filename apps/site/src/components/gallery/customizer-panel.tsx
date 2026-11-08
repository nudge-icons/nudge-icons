import { ArrowRight, Refresh, X } from "@nudge-icons/react";
import type { Entry } from "../../lib/data";
import { reactSnippet, vueSnippet } from "../../lib/snippets";
import { useReplay } from "../../state/replay";
import { href, Link } from "../../state/router";
import { forIcon, toAnimate, useSettings } from "../../state/settings";
import { CodeBlock, FrameworkSwitch, Switch } from "../controls";
import { ActiveField, AppearanceFields, MotionField, ResetButton } from "../customizer";
import { IconView } from "../icon-view";

/** The gallery side panel: the selected icon, its settings and code, or settings for all. */
export function CustomizerPanel({
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
