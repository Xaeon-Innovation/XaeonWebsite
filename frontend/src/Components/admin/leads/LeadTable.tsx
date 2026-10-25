import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { formatMoney, isOverdue, SOURCE_LABELS, STAGE_META, type LeadSummary } from "../../../lib/leads";
import styles from "./Leads.module.css";

type Props = {
  leads: LeadSummary[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onOpen: (id: string) => void;
  sort: string;
  onSort: (sort: string) => void;
};

const SORTABLE: { key: string; label: string }[] = [
  { key: "createdAt", label: "Created" },
  { key: "stage", label: "Stage" },
  { key: "followUpAt", label: "Follow-up" },
  { key: "value", label: "Value" },
];

function SortHeader({ field, label, sort, onSort }: { field: string; label: string; sort: string; onSort: (s: string) => void }) {
  const active = sort.replace(/^-/, "") === field;
  const desc = sort.startsWith("-");
  const Icon = !active ? ChevronsUpDown : desc ? ChevronDown : ChevronUp;
  return (
    <th className="admin-th admin-th-sortable" aria-sort={active ? (desc ? "descending" : "ascending") : "none"}>
      <button
        type="button"
        className="admin-th-inner"
        style={{ background: "none", border: 0, color: "inherit", font: "inherit", cursor: "pointer", padding: 0 }}
        onClick={() => onSort(active && desc ? field : `-${field}`)}
      >
        {label} <Icon size={13} aria-hidden className="admin-sort-icon" />
      </button>
    </th>
  );
}

export default function LeadTable({ leads, selected, onToggle, onToggleAll, onOpen, sort, onSort }: Props) {
  const allChecked = leads.length > 0 && leads.every((l) => selected.has(l._id));
  const label = (key: string) => SORTABLE.find((s) => s.key === key)!.label;
  return (
    <div className="admin-table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th className="admin-th" style={{ width: 36 }}>
              <input
                type="checkbox"
                className={styles.checkbox}
                aria-label="Select all leads on this page"
                checked={allChecked}
                onChange={(e) => onToggleAll(e.target.checked)}
              />
            </th>
            <th className="admin-th">Lead</th>
            <SortHeader field="stage" label={label("stage")} sort={sort} onSort={onSort} />
            <th className="admin-th">Source · channel</th>
            <th className="admin-th">Owner</th>
            <SortHeader field="followUpAt" label={label("followUpAt")} sort={sort} onSort={onSort} />
            <SortHeader field="value" label={label("value")} sort={sort} onSort={onSort} />
            <SortHeader field="createdAt" label={label("createdAt")} sort={sort} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td className="admin-td-empty" colSpan={8}>No leads match these filters</td>
            </tr>
          ) : (
            leads.map((l) => {
              const meta = STAGE_META[l.stage];
              return (
                <tr key={l._id} className="admin-tr-clickable" onClick={() => onOpen(l._id)}>
                  <td className="admin-td" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      aria-label={`Select ${l.contactName || l.title}`}
                      checked={selected.has(l._id)}
                      onChange={() => onToggle(l._id)}
                    />
                  </td>
                  <td className="admin-td">
                    <div className={styles.rowName}>{l.contactName || l.title}</div>
                    <div className={styles.rowSub}>{[l.company, l.contactEmail].filter(Boolean).join(" · ")}</div>
                  </td>
                  <td className="admin-td">
                    <span className={styles.tag}>
                      <span className={styles.dot} style={{ background: meta.color }} aria-hidden /> {meta.label}
                    </span>
                  </td>
                  <td className="admin-td">
                    <div>{SOURCE_LABELS[l.source] ?? l.source}</div>
                    <div className={styles.rowSub}>{l.tracked ? l.channel : "Not tracked"}</div>
                  </td>
                  <td className="admin-td">{l.owner?.name ?? <span className={styles.rowSub}>Unassigned</span>}</td>
                  <td className="admin-td">
                    {l.followUpAt ? (
                      <span className={`${styles.tag} ${isOverdue(l) ? styles.tagOverdue : ""}`}>
                        {new Date(l.followUpAt).toLocaleDateString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="admin-td" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {l.value ? formatMoney(l.value, l.currency) : "—"}
                  </td>
                  <td className="admin-td">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
