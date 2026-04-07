import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import api from "../../lib/api";
import { useResourceApi } from "../../lib/useAdminApi";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";

type ProjectType = { _id: string; title: string };

type Pkg = {
  _id: string;
  title: string;
  discount: number;
  project_type: ProjectType[] | string[];
};

const schema = z.object({
  title: z.string().trim().min(1, "Required"),
  discount: z.number().min(0).max(100),
});

type FormValues = z.infer<typeof schema>;

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<Pkg>("/package", "packages", "package");
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [selectedPts, setSelectedPts] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pkg | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });

  useEffect(() => {
    api.get("/project-type").then((res) => setProjectTypes(res.data?.projectTypes ?? []));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setSelectedPts([]);
    form.reset({ title: "", discount: 0 });
    setModalOpen(true);
  };

  const openEdit = (pkg: Pkg) => {
    setEditing(pkg);
    const ptIds = (pkg.project_type ?? []).map((pt) => typeof pt === "string" ? pt : pt._id);
    setSelectedPts(ptIds);
    form.reset({ title: pkg.title, discount: pkg.discount });
    setModalOpen(true);
  };

  const togglePt = (id: string) => {
    setSelectedPts((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await update({ id: editing._id, ...values, project_type: selectedPts });
      } else {
        await create({ ...values, project_type: selectedPts });
      }
      setModalOpen(false);
    } catch { /* */ }
  });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget._id);
    setDeleteTarget(null);
  };

  const columns: Column<Pkg>[] = [
    { header: "Title", accessor: "title", sortable: true },
    {
      header: "Discount",
      accessor: "discount",
      sortable: true,
      render: (v) => Number(v) > 0 ? <span className="admin-badge admin-badge-green">{String(v)}%</span> : <span style={{ color: "#52525b" }}>None</span>,
    },
    {
      header: "Services",
      accessor: "project_type",
      render: (v) => {
        const arr = Array.isArray(v) ? v : [];
        return (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {arr.slice(0, 3).map((pt: ProjectType | string) => {
              const title = typeof pt === "string" ? pt : pt.title;
              const id = typeof pt === "string" ? pt : pt._id;
              return <span key={id} className="admin-badge admin-badge-gray">{title}</span>;
            })}
            {arr.length > 3 && <span className="admin-badge admin-badge-gray">+{arr.length - 3}</span>}
          </div>
        );
      },
    },
    {
      header: "",
      accessor: () => null,
      render: (_, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="admin-btn admin-btn-ghost" style={{ padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil size={14} /></button>
          <button type="button" className="admin-btn admin-btn-danger" style={{ padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Packages — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Packages</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}><Plus size={16} /> Add Package</button>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable columns={columns} data={data} keyField="_id" searchFields={["title"]} searchPlaceholder="Search packages…" />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Package" : "New Package"}>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label">Title</label>
                <input className="admin-input" {...form.register("title")} />
                {form.formState.errors.title && <p className="admin-field-error">{form.formState.errors.title.message}</p>}
              </div>
              <div className="admin-field">
                <label className="admin-label">Discount (%)</label>
                <input className="admin-input" type="number" min={0} max={100} {...form.register("discount", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="admin-field">
              <label className="admin-label">Project Types</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {projectTypes.map((pt) => {
                  const selected = selectedPts.includes(pt._id);
                  return (
                    <button
                      key={pt._id}
                      type="button"
                      className={`admin-badge ${selected ? "admin-badge-green" : "admin-badge-gray"}`}
                      style={{ cursor: "pointer", border: "none" }}
                      onClick={() => togglePt(pt._id)}
                    >
                      {selected ? "✓ " : ""}{pt.title}
                    </button>
                  );
                })}
                {projectTypes.length === 0 && <span style={{ fontSize: "0.8125rem", color: "#52525b" }}>No project types found</span>}
              </div>
            </div>
            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : editing ? "Save" : "Create"}
              </button>
            </div>
          </form>
        )}
      </FormModal>

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Package">
        <p className="admin-confirm-text">Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </FormModal>
    </>
  );
}
