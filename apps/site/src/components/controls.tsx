import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Copy } from "@nudge-icons/react";
import { tokenize, type Lang } from "../lib/highlight";
import { useSettings, type Framework } from "../state/settings";

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  size = "md",
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  // A radio group: Tab reaches only the checked option, arrow keys move the choice and the
  // focus together, so the focus ring never sits on an option that is not chosen.
  const move = (from: number, step: number, group: HTMLElement) => {
    const next = (from + step + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    group.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  };
  return (
    <div className={`segmented segmented-${size}`} role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          title={o.title}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => {
            const step =
              e.key === "ArrowRight" || e.key === "ArrowDown"
                ? 1
                : e.key === "ArrowLeft" || e.key === "ArrowUp"
                  ? -1
                  : 0;
            if (step === 0 || !e.currentTarget.parentElement) return;
            e.preventDefault();
            move(i, step, e.currentTarget.parentElement);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`switch ${disabled ? "is-disabled" : ""}`}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Copy button that shows the `copy` icon's second state for a moment after copying. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        if (!(await writeClipboard(text))) return;
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1600);
      }}
    >
      <Copy size={16} active={copied} />
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}

export function CodeBlock({
  code,
  label,
  lang,
  toolbar,
}: {
  code: string;
  label: string;
  lang: Lang;
  /** Extra controls in the bar, such as the React/Vue switch. */
  toolbar?: ReactNode;
}) {
  const tokens = useMemo(() => tokenize(code, lang), [code, lang]);
  return (
    <div className="code">
      <div className="code-bar">
        {/* A label cut short by the narrow bar shows in full as a tooltip; a whole one gets none. */}
        <span
          className="code-label"
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.title = el.scrollWidth > el.clientWidth ? label : "";
          }}
        >
          {label}
        </span>
        <span className="code-tools">
          {toolbar}
          <CopyButton text={code} />
        </span>
      </div>
      <pre>
        <code>
          {tokens.map((t, i) =>
            t.type === "text" ? (
              t.text
            ) : (
              <span key={i} className={`tok-${t.type}`}>
                {t.text}
              </span>
            ),
          )}
        </code>
      </pre>
    </div>
  );
}

const FRAMEWORKS = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
] as const satisfies readonly { value: Framework; label: string }[];

/** React or Vue for every code sample on the site; the choice is remembered. */
export function FrameworkSwitch() {
  const { framework, setFramework } = useSettings();
  return (
    <Segmented
      label="Framework"
      size="sm"
      value={framework}
      options={FRAMEWORKS}
      onChange={setFramework}
    />
  );
}
