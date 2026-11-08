import type { CSSProperties, ReactNode } from "react";
import type { Entry } from "../data";
import { useSettings, type AnimateMode } from "../settings";
import { Segmented, Switch } from "./controls";

export const MODES = [
  { value: "hover", label: "Hover" },
  { value: "loop", label: "Loop" },
  { value: "once", label: "Once" },
  { value: "3", label: "3×" },
  { value: "off", label: "Off" },
] as const satisfies readonly { value: AnimateMode; label: string }[];

const SIZES = [12, 14, 16, 20, 24, 32, 48] as const;
/** Presets; `null` is `currentColor`, the default: the icon takes the text colour. */
const SWATCHES: { value: string | null; label: string }[] = [
  { value: null, label: "currentColor" },
  { value: "#0f766e", label: "Teal" },
  { value: "#dc2626", label: "Red" },
  { value: "#d97706", label: "Amber" },
  { value: "#2563eb", label: "Blue" },
  { value: "#71717a", label: "Gray" },
];

export function MotionField() {
  const { settings, update } = useSettings();
  return (
    <Field label="animate">
      <Segmented
        label="Animate"
        value={settings.animate}
        options={MODES}
        onChange={(animate) => update({ animate })}
      />
    </Field>
  );
}

export function ActiveField({ entry }: { entry: Entry }) {
  const { settings, update } = useSettings();
  const { icon } = entry;
  return (
    <div className="field">
      <Switch
        label="active"
        checked={icon.hasToggle && settings.active}
        disabled={!icon.hasToggle}
        onChange={(active) => update({ active })}
      />
      <p className="hint">
        {icon.toggle ? icon.toggle.description : "This icon has no second state."}
      </p>
    </div>
  );
}

/** Colour, stroke and size. The variant is a gallery entry of its own, not a setting. */
export function AppearanceFields() {
  const { settings, update } = useSettings();
  return (
    <>
      <ColorField value={settings.color} onChange={(color) => update({ color })} />
      <Field label={`strokeWidth · ${settings.strokeWidth}`}>
        <input
          type="range"
          aria-label="Stroke width"
          min={1}
          max={3}
          step={0.25}
          value={settings.strokeWidth}
          style={{ "--value": (settings.strokeWidth - 1) / 2 } as CSSProperties}
          onChange={(e) => update({ strokeWidth: Number(e.target.value) })}
        />
      </Field>
      <Field label="size">
        <Segmented
          label="Size"
          size="sm"
          value={String(settings.size)}
          options={SIZES.map((s) => ({ value: String(s), label: s }))}
          onChange={(v) => update({ size: Number(v) })}
        />
      </Field>
    </>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
    </div>
  );
}

function ColorField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const custom = value !== null && !SWATCHES.some((s) => s.value === value);
  return (
    <Field label={`color · ${value ?? "currentColor"}`}>
      <div className="swatches" role="radiogroup" aria-label="Color">
        {SWATCHES.map((s) => (
          <button
            key={s.label}
            type="button"
            role="radio"
            aria-checked={value === s.value}
            aria-label={s.label}
            title={s.label}
            className={`swatch ${s.value === null ? "swatch-current" : ""}`}
            style={s.value === null ? undefined : { background: s.value }}
            onClick={() => onChange(s.value)}
          />
        ))}
        {/* The system picker also takes a hex value. */}
        <label
          className="swatch swatch-custom"
          title="Custom colour"
          data-checked={custom || undefined}
          style={custom ? { background: value } : undefined}
        >
          <input
            type="color"
            aria-label="Custom colour"
            value={value ?? "#0f766e"}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>
    </Field>
  );
}
