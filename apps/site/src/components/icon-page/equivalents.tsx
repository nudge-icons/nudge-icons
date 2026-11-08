import { SET_NAMES, type Entry, type EquivalentSet } from "../../lib/data";

export function Equivalents({ icon }: { icon: Entry["icon"] }) {
  const sets = Object.keys(SET_NAMES) as EquivalentSet[];
  return (
    <table className="equivalents">
      <tbody>
        {sets.map((s) => (
          <tr key={s}>
            <th scope="row">{SET_NAMES[s]}</th>
            <td>
              {icon.equivalents[s]?.length ? (
                icon.equivalents[s]?.map((id) => <code key={id}>{id}</code>)
              ) : (
                <span className="hint">no close match</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
