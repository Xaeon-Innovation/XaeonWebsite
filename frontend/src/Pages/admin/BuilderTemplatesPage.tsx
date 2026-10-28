import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { getApiErrorMessage } from "../../lib/api";
import { useResourceApi } from "../../lib/useAdminApi";
import { uploadSiteAsset } from "../../lib/siteUpload";
import {
  ADMIN_BUILDER,
  BUILDER_CATEGORIES,
  CATEGORY_LABELS,
  LAYOUTS,
  PLAN_TIERS,
  linesToLocalized,
  localizedToLines,
  type Localized,
} from "../../lib/builderAdmin";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";
import BuilderTabs from "../../Components/admin/builder/BuilderTabs";
import { LocalizedInputs, LocalizedLines, PublishedBadge } from "../../Components/admin/builder/BuilderFields";

type Template = {
  _id: string;
  slug: string;
  category: string;
  name: Localized;
  tagline: Localized;
  previewImageUrl?: string;
  layout: string;
  defaultBrand: { primary: string; accent: string; font: string };
  pages: Localized[];
  features: Localized[];
  recommendedAddons: string[];
  minPlan: string;
  sortOrder: number;
  published: boolean;
};

type FormValues = {
  slug: string;
  category: string;
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  previewImageUrl: string;
  layout: string;
  primary: string;
  accent: string;
  font: string;
  pages: string;
  features: string;
  recommendedAddons: string;
  minPlan: string;
  sortOrder: number;
  published: boolean;
};

function toForm(t?: Template, order = 0): FormValues {
  return {
    slug: t?.slug ?? "",
    category: t?.category ?? "clinics",
    nameEn: t?.name.en ?? "",
    nameAr: t?.name.ar ?? "",
    taglineEn: t?.tagline?.en ?? "",
    taglineAr: t?.tagline?.ar ?? "",
    previewImageUrl: t?.previewImageUrl ?? "",
    layout: t?.layout ?? "classic",
    primary: t?.defaultBrand?.primary ?? "#72c04f",
    accent: t?.defaultBrand?.accent ?? "#1b3d50",
    font: t?.defaultBrand?.font ?? "modern",
    pages: localizedToLines(t?.pages),
    features: localizedToLines(t?.features),
    recommendedAddons: (t?.recommendedAddons ?? []).join(", "),
    minPlan: t?.minPlan ?? "launch",
    sortOrder: t?.sortOrder ?? order,
    published: t?.published ?? false,
  };
}

function toPayload(v: FormValues) {
  return {
    slug: v.slug,
    category: v.category,
    name: { en: v.nameEn, ar: v.nameAr },
    tagline: { en: v.taglineEn, ar: v.taglineAr },
    previewImageUrl: v.previewImageUrl,
    layout: v.layout,
    defaultBrand: { primary: v.primary, accent: v.accent, font: v.font },
    pages: linesToLocalized(v.pages),
    features: linesToLocalized(v.features),
    recommendedAddons: v.recommendedAddons.split(",").map((s) => s.trim()).filter(Boolean),
    minPlan: v.minPlan,
    sortOrder: Number(v.sortOrder) || 0,
    published: v.published,
  };
}

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<Template>(`${ADMIN_BUILDER}/templates`, "templates", "template");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [uploading, setUploading] = useState(false);
  const form = useForm<FormValues>();
  const preview = form.watch("previewImageUrl");

  const open = (t: Template | null) => {
    setEditing(t);
    form.reset(toForm(t ?? undefined, data.length + 1));
    setModalOpen(true);
  };

  const onPreviewFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      form.setValue("previewImageUrl", await uploadSiteAsset(file, "case"), { shouldDirty: true });
    } catch (e) {
      form.setError("previewImageUrl", { message: getApiErrorMessage(e, "Upload failed") });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) await update({ id: editing._id, ...toPayload(values) });
      else await create(toPayload(values));
      setModalOpen(false);
    } catch (e) {
      form.setError("root", { message: getApiErrorMessage(e, "Save failed. Please try again.") });
    }
  });

  const columns: Column<Template>[] = [
    { header: "Order", accessor: "sortOrder", sortable: true },
    { header: "Template", accessor: (r) => r.name.en, sortable: true, render: (v, r) => <><strong>{String(v)}</strong> <span className="admin-field-hint">/{r.slug}</span></> },
    { header: "Category", accessor: (r) => CATEGORY_LABELS[r.category] ?? r.category, sortable: true },
    { header: "Layout", accessor: "layout" },
    {
      header: "Colours",
      accessor: () => null,
      render: (_, r) => (
        <span style={{ display: "inline-flex", gap: 4 }}>
          <span style={{ width: 16, height: 16, borderRadius: 4, background: r.defaultBrand?.primary }} />
          <span style={{ width: 16, height: 16, borderRadius: 4, background: r.defaultBrand?.accent }} />
        </span>
      ),
    },
    { header: "Min plan", accessor: "minPlan" },
    { header: "On website", accessor: "published", sortable: true, render: (v) => <PublishedBadge value={v} /> },
    {
      header: "",
      accessor: () => null,
      render: (_, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="admin-btn admin-btn-ghost" style={{ padding: "4px 8px" }} aria-label={`Edit ${row.name.en}`} onClick={(e) => { e.stopPropagation(); open(row); }}><Pencil size={14} /></button>
          <button type="button" className="admin-btn admin-btn-danger" style={{ padding: "4px 8px" }} aria-label={`Delete ${row.name.en}`} onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Builder templates — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Website Builder — Templates</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => open(null)}><Plus size={16} /> Add template</button>
      </div>
      <BuilderTabs />
      <p className="admin-field-hint" style={{ marginBottom: 16 }}>
        Templates customers pick in the builder. Without a preview image the website draws a live preview in the chosen layout using the customer's colours.
      </p>
      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable columns={columns} data={data} keyField="_id" searchFields={["slug", "category"]} searchPlaceholder="Search templates…" emptyText="No templates yet — run backend/scripts/seed-builder.ts" pageSize={20} />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit template" : "New template"} wide>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label" htmlFor="tp-slug">Slug</label>
                <input id="tp-slug" className="admin-input" {...form.register("slug", { required: "Required" })} />
                {form.formState.errors.slug && <p className="admin-field-error">{form.formState.errors.slug.message}</p>}
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="tp-cat">Category</label>
                <select id="tp-cat" className="admin-select" {...form.register("category")}>
                  {BUILDER_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
            </div>
            <LocalizedInputs register={form.register} name="name" label="Name" />
            <LocalizedInputs register={form.register} name="tagline" label="Tagline" />
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label" htmlFor="tp-layout">Layout</label>
                <select id="tp-layout" className="admin-select" {...form.register("layout")}>
                  {LAYOUTS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="tp-min">Minimum plan</label>
                <select id="tp-min" className="admin-select" {...form.register("minPlan")}>
                  {PLAN_TIERS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label" htmlFor="tp-primary">Default primary</label>
                <input id="tp-primary" type="color" className="admin-input" {...form.register("primary")} />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="tp-accent">Default accent</label>
                <input id="tp-accent" type="color" className="admin-input" {...form.register("accent")} />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="tp-font">Font style</label>
                <select id="tp-font" className="admin-select" {...form.register("font")}>
                  {["modern", "rounded", "serif", "display"].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <LocalizedLines register={form.register} name="pages" label="Pages included" />
            <LocalizedLines register={form.register} name="features" label="Highlights" />
            <div className="admin-field">
              <label className="admin-label" htmlFor="tp-addons">Recommended add-ons</label>
              <input id="tp-addons" className="admin-input" placeholder="booking, mobile-app" {...form.register("recommendedAddons")} />
              <p className="admin-field-hint">Add-on keys, comma separated.</p>
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="tp-img">Preview image (optional)</label>
              <input id="tp-img" type="file" accept="image/png,image/jpeg,image/webp" className="admin-input" onChange={(e) => void onPreviewFile(e.target.files?.[0])} disabled={uploading} />
              {uploading && <p className="admin-field-hint">Uploading…</p>}
              {preview ? <img src={preview} alt="" style={{ maxHeight: 120, marginTop: 8, borderRadius: 8 }} /> : null}
              {form.formState.errors.previewImageUrl && <p className="admin-field-error">{form.formState.errors.previewImageUrl.message}</p>}
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label" htmlFor="tp-order">Order</label>
                <input id="tp-order" type="number" className="admin-input" {...form.register("sortOrder", { valueAsNumber: true })} />
              </div>
              <label className="admin-field" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" {...form.register("published")} />
                <span className="admin-label" style={{ margin: 0 }}>Show in builder</span>
              </label>
            </div>
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

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete template">
        <p className="admin-confirm-text">Delete <strong>{deleteTarget?.name.en}</strong>? Existing orders keep their template slug.</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={async () => { if (deleteTarget) await remove(deleteTarget._id); setDeleteTarget(null); }}>Delete</button>
        </div>
      </FormModal>
    </>
  );
}
