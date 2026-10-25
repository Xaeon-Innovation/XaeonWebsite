import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { getApiErrorMessage } from "../../lib/api";
import { useResourceApi } from "../../lib/useAdminApi";
import { uploadSiteAsset } from "../../lib/siteUpload";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";

type Testimonial = {
  _id: string;
  quote: string;
  name: string;
  role?: string;
  company?: string;
  logoUrl?: string;
  sortOrder: number;
  published: boolean;
};

const schema = z.object({
  quote: z.string().trim().min(10, "Add the client's words (at least 10 characters)").max(1000, "Keep it under 1000 characters"),
  name: z.string().trim().min(1, "Required"),
  role: z.string().trim().optional(),
  company: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().default(0),
  published: z.boolean().default(false),
});

type FormValues = z.input<typeof schema>;

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<Testimonial>("/testimonial", "testimonials", "testimonial");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });
  const logoUrl = form.watch("logoUrl");

  const openCreate = () => {
    setEditing(null);
    form.reset({ quote: "", name: "", role: "", company: "", logoUrl: "", sortOrder: data.length + 1, published: false });
    setModalOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    form.reset({
      quote: t.quote,
      name: t.name,
      role: t.role ?? "",
      company: t.company ?? "",
      logoUrl: t.logoUrl ?? "",
      sortOrder: t.sortOrder ?? 0,
      published: Boolean(t.published),
    });
    setModalOpen(true);
  };

  const onLogoFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadSiteAsset(file, "logo");
      form.setValue("logoUrl", url, { shouldDirty: true });
    } catch (e) {
      form.setError("logoUrl", { message: getApiErrorMessage(e, "Upload failed") });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = schema.parse(values);
    try {
      if (editing) {
        await update({ id: editing._id, ...payload });
      } else {
        await create(payload);
      }
      setModalOpen(false);
    } catch (e) {
      form.setError("root", { message: getApiErrorMessage(e, "Save failed. Please try again.") });
    }
  });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget._id);
    setDeleteTarget(null);
  };

  const columns: Column<Testimonial>[] = [
    { header: "Order", accessor: "sortOrder", sortable: true },
    { header: "Client", accessor: (row) => [row.name, row.role, row.company].filter(Boolean).join(" · "), sortable: true },
    {
      header: "Quote",
      accessor: "quote",
      render: (v) => {
        const text = String(v ?? "");
        return text.length > 90 ? `${text.slice(0, 90)}…` : text;
      },
    },
    {
      header: "On website",
      accessor: "published",
      sortable: true,
      render: (v) => <span className={`admin-badge ${v ? "admin-badge-green" : "admin-badge-gray"}`}>{v ? "Published" : "Hidden"}</span>,
    },
    {
      header: "",
      accessor: () => null,
      render: (_, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="admin-btn admin-btn-ghost" style={{ padding: "4px 8px" }} aria-label={`Edit ${row.name}`} onClick={(e) => { e.stopPropagation(); openEdit(row); }}><Pencil size={14} /></button>
          <button type="button" className="admin-btn admin-btn-danger" style={{ padding: "4px 8px" }} aria-label={`Delete ${row.name}`} onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Testimonials — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Site — Testimonials</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}><Plus size={16} /> Add testimonial</button>
      </div>
      <p className="admin-field-hint" style={{ marginBottom: 16 }}>
        Published testimonials appear on the homepage. Client logos also appear in the logo strip. Only publish quotes the client has approved.
      </p>

      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable columns={columns} data={data} keyField="_id" searchFields={["name", "company", "quote"]} searchPlaceholder="Search testimonials…" emptyText="No testimonials yet" />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit testimonial" : "New testimonial"}>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-field">
              <label className="admin-label" htmlFor="t-quote">Quote</label>
              <textarea id="t-quote" className="admin-textarea" rows={5} {...form.register("quote")} />
              {form.formState.errors.quote && <p className="admin-field-error">{form.formState.errors.quote.message}</p>}
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="t-name">Client name</label>
              <input id="t-name" className="admin-input" {...form.register("name")} />
              {form.formState.errors.name && <p className="admin-field-error">{form.formState.errors.name.message}</p>}
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="t-role">Role (optional)</label>
              <input id="t-role" className="admin-input" placeholder="e.g. Operations Director" {...form.register("role")} />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="t-company">Company (optional)</label>
              <input id="t-company" className="admin-input" {...form.register("company")} />
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="t-logo">Company logo (optional)</label>
              <input id="t-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="admin-input" onChange={(e) => void onLogoFile(e.target.files?.[0])} disabled={uploading} />
              {uploading && <p className="admin-field-hint">Uploading…</p>}
              {logoUrl ? <img src={logoUrl} alt="" style={{ maxHeight: 40, marginTop: 8 }} /> : null}
              {form.formState.errors.logoUrl && <p className="admin-field-error">{form.formState.errors.logoUrl.message}</p>}
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="t-order">Order</label>
              <input id="t-order" type="number" className="admin-input" {...form.register("sortOrder")} />
            </div>
            <label className="admin-field" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" {...form.register("published")} />
              <span className="admin-label" style={{ margin: 0 }}>Show on website</span>
            </label>
            {form.formState.errors.root && <p className="admin-field-error" role="alert">{form.formState.errors.root.message}</p>}
            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={form.formState.isSubmitting || uploading}>
                {form.formState.isSubmitting ? "Saving…" : editing ? "Save" : "Create"}
              </button>
            </div>
          </form>
        )}
      </FormModal>

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete testimonial">
        <p className="admin-confirm-text">Delete the testimonial from <strong>{deleteTarget?.name}</strong>?</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </FormModal>
    </>
  );
}
