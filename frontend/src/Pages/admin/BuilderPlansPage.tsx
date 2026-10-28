import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Pencil } from "lucide-react";
import { useForm } from "react-hook-form";

import { getApiErrorMessage } from "../../lib/api";
import { useResourceApi } from "../../lib/useAdminApi";
import {
  ADMIN_BUILDER,
  MARKETS,
  PLAN_TIERS,
  fieldsToPrices,
  formatPrice,
  linesToLocalized,
  localizedToLines,
  pricesToFields,
  type Localized,
  type PriceFields,
  type Prices,
} from "../../lib/builderAdmin";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";
import BuilderTabs from "../../Components/admin/builder/BuilderTabs";
import { LocalizedInputs, LocalizedLines, PriceGrid, PublishedBadge } from "../../Components/admin/builder/BuilderFields";

type Plan = {
  _id: string;
  tier: string;
  includedPages?: number;
  extraPagePrice?: Record<string, number>;
  name: Localized;
  summary: Localized;
  prices: Prices;
  quoted: boolean;
  features: Localized[];
  highlighted: boolean;
  sortOrder: number;
  published: boolean;
};

type FormValues = PriceFields & {
  tier: string;
  includedPages: number;
  extra_EGP: number;
  extra_AED: number;
  extra_USD: number;
  nameEn: string;
  nameAr: string;
  summaryEn: string;
  summaryAr: string;
  features: string;
  quoted: boolean;
  highlighted: boolean;
  sortOrder: number;
  published: boolean;
};

export function Component() {
  const { data, loading, error, create, update } = useResourceApi<Plan>(`${ADMIN_BUILDER}/plans`, "plans", "plan");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const form = useForm<FormValues>();
  const missingTiers = PLAN_TIERS.filter((t) => !data.some((p) => p.tier === t));

  const open = (p: Plan | null) => {
    setEditing(p);
    form.reset({
      tier: p?.tier ?? missingTiers[0] ?? "launch",
      includedPages: p?.includedPages ?? 5,
      extra_EGP: p?.extraPagePrice?.EGP ?? 1000,
      extra_AED: p?.extraPagePrice?.AED ?? 140,
      extra_USD: p?.extraPagePrice?.USD ?? 40,
      nameEn: p?.name.en ?? "",
      nameAr: p?.name.ar ?? "",
      summaryEn: p?.summary?.en ?? "",
      summaryAr: p?.summary?.ar ?? "",
      features: localizedToLines(p?.features),
      quoted: p?.quoted ?? false,
      highlighted: p?.highlighted ?? false,
      sortOrder: p?.sortOrder ?? data.length,
      published: p?.published ?? false,
      ...pricesToFields(p?.prices),
    });
    setModalOpen(true);
  };

  const onSubmit = form.handleSubmit(async (v) => {
    const payload = {
      tier: v.tier,
      name: { en: v.nameEn, ar: v.nameAr },
      summary: { en: v.summaryEn, ar: v.summaryAr },
      features: linesToLocalized(v.features),
      prices: fieldsToPrices(v),
      includedPages: Number(v.includedPages) || 1,
      extraPagePrice: { EGP: Number(v.extra_EGP) || 0, AED: Number(v.extra_AED) || 0, USD: Number(v.extra_USD) || 0 },
      quoted: v.quoted,
      highlighted: v.highlighted,
      sortOrder: Number(v.sortOrder) || 0,
      published: v.published,
    };
    try {
      if (editing) await update({ id: editing._id, ...payload });
      else await create(payload);
      setModalOpen(false);
    } catch (e) {
      form.setError("root", { message: getApiErrorMessage(e, "Save failed. Please try again.") });
    }
  });

  const columns: Column<Plan>[] = [
    { header: "Order", accessor: "sortOrder", sortable: true },
    { header: "Plan", accessor: (r) => r.name.en, render: (v, r) => <><strong>{String(v)}</strong>{r.highlighted ? <span className="admin-badge admin-badge-green" style={{ marginInlineStart: 6 }}>Popular</span> : null}</> },
    { header: "Pages", accessor: (r) => `${r.includedPages ?? "—"} incl.` },
    ...MARKETS.map<Column<Plan>>((m) => ({ header: m, accessor: (r) => formatPrice(r.prices, m) + (r.quoted ? " (from)" : "") })),
    { header: "On website", accessor: "published", render: (v) => <PublishedBadge value={v} /> },
    {
      header: "",
      accessor: () => null,
      render: (_, row) => (
        <button type="button" className="admin-btn admin-btn-ghost" style={{ padding: "4px 8px" }} aria-label={`Edit ${row.name.en}`} onClick={(e) => { e.stopPropagation(); open(row); }}><Pencil size={14} /></button>
      ),
    },
  ];

  return (
    <>
      <Helmet><title>Builder plans — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Website Builder — Plans</h2>
        {missingTiers.length > 0 && <button type="button" className="admin-btn admin-btn-primary" onClick={() => open(null)}>Add plan</button>}
      </div>
      <BuilderTabs />
      <p className="admin-field-hint" style={{ marginBottom: 16 }}>
        Setup fee + monthly subscription per market. The online deposit is 100% of setup on Launch and 50% otherwise; "From" plans (Custom) take no online deposit.
        Annual billing charges 10 months. Pages beyond "Pages included" cost the extra-page price each (one-time).
      </p>
      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable columns={columns} data={data} keyField="_id" emptyText="No plans yet — run backend/scripts/seed-builder.ts" />
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${editing.name.en}` : "New plan"} wide>
        {modalOpen && (
          <form className="admin-form" onSubmit={onSubmit}>
            {!editing && (
              <div className="admin-field">
                <label className="admin-label" htmlFor="pl-tier">Tier</label>
                <select id="pl-tier" className="admin-select" {...form.register("tier")}>
                  {missingTiers.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            <LocalizedInputs register={form.register} name="name" label="Name" />
            <LocalizedInputs register={form.register} name="summary" label="Summary" />
            <PriceGrid register={form.register} />
            <div className="admin-form-row">
              <div className="admin-field">
                <label className="admin-label" htmlFor="pl-pages">Pages included</label>
                <input id="pl-pages" type="number" min={1} className="admin-input" {...form.register("includedPages", { valueAsNumber: true })} />
              </div>
              {MARKETS.map((m) => (
                <div key={m} className="admin-field">
                  <label className="admin-label" htmlFor={`pl-extra-${m}`}>Extra page ({m})</label>
                  <input id={`pl-extra-${m}`} type="number" min={0} className="admin-input" {...form.register(`extra_${m}` as const, { valueAsNumber: true })} />
                </div>
              ))}
            </div>
            <LocalizedLines register={form.register} name="features" label="What's included" />
            <div className="admin-form-row">
              <label className="admin-field" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" {...form.register("quoted")} />
                <span className="admin-label" style={{ margin: 0 }}>"From" price</span>
              </label>
              <label className="admin-field" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" {...form.register("highlighted")} />
                <span className="admin-label" style={{ margin: 0 }}>Most popular</span>
              </label>
              <label className="admin-field" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" {...form.register("published")} />
                <span className="admin-label" style={{ margin: 0 }}>Show in builder</span>
              </label>
              <div className="admin-field">
                <label className="admin-label" htmlFor="pl-order">Order</label>
                <input id="pl-order" type="number" className="admin-input" {...form.register("sortOrder", { valueAsNumber: true })} />
              </div>
            </div>
            {form.formState.errors.root && <p className="admin-field-error" role="alert">{form.formState.errors.root.message}</p>}
            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </FormModal>
    </>
  );
}
