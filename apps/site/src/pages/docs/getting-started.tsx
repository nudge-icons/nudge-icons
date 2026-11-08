import { useState } from "react";
import { Bell, Download, Menu, Send } from "@nudge-icons/react";
import { SKILL_URL } from "../../lib/constants";
import { ENTRIES } from "../../lib/data";
import { installCommand, registryCommand } from "../../lib/snippets";
import { href, Link } from "../../state/router";
import { useSettings } from "../../state/settings";
import { Command, Demo, FrameworkCode } from "./parts";

/** Icons with a second state, from the data, so the list grows with the set. */
const TOGGLES = ENTRIES.filter((e) => e.variant === "outline" && e.icon.hasToggle);

export function GettingStartedDoc() {
  const { framework } = useSettings();
  const [open, setOpen] = useState(false);
  return (
    <>
      <h2>Install</h2>
      <p>Add the package for your framework. It has no dependencies of its own.</p>
      <Command>{installCommand(framework)}</Command>
      <p>
        Or copy the source of single icons into your project with the shadcn CLI, with no package to
        keep up to date. Each icon page shows its command; the first icon also adds a small shared
        core.
      </p>
      <Command>{registryCommand("bell", framework)}</Command>
      <p>
        Plain SVG files are in <code>@nudge-icons/svg</code>, for anything that is not React or Vue.
        They are drawn at rest: no motion and no second state.
      </p>

      <h2>Use an icon</h2>
      <p>
        Every icon is a component named after it: <code>bell</code> is <code>Bell</code>,{" "}
        <code>heart-filled</code> is <code>HeartFilled</code>. Import only what you use; the rest
        stays out of your bundle.
      </p>
      <FrameworkCode
        label="Usage"
        react={`import { Bell } from "@nudge-icons/react";\n\nexport function Notifications() {\n  return (\n    <button>\n      <Bell size={16} /> Notifications\n    </button>\n  );\n}`}
        vue={`<script setup lang="ts">\nimport { Bell } from "@nudge-icons/vue";\n</script>\n\n<template>\n  <button><Bell :size="16" /> Notifications</button>\n</template>`}
      />

      <h2>When icons move</h2>
      <p>
        The <code>animate</code> prop decides when the motion plays. By default an icon moves on
        hover and keyboard focus, also when the pointer is over the button or link around it.
      </p>
      <table className="docs-table">
        <thead>
          <tr>
            <th scope="col">
              <code>animate</code>
            </th>
            <th scope="col">Motion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>"hover"</code> (default)
            </td>
            <td>On hover or focus of the icon or of its interactive parent</td>
          </tr>
          <tr>
            <td>
              <code>"loop"</code>
            </td>
            <td>Repeats without end, for loaders and attention</td>
          </tr>
          <tr>
            <td>
              <code>"once"</code>
            </td>
            <td>Plays once when the icon appears</td>
          </tr>
          <tr>
            <td>
              <code>3</code>
            </td>
            <td>Plays that many times</td>
          </tr>
          <tr>
            <td>
              <code>false</code>
            </td>
            <td>Never moves</td>
          </tr>
        </tbody>
      </table>
      <Demo label="Hover or focus the buttons">
        <button type="button" className="btn">
          <Bell size={16} /> Hover
        </button>
        <button type="button" className="btn">
          <Download size={16} animate="loop" /> Loop
        </button>
        <button type="button" className="btn">
          <Send size={16} animate={false} /> Still
        </button>
      </Demo>

      <h2>Second state</h2>
      <p>
        Some icons have a second drawing, shown with <code>active</code>: the menu folds into a
        cross, a slash crosses out the eye. The change animates, and these icons do not move on
        hover unless you ask for it. They are{" "}
        {TOGGLES.map((e, i) => (
          <span key={e.id}>
            {i > 0 && (i === TOGGLES.length - 1 ? " and " : ", ")}
            <Link to={href({ page: "icon", name: e.id })}>
              <code>{e.component}</code>
            </Link>
          </span>
        ))}
        .
      </p>
      <FrameworkCode
        label="Second state"
        react={`const [open, setOpen] = useState(false);\n\n<button aria-expanded={open} onClick={() => setOpen(!open)}>\n  <Menu active={open} title="Menu" />\n</button>`}
        vue={`<script setup lang="ts">\nimport { ref } from "vue";\nimport { Menu } from "@nudge-icons/vue";\nconst open = ref(false);\n</script>\n\n<template>\n  <button :aria-expanded="open" @click="open = !open">\n    <Menu :active="open" title="Menu" />\n  </button>\n</template>`}
      />
      <Demo label="Second state">
        <button
          type="button"
          className="btn btn-icon"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <Menu active={open} title="Menu" />
        </button>
      </Demo>

      <h2>Without motion</h2>
      <p>
        If you only need still icons, import from <code>/static</code>. The same drawings and props,
        without the motion CSS and without second states.
      </p>
      <FrameworkCode
        label="Static icons"
        react={`import { Bell } from "@nudge-icons/react/static";`}
        vue={`import { Bell } from "@nudge-icons/vue/static";`}
      />

      <h2>Requirements</h2>
      <ul>
        <li>React 19 or later, or Vue 3.3 or later.</li>
        <li>
          Server rendering works: the motion is CSS only, so icons move before the page hydrates.
          Both packages are tested with server rendering, and the Vue package in Nuxt.
        </li>
      </ul>

      <h2>AI coding agents</h2>
      <p>
        Agents tend to guess icon names and props. Give them the real ones:{" "}
        <a href={`${import.meta.env.BASE_URL}llms.txt`} target="_blank" rel="noreferrer">
          llms.txt
        </a>{" "}
        is an index of these docs, and{" "}
        <a href={`${import.meta.env.BASE_URL}llms-full.txt`} target="_blank" rel="noreferrer">
          llms-full.txt
        </a>{" "}
        has the whole API and every icon with its parts and motion. For Claude Code and other agents
        with skills, copy the{" "}
        <a href={SKILL_URL} target="_blank" rel="noreferrer">
          nudge-icons skill
        </a>{" "}
        into your project's <code>.claude/skills/</code>.
      </p>
    </>
  );
}
