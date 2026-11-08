import { Bell, Download, Heart } from "@nudge-icons/react";
import { href, Link } from "../../state/router";
import { Code, Demo, FrameworkCode } from "./parts";

export function StylingDoc() {
  return (
    <>
      <h2>Props</h2>
      <p>The props match lucide-react, so most code moves over unchanged.</p>
      <table className="docs-table">
        <thead>
          <tr>
            <th scope="col">Prop</th>
            <th scope="col">Default</th>
            <th scope="col">What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>size</code>
            </td>
            <td>
              <code>24</code>
            </td>
            <td>Width and height, a number of pixels or any CSS length</td>
          </tr>
          <tr>
            <td>
              <code>color</code>
            </td>
            <td>
              <code>currentColor</code>
            </td>
            <td>Line colour; by default the icon takes the text colour around it</td>
          </tr>
          <tr>
            <td>
              <code>strokeWidth</code>
            </td>
            <td>
              <code>2</code>
            </td>
            <td>Line width in units of the 24-unit canvas</td>
          </tr>
          <tr>
            <td>
              <code>absoluteStrokeWidth</code>
            </td>
            <td>
              <code>false</code>
            </td>
            <td>
              Keeps the line at <code>strokeWidth</code> pixels at any size (needs a numeric{" "}
              <code>size</code>)
            </td>
          </tr>
          <tr>
            <td>
              <code>className</code>
            </td>
            <td />
            <td>
              Added to the <code>&lt;svg&gt;</code>; in Vue, <code>class</code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Any other SVG attribute, such as <code>style</code> or <code>data-*</code>, is passed to the{" "}
        <code>&lt;svg&gt;</code> as well.
      </p>

      <h2>CSS</h2>
      <p>
        Every icon has the classes <code>nudge-icon</code> and <code>nudge-&lt;name&gt;</code>, for
        example <code>nudge-bell</code>. The library's own rules sit inside <code>:where()</code>,
        which adds no specificity, so any class of yours wins without <code>!important</code>.
        Utility classes work too.
      </p>
      <FrameworkCode
        label="Classes"
        react={`<Bell className="text-teal-700" />  {/* colour from the text colour */}\n<Bell className="my-bell" />`}
        vue={`<Bell class="text-teal-700" />  <!-- colour from the text colour -->\n<Bell class="my-bell" />`}
      />

      <h2>Motion timing</h2>
      <p>
        Each icon has its own duration and easing. Three CSS variables override them, on one icon or
        on a whole part of the page:
      </p>
      <table className="docs-table">
        <tbody>
          <tr>
            <td>
              <code>--nudge-duration</code>
            </td>
            <td>Length of one run of the motion</td>
          </tr>
          <tr>
            <td>
              <code>--nudge-easing</code>
            </td>
            <td>Timing function of the motion</td>
          </tr>
          <tr>
            <td>
              <code>--nudge-toggle-duration</code>
            </td>
            <td>
              How long the change to the second state takes (default <code>0.3s</code>)
            </td>
          </tr>
        </tbody>
      </table>
      <Code label="Slower icons in the sidebar" lang="css">
        {`.sidebar {\n  --nudge-duration: 1.2s;\n  --nudge-easing: ease-in-out;\n}`}
      </Code>

      <h2>Parts</h2>
      <p>
        The pieces of an icon that move are separate elements with a <code>data-part</code> name:
        the bell has a <code>body</code> and a <code>clapper</code>. Use them to colour one part.
        Each icon page lists its parts with a preview.
      </p>
      <Code label="Colour one part" lang="css">
        {`.nudge-bell [data-part="clapper"] {\n  stroke: #e11d48;\n}`}
      </Code>
      <Demo label="A bell with a coloured clapper">
        <span className="docs-parts-demo">
          <Bell size={48} animate="loop" />
        </span>
      </Demo>
      <p>
        Filled icons paint with <code>fill="currentColor"</code>, so set <code>color</code> on a
        part instead of <code>stroke</code>. Part names are part of the public API: they do not
        change within a major version.
      </p>

      <h2>Moving with the parent</h2>
      <p>
        An icon with <code>animate="hover"</code> also moves when its interactive parent is hovered
        or focused: a <code>button</code>, <code>a</code>, <code>summary</code>, <code>label</code>,
        or an element with <code>role</code> <code>button</code>, <code>menuitem</code> or{" "}
        <code>tab</code>. For any other container, add the class <code>nudge-trigger</code>.
      </p>
      <FrameworkCode
        label="Any container"
        react={`<div className="card nudge-trigger">\n  <Download size={16} /> Report.pdf\n</div>`}
        vue={`<div class="card nudge-trigger">\n  <Download :size="16" /> Report.pdf\n</div>`}
      />
      <Demo label="Hover the card">
        <div className="docs-card nudge-trigger">
          <Download size={16} /> Report.pdf
        </div>
        <div className="docs-card nudge-trigger">
          <Heart size={16} /> Saved
        </div>
      </Demo>
      <p>
        To try colours, stroke and motion on any icon, use the customizer in the{" "}
        <Link to={href({ page: "gallery" })}>gallery</Link>.
      </p>
    </>
  );
}
