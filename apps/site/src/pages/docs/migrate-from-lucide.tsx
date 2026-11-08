import { useMemo, useState } from "react";
import { ENTRIES } from "../../lib/data";
import { href, Link } from "../../state/router";
import { Command, FrameworkCode } from "./parts";
import { useSettings } from "../../state/settings";
import { installCommand } from "../../lib/snippets";

const pascal = (id: string) =>
  id
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");

/** Outline icons with their Lucide names, from the equivalents in the icon data. */
const ROWS = ENTRIES.filter((e) => e.variant === "outline").map((e) => ({
  id: e.id,
  component: e.component,
  lucide: (e.icon.equivalents.lucide ?? []).map(pascal),
}));

export function MigrateFromLucideDoc() {
  const { framework } = useSettings();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[\s-]/g, "");
    if (!q) return ROWS;
    return ROWS.filter((r) =>
      [r.component, ...r.lucide].some((name) => name.toLowerCase().includes(q)),
    );
  }, [query]);
  const matched = ROWS.filter((r) => r.lucide.length > 0).length;

  return (
    <>
      <p>
        nudge-icons is drawn on the same 24-unit grid as Lucide, with a 2-unit stroke and round
        ends, so both sets look right side by side. You can switch one screen at a time.
      </p>

      <h2>Steps</h2>
      <ol>
        <li>
          Install the package: <Command>{installCommand(framework)}</Command>
        </li>
        <li>
          Change the import from <code>lucide-react</code> (or <code>lucide-vue-next</code>) to{" "}
          <code>@nudge-icons/{framework}</code>.
        </li>
        <li>Rename the icons whose names differ, using the table below.</li>
        <li>Run the type checker: it points at every icon that has no counterpart yet.</li>
      </ol>
      <FrameworkCode
        label="Before and after"
        react={`- import { Bell, TriangleAlert } from "lucide-react";\n+ import { Bell, AlertTriangle } from "@nudge-icons/react";`}
        vue={`- import { Bell, TriangleAlert } from "lucide-vue-next";\n+ import { Bell, AlertTriangle } from "@nudge-icons/vue";`}
      />

      <h2>What stays the same</h2>
      <p>
        <code>size</code>, <code>color</code>, <code>strokeWidth</code>,{" "}
        <code>absoluteStrokeWidth</code>, <code>className</code> and other SVG attributes work as in
        Lucide. See <Link to={href({ page: "doc", slug: "styling" })}>Styling</Link>.
      </p>

      <h2>What is different</h2>
      <ul>
        <li>
          Icons move on hover by default. For still icons, pass <code>animate={"{false}"}</code> or
          import from <code>@nudge-icons/{framework}/static</code>.
        </li>
        <li>
          Where Lucide has two icons for two states, such as <code>Menu</code> and <code>X</code>,
          some nudge icons have one with an <code>active</code> prop, and the change animates.
        </li>
        <li>
          Filled shapes are their own components, such as <code>HeartFilled</code>, instead of{" "}
          <code>fill="currentColor"</code> on the outline.
        </li>
        <li>
          Each icon has one name: <code>Bell</code>, without the <code>BellIcon</code> and{" "}
          <code>LucideBell</code> aliases.
        </li>
      </ul>

      <h2>Icon names</h2>
      <p>
        {matched} of {ROWS.length} icons have a Lucide counterpart. Search by either name.
      </p>
      <label className="docs-search">
        <span className="sr-only">Search icon names</span>
        <input
          type="search"
          placeholder="Search, e.g. TriangleAlert"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <table className="docs-table docs-names">
        <thead>
          <tr>
            <th scope="col">Lucide</th>
            <th scope="col">nudge-icons</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                {r.lucide.length ? (
                  r.lucide.map((name) => <code key={name}>{name}</code>)
                ) : (
                  <span className="hint">no counterpart</span>
                )}
              </td>
              <td>
                <Link to={href({ page: "icon", name: r.id })}>
                  <code>{r.component}</code>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="hint">No icon matches “{query}”.</p>}
    </>
  );
}
