import type { ToggleIconComponent } from "@nudge-icons/react";

const SIZES = [16, 20, 24, 32, 48];

const cell = { padding: "8px 12px", textAlign: "center", verticalAlign: "middle" } as const;
const label = { ...cell, textAlign: "left", font: "12px monospace", color: "#555" } as const;

export interface IconMatrixProps {
  /** The icon's components by variant. Passed in, not looked up, so a story imports one icon. */
  variants: { variant: string; Icon: ToggleIconComponent }[];
  /** The icon has a second state: each variant gets an `active` row too. */
  toggle: boolean;
}

/** Every variant and state of one icon at every size, standing still. */
export function IconMatrix({ variants, toggle }: IconMatrixProps) {
  const rows = variants.flatMap((v) =>
    (toggle ? [false, true] : [false]).map((active) => ({ ...v, active })),
  );
  return (
    <table style={{ borderCollapse: "collapse", color: "#18181b" }}>
      <thead>
        <tr>
          <th style={label} />
          {SIZES.map((s) => (
            <th key={s} style={{ ...label, textAlign: "center" }}>
              {s}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ variant, Icon, active }) => (
          <tr key={`${variant}-${active}`}>
            <td style={label}>{active ? `${variant} · active` : variant}</td>
            {SIZES.map((s) => (
              <td key={s} style={cell}>
                <Icon size={s} animate={false} {...(toggle ? { active } : {})} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
