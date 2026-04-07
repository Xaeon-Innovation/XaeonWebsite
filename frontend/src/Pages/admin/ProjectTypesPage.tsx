import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useResourceApi } from "../../lib/useAdminApi";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";

type ProjectType = {
  _id: string;
  title: string;
  stages: string[];
};

const schema = z.object({
  title: z.string().trim().min(1, "Required"),
  stagesText: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<ProjectType>("/project-type", "projectTypes", "projectType");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectType | null>(null);
  const [stages, setStages] = useState<string[]>([]);
  const [stageInput, setStageInput] = useState("");

  const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });

  const openCreate = () => {
    setEditing(null);
    setStages([]);
    setStageInput("");
    form.reset({ title: "" });
    setModalOpen(true);
  };

  const openEdit = (pt: ProjectType) => {
    setEditing(pt);
    setStages(pt.stages ?? []);
    setStageInput("");
    form.reset({ title: pt.title });
    setModalOpen(true);
  };

  const addStage = () => {
    const v = stageInput.trim();
    if (!v || stages.includes(v)) return;
    setStages((prev) => [...prev, v]);
    setStageInput("");
  };

  const removeStage = (i: number) => {
    setStages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await update({ id: editing._id, title: values.title, stages });
      } else {
        await create({ title: values.title, stages });
      }
      setModalOpen(false);
    } catch { /* */ }
  });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget._id);
    setDeleteTarget(null);
  };

  const columns: Column<ProjectType>[] = [
    { header: "Title", accessor: "title", sortable: true },
    {
      header: "Stages",
      accessor: "stages",
      render: (v) => {
        const arr = Array.isArray(v) ? v as string[] : [];
        return (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {arr.map((s) => <span key={s} className="admin-badge admin-badge-gray">{s}</span>)}
            {arr.length === 0 && <span style={{ color: "#52525b" }}>—</span>}
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
      <Helmet><title>Project Types — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Project Types</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}><Plus size={16} /> Add Type</button>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable columns={columns} data={data} keyField="_id" searchFields={["title"]} searchPlaceholder="Search types…" />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Project Type" : "New Project Type"}>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-field">
              <label className="admin-label">Title</label>
              <input className="admin-input" {...form.register("title")} />
              {form.formState.errors.title && <p className="admin-field-error">{form.formState.errors.title.message}</p>}
            </div>
            <div className="admin-field">
              <label className="admin-label">Stages</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="admin-input"
                  style={{ flex: 1 }}
                  placeholder="e.g. Design"
                  value={stageInput}
                  onChange={(e) => setStageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStage(); } }}
                />
                <button type="button" className="admin-btn admin-btn-ghost" onClick={addStage}>Add</button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {stages.map((s, i) => (
                  <span key={i} className="admin-badge admin-badge-green" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {s}
                    <button type="button" onClick={() => removeStage(i)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "inline-flex" }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
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

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project Type">
        <p className="admin-confirm-text">Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </FormModal>
    </>
  );
}
