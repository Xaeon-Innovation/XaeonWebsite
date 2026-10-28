import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { getApiErrorMessage } from "../../lib/api";
import { useResourceApi } from "../../lib/useAdminApi";
import {
  ADMIN_BUILDER,
  BUILDER_CATEGORIES,
  CATEGORY_LABELS,
  PLAN_TIERS,
  fieldsToPrices,
  formatPrice,
  pricesToFields,
  type Localized,
  type PriceFields,
  type Prices,
} from "../../lib/builderAdmin";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";
import BuilderTabs from "../../Components/admin/builder/BuilderTabs";
import { LocalizedInputs, PriceGrid, PublishedBadge } from "../../Components/admin/builder/BuilderFields";

type Addon = {
  _id: string;
  key: string;
  kind: "module" | "service";
  name: Localized;
  description: Localized;
  icon?: string;
  prices: Prices;
  quoted: boolean;
  discountPercent: number;
  badge?: Localized;
  includedIn: string[];
  minPlan?: string;
  categories: string[];
  sortOrder: number;
  published: boolean;
};

type FormValues = PriceFields & {
  key: string;
  kind: "module" | "service";
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  badgeEn: string;
  badgeAr: string;
  icon: string;
  quoted: boolean;
  discountPercent: number;
  includedIn: string[];
  minPlan: string;
  categories: string[];
  sortOrder: number;
  published: boolean;
};

function toForm(a?: Addon, order = 0): FormValues {
  return {
    key: a?.key ?? "",
    kind: a?.kind ?? "module",
    nameEn: a?.name.en ?? "",
    nameAr: a?.name.ar ?? "",
    descriptionEn: a?.description?.en ?? "",
    descriptionAr: a?.description?.ar ?? "",
    badgeEn: a?.badge?.en ?? "",
    badgeAr: a?.badge?.ar ?? "",
    icon: a?.icon ?? "",
    quoted: a?.quoted ?? false,
    discountPercent: a?.discountPercent ?? 0,
    includedIn: a?.includedIn ?? [],
    minPlan: a?.minPlan ?? "",
    categories: a?.categories ?? [],
    sortOrder: a?.sortOrder ?? order,
    published: a?.published ?? false,
    ...pricesToFields(a?.prices),
  };
}

function toPayload(v: FormValues) {
  return {
    key: v.key,
    kind: v.kind,
    name: { en: v.nameEn, ar: v.nameAr },
    description: { en: v.descriptionEn, ar: v.descriptionAr },
    badge: { en: v.badgeEn, ar: v.badgeAr },
    icon: v.icon,
    prices: fieldsToPrices(v),
    quoted: v.quoted,
    discountPercent: Number(v.discountPercent) || 0,
    includedIn: v.includedIn || [],
    minPlan: v.minPlan || null,
    categories: v.categories || [],
    sortOrder: Number(v.sortOrder) || 0,
    published: v.published,
  };
}

export function Component() {
  const { data, loading, error, create, update, remove } = useResourceApi<Addon>(`${ADMIN_BUILDER}/addons`, "addons", "addon");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Addon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Addon | null>(null);
  const form = useForm<FormValues>();

  const open = (a: Addon | null) => {
    setEditing(a);
    form.reset(toForm(a ?? undefined, data.length + 1));
    setModalOpen(true);
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

  const columns: Column<Addon>[] = [
    { header: "Order", accessor: "sortOrder", sortable: true },
    { header: "Add-on", accessor: (r) => r.name.en, sortable: true, render: (v, r) => <><strong>{String(v)}</strong> <span className="admin-field-hint">{r.key}</span></> },
    { header: "Type", accessor: "kind", render: (v) => <span className={`admin-badge ${v === "service" ? "admin-badge-blue" : "admin-badge-gray"}`}>{v === "service" ? "Xaeon service" : "Site module"}</span> },
    { header: "Price (EGP)", accessor: (r) => formatPrice(r.prices) + (r.quoted ? " (from)" : "") },
    { header: "Discount", accessor: (r) => (r.discountPercent ? `${r.discountPercent}%` : "—") },
    { header: "Included in", accessor: (r) => r.includedIn.join(", ") || "—" },
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
      <Helmet><title>Builder add-ons — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Website Builder — Add-ons</h2>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => open(null)}><Plus size={16} /> Add add-on</button>
      </div>
      <BuilderTabs />
      <p className="admin-field-hint" style={{ marginBottom: 16 }}>
        Site modules (booking, payments…) and other Xaeon services offered with a website (mobile app, Polara, Velora…).
        A discount applies to the one-time price when bought with a website. "From" prices are shown as estimates and are not charged in the online deposit.
      </p>
      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable columns={columns} data={data} keyField="_id" searchFields={["key", "kind"]} searchPlaceholder="Search add-ons…" emptyText="No add-ons yet" pageSize={20} />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit add-on" : "New add-on"} wide>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label" htmlFor="ad-key">Key</label>
                <input id="ad-key" className="admin-input" placeholder="e.g. mobile-app" {...form.register("key", { required: "Required" })} />
                {form.formState.errors.key && <p className="admin-field-error">{form.formState.errors.key.message}</p>}
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="ad-kind">Type</label>
                <select id="ad-kind" className="admin-select" {...form.register("kind")}>
                  <option value="module">Site module</option>
                  <option value="service">Xaeon service (cross-sell)</option>
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="ad-icon">Icon</label>
                <input id="ad-icon" className="admin-input" placeholder="calendar, smartphone…" {...form.register("icon")} />
              </div>
            </div>
            <LocalizedInputs register={form.register} name="name" label="Name" />
            <LocalizedInputs register={form.register} name="description" label="Description" multiline />
            <PriceGrid register={form.register} />
            <div className="admin-form-row">
              <label className="admin-field" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" {...form.register("quoted")} />
                <span className="admin-label" style={{ margin: 0 }}>"From" price (team confirms scope)</span>
              </label>
              <div className="admin-field">
                <label className="admin-label" htmlFor="ad-disc">Bundle discount %</label>
                <input id="ad-disc" type="number" min={0} max={100} className="admin-input" {...form.register("discountPercent", { valueAsNumber: true })} />
              </div>
            </div>
            <LocalizedInputs register={form.register} name="badge" label="Badge (optional, e.g. Save 15%)" />
            <div className="admin-form-row">
              <fieldset className="admin-field">
                <legend className="admin-label">Included free in plans</legend>
                {PLAN_TIERS.map((p) => (
                  <label key={p} style={{ display: "inline-flex", gap: 4, marginInlineEnd: 12 }}>
                    <input type="checkbox" value={p} {...form.register("includedIn")} /> {p}
                  </label>
                ))}
              </fieldset>
              <div className="admin-field">
                <label className="admin-label" htmlFor="ad-min">Needs plan</label>
                <select id="ad-min" className="admin-select" {...form.register("minPlan")}>
                  <option value="">Any plan</option>
                  {PLAN_TIERS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <fieldset className="admin-field">
              <legend className="admin-label">Suggest first for categories (none = all)</legend>
              {BUILDER_CATEGORIES.map((c) => (
                <label key={c} style={{ display: "inline-flex", gap: 4, marginInlineEnd: 12 }}>
                  <input type="checkbox" value={c} {...form.register("categories")} /> {CATEGORY_LABELS[c]}
                </label>
              ))}
            </fieldset>
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label" htmlFor="ad-order">Order</label>
                <input id="ad-order" type="number" className="admin-input" {...form.register("sortOrder", { valueAsNumber: true })} />
              </div>
              <label className="admin-field" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" {...form.register("published")} />
                <span className="admin-label" style={{ margin: 0 }}>Show in builder</span>
              </label>
            </div>
            {form.formState.errors.root && <p className="admin-field-error" role="alert">{form.formState.errors.root.message}</p>}
            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : editing ? "Save" : "Create"}
              </button>
            </div>
          </form>
        )}
      </FormModal>

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete add-on">
        <p className="admin-confirm-text">Delete <strong>{deleteTarget?.name.en}</strong>? Hide it instead if existing orders reference it.</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-danger" onClick={async () => { if (deleteTarget) await remove(deleteTarget._id); setDeleteTarget(null); }}>Delete</button>
        </div>
      </FormModal>
    </>
  );
}
