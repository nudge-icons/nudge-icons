import { CORE_DIR } from "../../../../../scripts/lib/registry-layout.ts";
import { LICENSE_URL } from "../../lib/constants";
// The LICENSE file at the root of the repository, so the page and the file cannot differ.
import LICENSE from "../../../../../LICENSE?raw";

/** The license as paragraphs: the hard line breaks of the file joined back into lines. */
const [, ...PARAGRAPHS] = LICENSE.trim()
  .split(/\n\s*\n/)
  .map((p) => p.replace(/\s*\n\s*/g, " "));

export function LicenseDoc() {
  return (
    <>
      <h2>In short</h2>
      <ul>
        <li>Use the icons in personal and commercial projects, for free.</li>
        <li>Change them, copy them into your code, ship them in apps and products.</li>
        <li>No attribution is needed in your interface.</li>
        <li>
          If you redistribute the library itself or its source files, keep the license notice with
          them. Code copied with the shadcn CLI already does: each file names the copyright, and the
          full text is in <code>{CORE_DIR}/license.ts</code>. Keep them.
        </li>
      </ul>
      <p>
        The drawings are original. They are not traced from other icon sets; the names of similar
        icons in other sets are listed only to help you find and switch.
      </p>

      <h2>MIT License</h2>
      <div className="docs-license">
        {PARAGRAPHS.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>
      <p>
        The same text is in <a href={LICENSE_URL}>LICENSE</a> in the repository.
      </p>
    </>
  );
}
