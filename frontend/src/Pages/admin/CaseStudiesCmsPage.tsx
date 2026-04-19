import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { uploadSiteAsset } from "../../lib/siteUpload";
import { useResourceApi } from "../../lib/useAdminApi";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";

type CaseStudyRow = {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  logoUrl?: string;
  exploreHref?: string;
  exploreLabel?: string;
  sortOrder: number;
  published: boolean;
};

const sortOrderSchema = z.preprocess((v) => {
  if (v === "" || v === undefined || v === null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}, z.number().int());

const schema = z.object({
  title: z.string().trim().min(1, "Required"),
  subtitle: z.string().trim().min(1, "Required"),
  description: z.string().trim().min(1, "Required"),
  imageUrl: z.string().trim().min(1, "Required").refine((s) => URL.canParse(s), "Invalid image URL"),
  logoUrl: z
    .string()
    .trim()
    .optional()
    .refine((s) => !s || URL.canParse(s), "Invalid logo URL"),
  exploreHref: z.string().trim().optional(),
  exploreLabel: z.string().trim().optional(),
  sortOrder: sortOrderSchema,
  published: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<CaseStudyRow>(
    "/case-study",
    "caseStudies",
    "caseStudy"
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CaseStudyRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CaseStudyRow | null>(null);
  const [uploading, setUploading] = useState<"case" | "logo" | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    mode: "onBlur",
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      imageUrl: "",
      logoUrl: "",
      exploreHref: "",
      exploreLabel: "",
      sortOrder: 0,
      published: false,
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      title: "",
      subtitle: "",
      description: "",
      imageUrl: "",
      logoUrl: "",
      exploreHref: "",
      exploreLabel: "",
      sortOrder: data.length,
      published: true,
    });
    setModalOpen(true);
  };

  const openEdit = (row: CaseStudyRow) => {
    setEditing(row);
    form.reset({
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      imageUrl: row.imageUrl,
      logoUrl: row.logoUrl ?? "",
      exploreHref: row.exploreHref ?? "",
      exploreLabel: row.exploreLabel ?? "",
      sortOrder: row.sortOrder ?? 0,
      published: row.published ?? false,
    });
    setModalOpen(true);
  };

  const onImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading("case");
    try {
      const url = await uploadSiteAsset(file, "case");
      form.setValue("imageUrl", url, { shouldValidate: true });
    } finally {
      setUploading(null);
    }
  };

  const onLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading("logo");
    try {
      const url = await uploadSiteAsset(file, "logo");
      form.setValue("logoUrl", url, { shouldValidate: true });
    } finally {
      setUploading(null);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const trimmedLogo = values.logoUrl?.trim() ?? "";
      const trimmedExplore = values.exploreHref?.trim() ?? "";
      const payload = {
        ...values,
        logoUrl: trimmedLogo || undefined,
        exploreHref: trimmedExplore || undefined,
        exploreLabel: values.exploreLabel?.trim() || undefined,
      };
      if (editing) {
        await update({
          id: editing._id,
          ...values,
          logoUrl: trimmedLogo,
          exploreHref: trimmedExplore,
          exploreLabel: values.exploreLabel?.trim() ?? "",
        });
      } else {
        await create(payload);
      }
      setModalOpen(false);
    } catch {
      /* */
    }
  });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget._id);
    setDeleteTarget(null);
  };

  const columns: Column<CaseStudyRow>[] = [
    { header: "Title", accessor: "title", sortable: true },
    { header: "Subtitle", accessor: "subtitle", sortable: true },
    {
      header: "Image",
      accessor: "imageUrl",
      render: (v) =>
        typeof v === "string" && v ? (
          <img src={v} alt="" style={{ width: 56, height: 36, objectFit: "cover", borderRadius: 6 }} />
        ) : (
          "—"
        ),
    },
    { header: "Order", accessor: "sortOrder", sortable: true },
    {
      header: "Pub",
      accessor: "published",
      render: (v) => (v ? "Yes" : "No"),
    },
    {
      header: "",
      accessor: () => null,
      render: (_, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            style={{ padding: "4px 8px" }}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            style={{ padding: "4px 8px" }}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Case studies (Our Work) — Xaeon Admin</title>
      </Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Our Work — Case studies</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add case study
        </button>
      </div>

      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? (
        <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>
          Loading…
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          keyField="_id"
          searchFields={["title", "subtitle"]}
          searchPlaceholder="Search case studies…"
        />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit case study" : "New case study"}>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-field">
              <label className="admin-label">Title</label>
              <input className="admin-input" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="admin-field-error">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="admin-field">
              <label className="admin-label">Subtitle</label>
              <input className="admin-input" {...form.register("subtitle")} />
            </div>
            <div className="admin-field">
              <label className="admin-label">Description</label>
              <textarea className="admin-textarea" rows={3} {...form.register("description")} />
            </div>
            <div className="admin-field">
              <label className="admin-label">Case image URL</label>
              <input className="admin-input" {...form.register("imageUrl")} />
              {form.formState.errors.imageUrl && (
                <p className="admin-field-error">{form.formState.errors.imageUrl.message}</p>
              )}
              <label className="admin-btn admin-btn-ghost" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <Upload size={14} />
                {uploading === "case" ? "Uploading…" : "Upload (WebP)"}
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onImageFile} disabled={uploading !== null} />
              </label>
            </div>
            <div className="admin-field">
              <label className="admin-label">Client logo URL (optional)</label>
              <input className="admin-input" {...form.register("logoUrl")} placeholder="WebP or SVG" />
              {form.formState.errors.logoUrl && (
                <p className="admin-field-error">{String(form.formState.errors.logoUrl.message)}</p>
              )}
              <label className="admin-btn admin-btn-ghost" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <Upload size={14} />
                {uploading === "logo" ? "Uploading…" : "Upload logo (WebP or SVG)"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  hidden
                  onChange={onLogoFile}
                  disabled={uploading !== null}
                />
              </label>
            </div>
            <div className="admin-field">
              <label className="admin-label">Explore link (optional)</label>
              <input className="admin-input" {...form.register("exploreHref")} placeholder="#case or https://…" />
            </div>
            <div className="admin-field">
              <label className="admin-label">Explore label (optional)</label>
              <input className="admin-input" {...form.register("exploreLabel")} />
            </div>
            <div className="admin-field">
              <label className="admin-label">Sort order</label>
              <input className="admin-input" type="number" {...form.register("sortOrder")} />
            </div>
            <div className="admin-field">
              <label className="admin-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Controller
                  name="published"
                  control={form.control}
                  render={({ field: { value, onChange, ref, onBlur } }) => (
                    <input
                      ref={ref}
                      type="checkbox"
                      checked={Boolean(value)}
                      onBlur={onBlur}
                      onChange={(e) => onChange(e.target.checked)}
                    />
                  )}
                />
                Published (visible on Our Work)
              </label>
            </div>
            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : editing ? "Save" : "Create"}
              </button>
            </div>
          </form>
        )}
      </FormModal>

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete case study">
        <p className="admin-confirm-text">
          Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?
        </p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </FormModal>
    </>
  );
}
