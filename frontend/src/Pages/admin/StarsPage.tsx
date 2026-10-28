import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Pencil, Plus, Star as StarIcon, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { getApiErrorMessage } from "../../lib/api";
import { useResourceApi } from "../../lib/useAdminApi";
import { uploadSiteAsset } from "../../lib/siteUpload";
import { ADMIN_BUILDER } from "../../lib/builderAdmin";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";
import BuilderTabs from "../../Components/admin/builder/BuilderTabs";
import { PublishedBadge } from "../../Components/admin/builder/BuilderFields";

const PRODUCTS = [
  { value: "website", label: "Website" },
  { value: "app", label: "Mobile / web app" },
  { value: "polara", label: "Polara (HR)" },
  { value: "velora", label: "Velora (clinics)" },
  { value: "custom", label: "Custom software" },
] as const;

type Star = {
  _id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
  product: string;
  constellation?: string;
  country?: string;
  since?: number;
  magnitude: number;
  highlight?: string;
  caseStudy?: string;
  url?: string;
  sortOrder: number;
  published: boolean;
};

type CaseStudyOption = { _id: string; title: string; slug: string };

type FormValues = Omit<Star, "_id" | "since" | "caseStudy"> & { since: string; caseStudy: string };

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<Star>(`${ADMIN_BUILDER}/stars`, "stars", "star");
  const { data: caseStudies } = useResourceApi<CaseStudyOption>("/case-study", "caseStudies", "caseStudy");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Star | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Star | null>(null);
  const [uploading, setUploading] = useState(false);
  const form = useForm<FormValues>();
  const logoUrl = form.watch("logoUrl");

  const open = (s: Star | null) => {
    setEditing(s);
    form.reset({
      name: s?.name ?? "",
      logoUrl: s?.logoUrl ?? "",
      industry: s?.industry ?? "",
      product: s?.product ?? "website",
      constellation: s?.constellation ?? "",
      country: s?.country ?? "",
      since: s?.since ? String(s.since) : "",
      magnitude: s?.magnitude ?? 1,
      highlight: s?.highlight ?? "",
      caseStudy: s?.caseStudy ?? "",
      url: s?.url ?? "",
      sortOrder: s?.sortOrder ?? data.length + 1,
      published: s?.published ?? false,
    });
    setModalOpen(true);
  };

  const onLogoFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      form.setValue("logoUrl", await uploadSiteAsset(file, "logo"), { shouldDirty: true });
    } catch (e) {
      form.setError("logoUrl", { message: getApiErrorMessage(e, "Upload failed") });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = form.handleSubmit(async (v) => {
    const payload = {
      ...v,
      since: v.since ? Number(v.since) : null,
      magnitude: Number(v.magnitude) || 1,
      sortOrder: Number(v.sortOrder) || 0,
      caseStudy: v.caseStudy || null,
    };
    try {
      if (editing) await update({ id: editing._id, ...payload });
      else await create(payload);
      setModalOpen(false);
    } catch (e) {
      form.setError("root", { message: getApiErrorMessage(e, "Save failed. Please try again.") });
    }
  });

  const columns: Column<Star>[] = [
    { header: "Order", accessor: "sortOrder", sortable: true },
    {
      header: "Client",
      accessor: "name",
      sortable: true,
      render: (v, r) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {r.logoUrl ? <img src={r.logoUrl} alt="" style={{ height: 20 }} /> : null}
          <strong>{String(v)}</strong>
        </span>
      ),
    },
    { header: "Constellation", accessor: (r) => r.constellation || PRODUCTS.find((p) => p.value === r.product)?.label || r.product, sortable: true },
    { header: "Brightness", accessor: "magnitude", render: (v) => <span aria-label={`${v} of 3`}>{Array.from({ length: Number(v) }).map((_, i) => <StarIcon key={i} size={12} style={{ display: "inline" }} />)}</span> },
    { header: "Case study", accessor: (r) => caseStudies.find((c) => c._id === r.caseStudy)?.title ?? "—" },
    { header: "On website", accessor: "published", sortable: true, render: (v) => <PublishedBadge value={v} /> },
    {
      header: "",
      accessor: () => null,
      render: (_, row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="admin-btn admin-btn-ghost" style={{ padding: "4px 8px" }} aria-label={`Edit ${row.name}`} onClick={(e) => { e.stopPropagation(); open(row); }}><Pencil size={14} /></button>
          <button type="button" className="admin-btn admin-btn-danger" style={{ padding: "4px 8px" }} aria-label={`Delete ${row.name}`} onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Galaxy of stars — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Site — Galaxy of stars</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => open(null)}><Plus size={16} /> Add client star</button>
      </div>
      <BuilderTabs />
      <p className="admin-field-hint" style={{ marginBottom: 16 }}>
        Each published client appears as a star on the homepage, Work page and Website Builder. Stars are grouped into constellations by product.
        Brightness 3 = flagship client. Linking a case study makes the star clickable. Only publish clients who agreed to be shown.
      </p>
      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable columns={columns} data={data} keyField="_id" searchFields={["name", "industry", "product"]} searchPlaceholder="Search clients…" emptyText="No stars yet — run backend/scripts/migrate-stars.ts or add one" pageSize={20} />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${editing.name}` : "New client star"} wide>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label" htmlFor="st-name">Client name</label>
                <input id="st-name" className="admin-input" {...form.register("name", { required: "Required" })} />
                {form.formState.errors.name && <p className="admin-field-error">{form.formState.errors.name.message}</p>}
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="st-industry">Industry</label>
                <input id="st-industry" className="admin-input" placeholder="e.g. Healthcare" {...form.register("industry")} />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label" htmlFor="st-product">What we built (constellation)</label>
                <select id="st-product" className="admin-select" {...form.register("product")}>
                  {PRODUCTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="st-const">Custom constellation (optional)</label>
                <input id="st-const" className="admin-input" placeholder="Overrides the product group" {...form.register("constellation")} />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="st-mag">Brightness</label>
                <select id="st-mag" className="admin-select" {...form.register("magnitude", { valueAsNumber: true })}>
                  <option value={1}>1 — client</option>
                  <option value={2}>2 — key client</option>
                  <option value={3}>3 — flagship</option>
                </select>
              </div>
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="st-hl">Highlight (optional)</label>
              <input id="st-hl" className="admin-input" maxLength={200} placeholder="e.g. 40% fewer no-shows in 3 months" {...form.register("highlight")} />
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label" htmlFor="st-cs">Case study</label>
                <select id="st-cs" className="admin-select" {...form.register("caseStudy")}>
                  <option value="">None</option>
                  {caseStudies.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="st-url">Client website (optional)</label>
                <input id="st-url" className="admin-input" placeholder="https://…" {...form.register("url")} />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label" htmlFor="st-country">Country</label>
                <input id="st-country" className="admin-input" {...form.register("country")} />
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="st-since">Client since (year)</label>
                <input id="st-since" type="number" min={2000} max={2100} className="admin-input" {...form.register("since")} />
              </div>
            </div>
            <div className="admin-field">
              <label className="admin-label" htmlFor="st-logo">Logo</label>
              <input id="st-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="admin-input" onChange={(e) => void onLogoFile(e.target.files?.[0])} disabled={uploading} />
              {uploading && <p className="admin-field-hint">Uploading…</p>}
              {logoUrl ? <img src={logoUrl} alt="" style={{ maxHeight: 40, marginTop: 8 }} /> : null}
              {form.formState.errors.logoUrl && <p className="admin-field-error">{form.formState.errors.logoUrl.message}</p>}
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label" htmlFor="st-order">Order</label>
                <input id="st-order" type="number" className="admin-input" {...form.register("sortOrder", { valueAsNumber: true })} />
              </div>
              <label className="admin-field" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" {...form.register("published")} />
                <span className="admin-label" style={{ margin: 0 }}>Show on website</span>
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

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove star">
        <p className="admin-confirm-text">Remove <strong>{deleteTarget?.name}</strong> from the galaxy?</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={async () => { if (deleteTarget) await remove(deleteTarget._id); setDeleteTarget(null); }}>Remove</button>
        </div>
      </FormModal>
    </>
  );
}
