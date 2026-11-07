import { iconByName } from "./icons";

const SIZES = [16, 20, 24, 32, 48];

const cell = { padding: "8px 12px", textAlign: "center", verticalAlign: "middle" } as const;
const label = { ...cell, textAlign: "left", font: "12px monospace", color: "#555" } as const;

/** Every variant and state of one icon at every size, standing still. */
export function IconMatrix({ name }: { name: string }) {
  const icon = iconByName(name);
  const rows = icon.variants.flatMap((v) =>
    (icon.toggle ? [false, true] : [false]).map((active) => ({ ...v, active })),
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
                <Icon size={s} animate={false} {...(icon.toggle ? { active } : {})} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
