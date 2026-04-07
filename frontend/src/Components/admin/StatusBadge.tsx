type Status = "Pending Review" | "Accepted" | "Rejected";

const COLOR_MAP: Record<Status, string> = {
  "Pending Review": "admin-badge-amber",
  Accepted: "admin-badge-green",
  Rejected: "admin-badge-red",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = COLOR_MAP[status as Status] ?? "admin-badge-gray";
  return <span className={`admin-badge ${cls}`}>{status}</span>;
}
