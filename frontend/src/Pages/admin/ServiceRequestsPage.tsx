import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Trash2 } from "lucide-react";

import { useResourceApi } from "../../lib/useAdminApi";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";
import StatusBadge from "../../Components/admin/StatusBadge";

const STATUSES = ["Pending Review", "Accepted", "Rejected"] as const;

type ServiceReq = {
  _id: string;
  title: string;
  description: string;
  status: string;
  meeting_date: string;
  user: string;
  package: string;
  createdAt: string;
};

export function Component() {
  const { data, loading, error, update, remove } = useResourceApi<ServiceReq>("/system-request", "serviceRequests", "serviceRequest");
  const [deleteTarget, setDeleteTarget] = useState<ServiceReq | null>(null);

  const updateStatus = async (req: ServiceReq, newStatus: string) => {
    try {
      await update({ id: req._id, status: newStatus });
    } catch { /* */ }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget._id);
    setDeleteTarget(null);
  };

  const columns: Column<ServiceReq>[] = [
    { header: "Title", accessor: "title", sortable: true },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (v, row) => (
        <select
          className="admin-select"
          style={{ padding: "4px 8px", fontSize: "0.75rem", minWidth: 140 }}
          value={String(v)}
          onChange={(e) => updateStatus(row, e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
    {
      header: "Badge",
      accessor: "status",
      render: (v) => <StatusBadge status={String(v)} />,
    },
    {
      header: "Meeting",
      accessor: "meeting_date",
      sortable: true,
      render: (v) => v ? new Date(String(v)).toLocaleDateString() : "—",
    },
    {
      header: "Created",
      accessor: "createdAt",
      sortable: true,
      render: (v) => v ? new Date(String(v)).toLocaleDateString() : "—",
    },
    {
      header: "",
      accessor: () => null,
      render: (_, row) => (
        <button type="button" className="admin-btn admin-btn-danger" style={{ padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Service Requests — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Service Requests</h2>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable columns={columns} data={data} keyField="_id" searchFields={["title", "status"]} searchPlaceholder="Search requests…" />
      )}

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Service Request">
        <p className="admin-confirm-text">Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </FormModal>
    </>
  );
}
