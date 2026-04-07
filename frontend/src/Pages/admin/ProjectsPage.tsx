import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Trash2, ArrowUpCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import api from "../../lib/api";
import { useResourceApi } from "../../lib/useAdminApi";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";

type ProjectType = { _id: string; title: string; stages: string[] };
type Employee = { _id: string; name: string };
type User = { _id: string; name: string };

type Project = {
  _id: string;
  title: string;
  description: string;
  project_type: string;
  status_count: number;
  project_manager: string;
  user: string;
  deadline: string;
  createdAt: string;
};

const schema = z.object({
  title: z.string().trim().min(1, "Required"),
  description: z.string().trim().optional(),
  project_type: z.string().trim().min(1, "Required"),
  project_manager: z.string().trim().min(1, "Required"),
  user: z.string().trim().min(1, "Required"),
  deadline: z.string().trim().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

export function Component() {
  const { data, loading, error, create, update, remove, refresh } = useResourceApi<Project>("/project", "projects", "project");
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });

  useEffect(() => {
    Promise.all([
      api.get("/project-type"),
      api.get("/employee"),
      api.get("/user"),
    ]).then(([ptRes, empRes, usrRes]) => {
      setProjectTypes(ptRes.data?.projectTypes ?? []);
      setEmployees(empRes.data?.employees ?? []);
      setUsers(usrRes.data?.users ?? []);
    });
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.reset({ title: "", description: "", project_type: "", project_manager: "", user: "", deadline: "" });
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    form.reset({
      title: p.title,
      description: p.description ?? "",
      project_type: p.project_type,
      project_manager: p.project_manager,
      user: p.user,
      deadline: p.deadline ? new Date(p.deadline).toISOString().slice(0, 10) : "",
    });
    setModalOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await update({ id: editing._id, ...values });
      } else {
        await create(values);
      }
      setModalOpen(false);
    } catch { /* */ }
  });

  const incrementStatus = async (projectId: string) => {
    try {
      await api.post("/project/increment-status", { projectId });
      refresh();
    } catch { /* */ }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget._id);
    setDeleteTarget(null);
  };

  const columns: Column<Project>[] = [
    { header: "Title", accessor: "title", sortable: true },
    {
      header: "Stage",
      accessor: "status_count",
      sortable: true,
      render: (v) => <span className="admin-badge admin-badge-blue">Stage {String(v)}</span>,
    },
    {
      header: "Deadline",
      accessor: "deadline",
      sortable: true,
      render: (v) => v ? new Date(String(v)).toLocaleDateString() : "—",
    },
    {
      header: "",
      accessor: () => null,
      render: (_, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="admin-btn admin-btn-ghost" style={{ padding: "4px 8px" }} title="Increment stage" onClick={(e) => { e.stopPropagation(); incrementStatus(row._id); }}>
            <ArrowUpCircle size={14} />
          </button>
          <button type="button" className="admin-btn admin-btn-ghost" style={{ padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            <Pencil size={14} />
          </button>
          <button type="button" className="admin-btn admin-btn-danger" style={{ padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Projects — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Projects</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}><Plus size={16} /> Add Project</button>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable columns={columns} data={data} keyField="_id" searchFields={["title"]} searchPlaceholder="Search projects…" />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Project" : "New Project"}>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-field">
              <label className="admin-label">Title</label>
              <input className="admin-input" {...form.register("title")} />
              {form.formState.errors.title && <p className="admin-field-error">{form.formState.errors.title.message}</p>}
            </div>
            <div className="admin-field">
              <label className="admin-label">Description</label>
              <textarea className="admin-textarea" {...form.register("description")} />
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label">Project Type</label>
                <select className="admin-select" {...form.register("project_type")}>
                  <option value="">Select…</option>
                  {projectTypes.map((pt) => <option key={pt._id} value={pt._id}>{pt.title}</option>)}
                </select>
                {form.formState.errors.project_type && <p className="admin-field-error">{form.formState.errors.project_type.message}</p>}
              </div>
              <div className="admin-field">
                <label className="admin-label">Deadline</label>
                <input className="admin-input" type="date" {...form.register("deadline")} />
                {form.formState.errors.deadline && <p className="admin-field-error">{form.formState.errors.deadline.message}</p>}
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label">Project Manager</label>
                <select className="admin-select" {...form.register("project_manager")}>
                  <option value="">Select…</option>
                  {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                </select>
                {form.formState.errors.project_manager && <p className="admin-field-error">{form.formState.errors.project_manager.message}</p>}
              </div>
              <div className="admin-field">
                <label className="admin-label">Client (User)</label>
                <select className="admin-select" {...form.register("user")}>
                  <option value="">Select…</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
                {form.formState.errors.user && <p className="admin-field-error">{form.formState.errors.user.message}</p>}
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

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project">
        <p className="admin-confirm-text">Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </FormModal>
    </>
  );
}
