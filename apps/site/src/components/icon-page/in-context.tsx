import { Bell, Download, Pencil, Trash } from "@nudge-icons/react";
import type { Entry } from "../../lib/data";
import { humanName } from "../../lib/snippets";
import { IconView } from "../icon-view";

export function InContext({ entry }: { entry: Entry }) {
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
