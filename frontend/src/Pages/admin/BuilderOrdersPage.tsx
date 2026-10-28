import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

import api, { getApiErrorMessage } from "../../lib/api";
import { ADMIN_BUILDER, CATEGORY_LABELS, ORDER_STATUSES, ORDER_STATUS_LABELS } from "../../lib/builderAdmin";
import DataTable, { type Column } from "../../Components/admin/DataTable";
import FormModal from "../../Components/admin/FormModal";
import BuilderTabs from "../../Components/admin/builder/BuilderTabs";

type QuoteLine = { key: string; label: string; setup: number; monthly: number; discount: number; included: boolean; quoted: boolean };
type Order = {
  _id: string;
  ref: string;
  status: string;
  country?: string;
  market: string;
  locale: string;
  config: { category: string; goal?: string; templateSlug: string; pages?: string[]; planTier: string; addonKeys: string[]; billing: string };
  brand: { businessName: string; primary: string; accent: string; font: string; tone?: string; logoUrl?: string; assetUrls: string[]; notes?: string };
  contact: { name: string; email: string; phone: string; company?: string };
  quote: { currency: string; lines: QuoteLine[]; setup: number; monthly: number; annual: number; deposit: number; discountTotal: number; billing: string };
  payment: { provider?: string; status: string; amount?: number; paidAt?: string; lastEvent?: string };
  lead?: string;
  activity: { type: string; message: string; byName?: string; at: string }[];
  createdAt: string;
};

const money = (n: number, c: string) => `${c} ${Math.round(n).toLocaleString()}`;

function StatusBadge({ status }: { status: string }) {
  const meta = ORDER_STATUS_LABELS[status] ?? { label: status, badge: "admin-badge-gray" };
  return <span className={`admin-badge ${meta.badge}`}>{meta.label}</span>;
}

export function Component() {
  const [filter, setFilter] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ orders: Order[] }>(`${ADMIN_BUILDER}/orders`, { params: filter ? { status: filter } : {} })
      .then((res) => { setOrders(res.data.orders ?? []); setError(null); })
      .catch((e) => setError(getApiErrorMessage(e, "Failed to load orders")))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(load, [load]);

  const act = async (body: Record<string, unknown>) => {
    if (!selected) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await api.patch<{ order: Order }>(`${ADMIN_BUILDER}/orders/${selected._id}`, body);
      setSelected(res.data.order);
      setOrders((prev) => prev.map((o) => (o._id === res.data.order._id ? res.data.order : o)));
      setNote("");
    } catch (e) {
      setActionError(getApiErrorMessage(e, "Update failed"));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Order>[] = [
    { header: "Date", accessor: "createdAt", sortable: true, render: (v) => new Date(String(v)).toLocaleDateString() },
    { header: "Ref", accessor: "ref", render: (v) => <code>{String(v)}</code> },
    { header: "Business", accessor: (r) => r.brand.businessName, sortable: true },
    { header: "Country", accessor: (r) => r.country ?? "—", sortable: true },
    { header: "Template / plan", accessor: (r) => `${r.config.templateSlug} · ${r.config.planTier}` },
    { header: "Setup", accessor: (r) => r.quote.setup, sortable: true, render: (_, r) => money(r.quote.setup, r.quote.currency) },
    { header: "Deposit", accessor: (r) => r.quote.deposit, render: (_, r) => `${money(r.quote.deposit, r.quote.currency)}${r.payment.status === "paid" ? " ✓" : ""}` },
    { header: "Status", accessor: "status", sortable: true, render: (v) => <StatusBadge status={String(v)} /> },
  ];

  const o = selected;
  return (
    <>
      <Helmet><title>Builder orders — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Website Builder — Orders</h2>
        <select className="admin-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s].label}</option>)}
        </select>
      </div>
      <BuilderTabs />
      <p className="admin-field-hint" style={{ marginBottom: 16 }}>
        Orders from the website builder. Each one is also a lead (source “Website Builder”) in Leads. Prices were computed by the server at order time.
      </p>
      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {loading ? <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div> : (
        <DataTable columns={columns} data={orders} keyField="_id" onRowClick={(r) => { setSelected(r); setActionError(null); }} searchFields={["ref"]} searchPlaceholder="Search by ref…" emptyText="No orders yet" pageSize={20} />
      )}

      <FormModal open={!!o} onClose={() => setSelected(null)} title={o ? `${o.ref} — ${o.brand.businessName}` : ""} wide="xl">
        {o && (
          <div className="admin-form">
            <div className="admin-form-row" style={{ alignItems: "center" }}>
              <StatusBadge status={o.status} />
              <span className="admin-field-hint">Payment: {o.payment.status}{o.payment.provider ? ` via ${o.payment.provider}` : ""}{o.payment.paidAt ? ` on ${new Date(o.payment.paidAt).toLocaleString()}` : ""}</span>
              {o.lead && <Link to={`/admin/leads?lead=${o.lead}`} className="admin-btn admin-btn-ghost">Open lead</Link>}
            </div>

            <section className="admin-form-section">
              <h3 className="admin-form-section-title">Customer</h3>
              <p>{o.contact.name}{o.contact.company ? ` · ${o.contact.company}` : ""}<br />
                <a href={`mailto:${o.contact.email}`}>{o.contact.email}</a> · <a href={`tel:${o.contact.phone}`}>{o.contact.phone}</a> · {o.locale.toUpperCase()} · {o.country ?? "—"} ({o.market})</p>
            </section>

            <section className="admin-form-section">
              <h3 className="admin-form-section-title">Website</h3>
              <p>{CATEGORY_LABELS[o.config.category] ?? o.config.category}{o.config.goal ? ` · goal: ${o.config.goal}` : ""} · template <strong>{o.config.templateSlug}</strong> · plan <strong>{o.config.planTier}</strong> · billed {o.config.billing}</p>
              {o.config.pages?.length ? <p>Pages ({o.config.pages.length}): {o.config.pages.join(", ")}</p> : null}
              <p style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", gap: 4 }} aria-label="Brand colours">
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: o.brand.primary }} title={o.brand.primary} />
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: o.brand.accent }} title={o.brand.accent} />
                </span>
                <span>{o.brand.primary} / {o.brand.accent} · font {o.brand.font}{o.brand.tone ? ` · tone ${o.brand.tone}` : ""}</span>
              </p>
              {(o.brand.logoUrl || o.brand.assetUrls.length > 0) && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[o.brand.logoUrl, ...o.brand.assetUrls].filter(Boolean).map((u) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer" download><img src={u} alt="" style={{ height: 64, borderRadius: 6, background: "#fff" }} /></a>
                  ))}
                </div>
              )}
              {o.brand.notes && <p style={{ whiteSpace: "pre-wrap" }}>{o.brand.notes}</p>}
            </section>

            <section className="admin-form-section">
              <h3 className="admin-form-section-title">Quote ({o.quote.currency})</h3>
              <table className="admin-table" style={{ width: "100%" }}>
                <tbody>
                  {o.quote.lines.map((l) => (
                    <tr key={l.key}>
                      <td className="admin-td">{l.label}{l.quoted ? " (from)" : ""}</td>
                      <td className="admin-td">{l.included ? "Included" : money(l.setup, o.quote.currency)}{l.discount ? ` (−${money(l.discount, o.quote.currency)})` : ""}</td>
                      <td className="admin-td">{l.monthly ? `${money(l.monthly, o.quote.currency)}/mo` : ""}</td>
                    </tr>
                  ))}
                  <tr><td className="admin-td"><strong>Setup</strong></td><td className="admin-td"><strong>{money(o.quote.setup, o.quote.currency)}</strong></td><td className="admin-td"><strong>{money(o.quote.monthly, o.quote.currency)}/mo</strong></td></tr>
                  <tr><td className="admin-td">Deposit</td><td className="admin-td">{money(o.quote.deposit, o.quote.currency)}</td><td className="admin-td">{o.quote.billing === "annual" ? `Annual: ${money(o.quote.annual, o.quote.currency)}` : ""}</td></tr>
                </tbody>
              </table>
            </section>

            <section className="admin-form-section">
              <h3 className="admin-form-section-title">Actions</h3>
              <div className="admin-form-row">
                <select className="admin-select" value={o.status} onChange={(e) => void act({ status: e.target.value })} disabled={saving} aria-label="Status">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s].label}</option>)}
                </select>
                {o.payment.status !== "paid" && (
                  <button type="button" className="admin-btn admin-btn-primary" disabled={saving} onClick={() => void act({ markPaid: true, note: "Marked paid manually" })}>Mark deposit paid</button>
                )}
              </div>
              <div className="admin-field">
                <label className="admin-label" htmlFor="ord-note">Add note</label>
                <textarea id="ord-note" className="admin-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                <button type="button" className="admin-btn admin-btn-ghost" disabled={saving || !note.trim()} onClick={() => void act({ note })}>Save note</button>
              </div>
              {actionError && <p className="admin-field-error" role="alert">{actionError}</p>}
            </section>

            <section className="admin-form-section">
              <h3 className="admin-form-section-title">History</h3>
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 6 }}>
                {[...o.activity].reverse().map((a, i) => (
                  <li key={i} className="admin-field-hint">{new Date(a.at).toLocaleString()} — {a.message}{a.byName ? ` (${a.byName})` : ""}</li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </FormModal>
    </>
  );
}
