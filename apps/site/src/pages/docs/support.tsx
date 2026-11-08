import { CONTRIBUTING_URL, ISSUES_URL, NEW_ISSUE_URL, REPO_URL } from "../../lib/constants";

export function SupportDoc() {
  return (
    <>
      <p>
        nudge-icons is free and made in spare time. There is no donation link for now; these help
        more than money at this stage.
      </p>

      <h2>Star the repository</h2>
      <p>
        Stars help other developers find the project. <a href={REPO_URL}>Star it on GitHub</a>.
      </p>

      <h2>Ask for an icon</h2>
      <p>
        Missing an icon? <a href={NEW_ISSUE_URL}>Open an issue</a> with its name, where you would
        use it and, if you have one in mind, how it could move. New icons come in batches, ordered
        by how often they are needed.
      </p>

      <h2>Report a problem</h2>
      <p>
        If an icon looks wrong at some size, a motion feels off or something does not work in your
        setup, <a href={ISSUES_URL}>tell us in the issues</a>. A screenshot and the framework
        version help.
      </p>

      <h2>Contribute</h2>
      <p>
        Icons follow written drawing rules that a script checks.{" "}
        <a href={CONTRIBUTING_URL}>CONTRIBUTING.md</a> explains the grid, the parts and how to
        describe a motion.
      </p>

      <h2>Share it</h2>
      <p>If nudge-icons is in your product, a link or a short post about it helps a lot.</p>
    </>
  );
}
