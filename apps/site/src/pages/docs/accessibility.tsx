import { FrameworkCode } from "./parts";

export function AccessibilityDoc() {
  return (
    <>
      <h2>Hidden by default</h2>
      <p>
        Most icons sit next to text that already says what they mean. So an icon without a name
        renders with <code>aria-hidden="true"</code>, and screen readers skip it.
      </p>

      <h2>Icons that carry meaning</h2>
      <p>
        When the icon is the only way to tell something, give it a <code>title</code>. The icon then
        gets <code>role="img"</code> and a <code>&lt;title&gt;</code> inside, which screen readers
        announce. <code>aria-label</code> works the same way.
      </p>
      <FrameworkCode
        label="A meaningful icon"
        react={`<AlertTriangle title="Payment failed" />`}
        vue={`<AlertTriangle title="Payment failed" />`}
      />

      <h2>Icon-only buttons</h2>
      <p>
        Name the button, not the icon. The button is what receives focus and what a screen reader
        announces; the icon stays hidden.
      </p>
      <FrameworkCode
        label="Icon-only button"
        react={`<button aria-label="Download report">\n  <Download size={20} />\n</button>`}
        vue={`<button aria-label="Download report">\n  <Download :size="20" />\n</button>`}
      />
      <p>
        For a toggle such as <code>Menu</code>, keep the state on the button with{" "}
        <code>aria-expanded</code> or <code>aria-pressed</code>; the <code>active</code> drawing
        only shows it.
      </p>

      <h2>Reduced motion</h2>
      <p>
        When the system asks for reduced motion (<code>prefers-reduced-motion: reduce</code>), every
        motion and transition stops. Second states still change, at once. Nothing needs to be set up
        for this.
      </p>

      <h2>Keyboard</h2>
      <p>
        Hover motion also plays on keyboard focus (<code>:focus-visible</code>) of the icon or of
        its interactive parent, so keyboard users see the same feedback as mouse users.
      </p>

      <h2>Motion is a hint</h2>
      <p>
        Motion draws attention; it should not be the only signal. Every icon reads the same at rest,
        and a second state is a different drawing, not a movement, so it stays visible under reduced
        motion too.
      </p>
    </>
  );
}
