import type { FieldValues, Path, UseFormRegister } from "react-hook-form";
import { MARKETS } from "../../../lib/builderAdmin";

/** English + Arabic inputs side by side (field names `${name}En` / `${name}Ar`). */
export function LocalizedInputs<T extends FieldValues>({
  register,
  name,
  label,
  multiline,
  error,
}: {
  register: UseFormRegister<T>;
  name: string;
  label: string;
  multiline?: boolean;
  error?: string;
}) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className="admin-field">
      <span className="admin-label">{label}</span>
      <div className="admin-form-row">
        <Tag className={multiline ? "admin-textarea" : "admin-input"} placeholder="English" aria-label={`${label} (English)`} {...register(`${name}En` as Path<T>)} />
        <Tag className={multiline ? "admin-textarea" : "admin-input"} placeholder="العربية" dir="rtl" aria-label={`${label} (Arabic)`} {...register(`${name}Ar` as Path<T>)} />
      </div>
      {error && <p className="admin-field-error">{error}</p>}
    </div>
  );
}

/** Bilingual list as one "English | Arabic" pair per line. */
export function LocalizedLines<T extends FieldValues>({ register, name, label, hint }: { register: UseFormRegister<T>; name: Path<T>; label: string; hint?: string }) {
  return (
    <div className="admin-field">
      <label className="admin-label" htmlFor={`f-${name}`}>{label}</label>
      <textarea id={`f-${name}`} className="admin-textarea" rows={4} placeholder={"Home | الرئيسية\nServices | الخدمات"} {...register(name)} />
      <p className="admin-field-hint">{hint ?? "One per line: English | Arabic"}</p>
    </div>
  );
}

/** Setup + monthly price per market (fields price_EGP_setup …). */
export function PriceGrid<T extends FieldValues>({ register, monthly = true }: { register: UseFormRegister<T>; monthly?: boolean }) {
  return (
    <div className="admin-field">
      <span className="admin-label">Prices</span>
      <table className="admin-table" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th className="admin-th">Market</th>
            <th className="admin-th">One-time setup</th>
            {monthly && <th className="admin-th">Monthly</th>}
          </tr>
        </thead>
        <tbody>
          {MARKETS.map((m) => (
            <tr key={m}>
              <td className="admin-td">{m}</td>
              <td className="admin-td"><input type="number" min={0} className="admin-input" aria-label={`${m} setup`} {...register(`price_${m}_setup` as Path<T>, { valueAsNumber: true })} /></td>
              {monthly && <td className="admin-td"><input type="number" min={0} className="admin-input" aria-label={`${m} monthly`} {...register(`price_${m}_monthly` as Path<T>, { valueAsNumber: true })} /></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PublishedBadge({ value }: { value: unknown }) {
  return <span className={`admin-badge ${value ? "admin-badge-green" : "admin-badge-gray"}`}>{value ? "Published" : "Hidden"}</span>;
}
