import { related, type Entry } from "../../lib/data";
import { href, Link } from "../../state/router";
import { IconView } from "../icon-view";

/** Similar icons by tags, name and category; the same grid cells as the gallery. */
export function MoreLikeThis({ entry }: { entry: Entry }) {
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
