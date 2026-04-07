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

type Employee = { _id: string; name: string };

type BlogPost = {
  _id: string;
  title: string;
  description: string;
  author: string | { _id: string; name: string };
  createdAt: string;
};

const schema = z.object({
  title: z.string().trim().min(1, "Required"),
  description: z.string().trim().optional(),
  author: z.string().trim().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<BlogPost>("/blog-post", "blogPosts", "blogPost");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });

  useEffect(() => {
    api.get("/employee").then((res) => setEmployees(res.data?.employees ?? []));
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.reset({ title: "", description: "", author: "" });
    setModalOpen(true);
  };

  const openEdit = (bp: BlogPost) => {
    setEditing(bp);
    form.reset({
      title: bp.title,
      description: bp.description ?? "",
      author: typeof bp.author === "string" ? bp.author : bp.author?._id ?? "",
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget._id);
    setDeleteTarget(null);
  };

  const columns: Column<BlogPost>[] = [
    { header: "Title", accessor: "title", sortable: true },
    {
      header: "Author",
      accessor: "author",
      render: (v) => {
        if (typeof v === "object" && v && "name" in (v as Record<string, unknown>)) return String((v as { name: string }).name);
        const emp = employees.find((e) => e._id === String(v));
        return emp?.name ?? String(v ?? "—");
      },
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
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="admin-btn admin-btn-ghost" style={{ padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil size={14} /></button>
          <button type="button" className="admin-btn admin-btn-danger" style={{ padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Blog Posts — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Blog Posts</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}><Plus size={16} /> Add Post</button>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable columns={columns} data={data} keyField="_id" searchFields={["title"]} searchPlaceholder="Search posts…" />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Blog Post" : "New Blog Post"}>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-field">
              <label className="admin-label">Title</label>
              <input className="admin-input" {...form.register("title")} />
              {form.formState.errors.title && <p className="admin-field-error">{form.formState.errors.title.message}</p>}
            </div>
            <div className="admin-field">
              <label className="admin-label">Author</label>
              <select className="admin-select" {...form.register("author")}>
                <option value="">Select author…</option>
                {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              {form.formState.errors.author && <p className="admin-field-error">{form.formState.errors.author.message}</p>}
            </div>
            <div className="admin-field">
              <label className="admin-label">Description</label>
              <textarea className="admin-textarea" rows={5} {...form.register("description")} />
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

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Blog Post">
        <p className="admin-confirm-text">Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </FormModal>
    </>
  );
}
