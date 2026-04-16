import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useLoaderData } from "react-router";

import { useResourceApi } from "../../lib/useAdminApi";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";
import StatusBadge from "../../Components/admin/StatusBadge";
import { type ServiceRequestsLoaderData } from "../../lib/adminLoaders";

const STATUSES = ["Pending Review", "Accepted", "Rejected"] as const;

function statusSelectModifiers(status: string) {
  if (status === "Pending Review") return "admin-select-status admin-select-status-pending";
  if (status === "Accepted") return "admin-select-status admin-select-status-accepted";
  return "admin-select-status admin-select-status-rejected";
}

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type ServiceReq = {
  _id: string;
  title: string;
  description?: string;
  status: string;
  meeting_date?: string;
  user?: string;
  package?: string | { _id: string; title: string; discount?: number };
  createdAt: string;
  source?: string;
  interest?: string;
  contactEmail?: string;
  contactName?: string;
  contactPhone?: string;
  company?: string;
};

function packageTitle(row: ServiceReq): string | null {
  const p = row.package;
  if (p && typeof p === "object" && "title" in p && p.title) return String(p.title);
  return null;
}

function renderContactDetailLine(label: string, value: string) {
  return (
    <div key={label} className="admin-contact-line">
      <span className="admin-contact-label">{label}</span>
      {label === "Email" ? (
        <a className="admin-contact-value" href={`mailto:${value}`}>
          {value}
        </a>
      ) : label === "Phone" ? (
        <a className="admin-contact-value" href={`tel:${value.replace(/\s/g, "")}`}>
          {value}
        </a>
      ) : (
        <span className="admin-contact-value">{value}</span>
      )}
    </div>
  );
}

function contactHasExtra(row: ServiceReq): boolean {
  return Boolean(
    row.company?.trim() || row.contactPhone?.trim() || row.contactEmail?.trim(),
  );
}

function ContactCell({ row, expanded }: { row: ServiceReq; expanded: boolean }) {
  const name = row.contactName?.trim() ?? "";
  const company = row.company?.trim() ?? "";
  const phone = row.contactPhone?.trim() ?? "";
  const email = row.contactEmail?.trim() ?? "";
  const hasExtra = contactHasExtra(row);
  const hasAnyContact = Boolean(name || hasExtra);

  if (!hasAnyContact) return <span>—</span>;

  const detailLines: { label: string; value: string }[] = [];
  if (company) detailLines.push({ label: "Company", value: company });
  if (phone) detailLines.push({ label: "Phone", value: phone });
  if (email) detailLines.push({ label: "Email", value: email });

  return (
    <div className="admin-contact-cell">
      <span className="admin-contact-value admin-contact-summary-name">{name || "—"}</span>
      {expanded && detailLines.length > 0 ? (
        <div className="admin-contact-details">
          {detailLines.map(({ label, value }) => renderContactDetailLine(label, value))}
        </div>
      ) : null}
    </div>
  );
}

export function Component() {
  const { serviceRequests } = useLoaderData<ServiceRequestsLoaderData>();
  const { data, loading, error, update, remove } = useResourceApi<ServiceReq>(
    "/system-request",
    "serviceRequests",
    "serviceRequest",
    { initialData: serviceRequests, skipInitialFetch: true },
  );
  const [deleteTarget, setDeleteTarget] = useState<ServiceReq | null>(null);
  const [editTarget, setEditTarget] = useState<ServiceReq | null>(null);
  const [editInterest, setEditInterest] = useState("");
  const [editMeeting, setEditMeeting] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [contactExpanded, setContactExpanded] = useState<Record<string, boolean>>({});

  const toggleContactExpanded = (id: string) => {
    setContactExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (editTarget) {
      setEditInterest(editTarget.interest ?? "");
      setEditMeeting(toDatetimeLocalValue(editTarget.meeting_date));
      setEditError(null);
    }
  }, [editTarget]);

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

  const saveMeetingAndInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const isEnquiry =
      editTarget.source === "contact" ||
      editTarget.source === "service" ||
      editTarget.source === "package";

    if (!isEnquiry && !editMeeting.trim() && !editTarget.meeting_date) {
      setEditError("Registered requests require a meeting date and time.");
      return;
    }

    setEditSaving(true);
    setEditError(null);
    try {
      const payload: Record<string, unknown> = {
        id: editTarget._id,
        interest: editInterest.trim() === "" ? null : editInterest.trim(),
      };

      if (editMeeting.trim()) {
        payload.meeting_date = new Date(editMeeting).toISOString();
      } else if (isEnquiry) {
        payload.meeting_date = null;
      } else if (editTarget.meeting_date) {
        payload.meeting_date = new Date(editTarget.meeting_date).toISOString();
      }

      await update(payload as Record<string, unknown>);
      setEditTarget(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  const sourceLabel = (row: ServiceReq) => {
    if (row.source === "contact") return "Contact";
    if (row.source === "service") return "Service interest";
    if (row.source === "package") return "Package";
    return "Registered";
  };

  const columns: Column<ServiceReq>[] = [
    {
      header: "Source",
      accessor: (row) => sourceLabel(row),
      sortable: true,
    },
    {
      header: "Interest",
      accessor: "interest",
      sortable: true,
      render: (v) => (v ? String(v) : "—"),
    },
    {
      header: "Package",
      accessor: (row) => packageTitle(row) ?? "",
      sortable: true,
      render: (_, row) => {
        const t = packageTitle(row);
        return t ? <span className="admin-badge admin-badge-gray">{t}</span> : "—";
      },
    },
    { header: "Title", accessor: "title", sortable: true },
    {
      header: "Contact",
      accessor: (row) =>
        [row.contactName, row.company, row.contactPhone, row.contactEmail]
          .filter(Boolean)
          .join(" "),
      sortable: true,
      className: "admin-td-contact",
      render: (_, row) => (
        <ContactCell row={row} expanded={Boolean(contactExpanded[row._id])} />
      ),
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (v, row) => (
        <select
          className={`admin-select ${statusSelectModifiers(String(v))}`}
          aria-label={`Update status for ${row.title}`}
          title={`Update status for ${row.title}`}
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
      render: (v) =>
        v ? new Date(String(v)).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—",
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
        <div className="admin-row-actions">
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            style={{ padding: "4px 8px" }}
            aria-label={`Edit meeting and interest for ${row.title}`}
            title="Edit meeting time and interest"
            onClick={(e) => {
              e.stopPropagation();
              setEditTarget(row);
            }}
          >
            <Pencil size={14} />
          </button>
          {contactHasExtra(row) ? (
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              style={{ padding: "4px 8px" }}
              aria-expanded={contactExpanded[row._id] ? "true" : "false"}
              aria-label={
                contactExpanded[row._id]
                  ? "Hide contact details"
                  : "View contact details"
              }
              title={
                contactExpanded[row._id]
                  ? "Hide contact details"
                  : "View contact details"
              }
              onClick={(e) => {
                e.stopPropagation();
                toggleContactExpanded(row._id);
              }}
            >
              {contactExpanded[row._id] ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          ) : null}
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            style={{ padding: "4px 8px" }}
            aria-label={`Delete request ${row.title}`}
            title={`Delete request ${row.title}`}
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
          >
            <Trash2 size={14} />
          </button>
        </div>
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
        <DataTable
          columns={columns}
          data={data}
          keyField="_id"
          searchFields={[
            "title",
            "status",
            "interest",
            "contactEmail",
            "contactName",
            "contactPhone",
            "company",
          ]}
          searchPlaceholder="Search name, company, phone, email…"
        />
      )}

      <FormModal open={!!editTarget} onClose={() => setEditTarget(null)} title="Meeting and interest">
        {editTarget ? (
          <form className="admin-form" onSubmit={saveMeetingAndInterest}>
            <p className="admin-confirm-text" style={{ marginBottom: 12 }}>
              <strong>{editTarget.title}</strong>
              {" "}
              <span style={{ color: "#a1a1aa", fontWeight: 400 }}>
                ({sourceLabel(editTarget)})
              </span>
            </p>
            <div className="admin-field">
              <label className="admin-label" htmlFor="sr-interest">
                Interest / focus
              </label>
              <input
                id="sr-interest"
                className="admin-input"
                value={editInterest}
                onChange={(ev) => setEditInterest(ev.target.value)}
                placeholder="e.g. Custom Software Solutions"
                autoComplete="off"
              />
              <p className="admin-field-hint">Leave empty to clear (contact / service requests).</p>
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="sr-meeting">
                Meeting date and time
              </label>
              <input
                id="sr-meeting"
                className="admin-input"
                type="datetime-local"
                value={editMeeting}
                onChange={(ev) => setEditMeeting(ev.target.value)}
              />
              <p className="admin-field-hint">
                {(editTarget.source === "contact" ||
                  editTarget.source === "service" ||
                  editTarget.source === "package")
                  ? "Leave empty to clear the scheduled meeting."
                  : "Required for registered requests. Clear is not allowed — set a new time to change."}
              </p>
            </div>
            {editError ? <p className="admin-field-error">{editError}</p> : null}
            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setEditTarget(null)}>
                Cancel
              </button>
              <button type="submit" className="admin-btn" disabled={editSaving}>
                {editSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : null}
      </FormModal>

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
