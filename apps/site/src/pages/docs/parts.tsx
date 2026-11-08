import type { ReactNode } from "react";
import { CodeBlock, CopyButton, FrameworkSwitch } from "../../components/controls";
import type { Lang } from "../../lib/highlight";
import { useSettings } from "../../state/settings";

/** A shell command with a copy button, like the install line on icon pages. */
export function Command({ children }: { children: string }) {
  return (
    <div className="install docs-command">
      <code>{children}</code>
      <CopyButton text={children} />
    </div>
  );
}

/** Code that differs between React and Vue; the switch is shared with the rest of the site. */
export function FrameworkCode({
  label,
  react,
  vue,
}: {
  label: string;
  react: string;
  vue: string;
}) {
  const { framework } = useSettings();
  return (
    <CodeBlock
      label={label}
      toolbar={<FrameworkSwitch />}
      lang={framework === "react" ? "tsx" : "vue"}
      code={framework === "react" ? react : vue}
    />
  );
}

export function Code({ label, lang, children }: { label: string; lang: Lang; children: string }) {
  return <CodeBlock label={label} lang={lang} code={children} />;
}

/** A live example next to the code that makes it. */
export function Demo({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="docs-demo" role="group" aria-label={label}>
      {children}
    </div>
  );
}
