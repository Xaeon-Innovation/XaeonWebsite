import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  value: string | number;
  loading?: boolean;
};

export default function KpiCard({ icon, label, value, loading }: Props) {
  return (
    <div className="admin-kpi">
      <div className="admin-kpi-icon">{icon}</div>
      <div className="admin-kpi-content">
        <span className="admin-kpi-label">{label}</span>
        <span className="admin-kpi-value">{loading ? "…" : value}</span>
      </div>
    </div>
  );
}
