import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router";
import { Download, KanbanSquare, Rows3 } from "lucide-react";

import api, { getApiErrorMessage } from "../../lib/api";
import {
  bulkUpdate,
  exportUrl,
  fetchLeads,
  SOURCE_LABELS,
  STAGE_META,
  STAGES,
  updateLead,
  type LeadFilters,
  type LeadSummary,
  type Stage,
} from "../../lib/leads";
import LeadBoard from "../../Components/admin/leads/LeadBoard";
import LeadDrawer from "../../Components/admin/leads/LeadDrawer";
import LeadTable from "../../Components/admin/leads/LeadTable";
import styles from "../../Components/admin/leads/Leads.module.css";

type View = "board" | "table";
type Option = { _id: string; name?: string; title?: string };

const VIEW_KEY = "xaeon_leads_view";
const PAGE_SIZE = 25;
const BOARD_LIMIT = 500;

const QUICK: { key: string; label: string; apply: Partial<LeadFilters> }[] = [
  { key: "all", label: "All", apply: {} },
  { key: "overdue", label: "Overdue follow-ups", apply: { followUp: "overdue" } },
  { key: "week", label: "Due this week", apply: { followUp: "week" } },
  { key: "unassigned", label: "Unassigned", apply: { owner: "none", stage: "new,contacted,qualified,proposal" } },
  { key: "new", label: "New", apply: { stage: "new" } },
];

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "table" ? "table" : "board";
  } catch {
    return "board";
  }
}

export function Component() {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>(readView);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [employees, setEmployees] = useState<Option[]>([]);
  const [projectTypes, setProjectTypes] = useState<Option[]>([]);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [refreshKey, setRefreshKey] = useState(0);

  const filters: LeadFilters = useMemo(
    () => ({
      q: params.get("q") ?? undefined,
      stage: params.get("stage") ?? undefined,
      source: params.get("source") ?? undefined,
      owner: params.get("owner") ?? undefined,
      followUp: params.get("followUp") ?? undefined,
      sort: params.get("sort") ?? undefined,
    }),
    [params],
  );
  const page = Math.max(1, Number(params.get("page")) || 1);
  const openLeadId = params.get("lead");

  const setParam = useCallback(
    (changes: Record<string, string | null>, resetPage = true) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(changes)) {
          if (v) next.set(k, v);
          else next.delete(k);
        }
        if (resetPage) next.delete("page");
        return next;
      });
    },
    [setParams],
  );

  useEffect(() => {
    Promise.all([api.get("/employee"), api.get("/project-type")])
      .then(([e, p]) => {
        setEmployees(e.data?.employees ?? []);
        setProjectTypes(p.data?.projectTypes ?? []);
      })
      .catch((e) => setError(getApiErrorMessage(e, "Couldn't load employees or project types.")));
  }, []);

  // Debounced search box → URL.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if ((params.get("q") ?? "") !== search.trim()) setParam({ q: search.trim() || null });
    }, 300);
    return () => window.clearTimeout(id);
  }, [search, params, setParam]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const req = view === "board" ? fetchLeads(filters, 1, BOARD_LIMIT) : fetchLeads(filters, page, PAGE_SIZE);
    req
      .then((data) => {
        if (cancelled) return;
        setLeads(data.leads);
        setTotal(data.total);
        setPages(data.pages);
        setError(null);
      })
      .catch((e) => !cancelled && setError(getApiErrorMessage(e, "Couldn't load leads.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters, page, view, refreshKey]);

  useEffect(() => setSelected(new Set()), [filters, page, view]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(id);
  }, [notice]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const openLead = useCallback((id: string) => setParam({ lead: id }, false), [setParam]);
  const closeLead = useCallback(() => setParam({ lead: null }, false), [setParam]);

  const switchView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // Preference just won't persist.
    }
  };

  const moveLead = async (id: string, stage: Stage) => {
    const before = leads;
    setLeads((ls) => ls.map((l) => (l._id === id ? { ...l, stage } : l))); // optimistic
    try {
      await updateLead(id, { stage });
      setNotice(`Moved to ${STAGE_META[stage].label}`);
      refresh();
    } catch (e) {
      setLeads(before);
      setError(getApiErrorMessage(e, "Couldn't move the lead."));
    }
  };

  const applyBulk = async (changes: { stage?: Stage; ownerId?: string | null }) => {
    try {
      const n = await bulkUpdate([...selected], changes);
      setNotice(`Updated ${n} leads`);
      setSelected(new Set());
      refresh();
    } catch (e) {
      setError(getApiErrorMessage(e, "Bulk update failed."));
    }
  };

  const activeQuick =
    QUICK.find((q) => {
      const keys = ["stage", "owner", "followUp"] as const;
      return keys.every((k) => (q.apply[k] ?? undefined) === (filters[k] ?? undefined));
    })?.key ?? null;

  const boardTruncated = view === "board" && total > leads.length;

  return (
    <>
      <Helmet><title>Leads — Xaeon Admin</title></Helmet>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Leads</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div className={styles.viewToggle} role="group" aria-label="View">
            <button type="button" aria-pressed={view === "board"} onClick={() => switchView("board")}>
              <KanbanSquare size={15} /> Board
            </button>
            <button type="button" aria-pressed={view === "table"} onClick={() => switchView("table")}>
              <Rows3 size={15} /> Table
            </button>
          </div>
          <a className="admin-btn admin-btn-ghost" href={exportUrl(filters)} download>
            <Download size={15} /> Export CSV
          </a>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          className={`admin-input ${styles.search}`}
          type="search"
          placeholder="Search name, email, phone, company…"
          aria-label="Search leads"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="admin-select" aria-label="Stage" value={filters.stage ?? ""} onChange={(e) => setParam({ stage: e.target.value || null })}>
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
          <option value="new,contacted,qualified,proposal">Open (not won/lost)</option>
        </select>
        <select className="admin-select" aria-label="Source" value={filters.source ?? ""} onChange={(e) => setParam({ source: e.target.value || null })}>
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="admin-select" aria-label="Owner" value={filters.owner ?? ""} onChange={(e) => setParam({ owner: e.target.value || null })}>
          <option value="">Any owner</option>
          <option value="none">Unassigned</option>
          {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>
      </div>

      <div className={styles.quickFilters} role="group" aria-label="Quick filters">
        {QUICK.map((q) => (
          <button
            key={q.key}
            type="button"
            className={styles.chip}
            aria-pressed={activeQuick === q.key}
            onClick={() => setParam({ stage: q.apply.stage ?? null, owner: q.apply.owner ?? null, followUp: q.apply.followUp ?? null })}
          >
            {q.label}
          </button>
        ))}
        <span className={styles.chipCount} style={{ alignSelf: "center" }}>{total} {total === 1 ? "lead" : "leads"}</span>
      </div>

      {error ? <p className={`${styles.notice} ${styles.noticeError}`} role="alert">{error}</p> : null}
      {notice ? <p className={styles.notice} role="status" style={{ marginBottom: 12 }}>{notice}</p> : null}
      {boardTruncated ? (
        <p className={styles.rowSub} style={{ marginBottom: 10 }}>
          Showing the newest {leads.length} of {total}. Use filters or the table view to see the rest.
        </p>
      ) : null}

      {loading && leads.length === 0 ? (
        <div style={{ color: "#72c04f", padding: 32, textAlign: "center" }}>Loading…</div>
      ) : view === "board" ? (
        <LeadBoard leads={leads} onOpen={openLead} onMove={(id, stage) => void moveLead(id, stage)} />
      ) : (
        <>
          {selected.size ? (
            <div className={styles.bulkBar} role="region" aria-label="Bulk actions">
              <strong>{selected.size} selected</strong>
              <select className="admin-select" aria-label="Move selected to stage" defaultValue="" onChange={(e) => e.target.value && void applyBulk({ stage: e.target.value as Stage })}>
                <option value="" disabled>Move to stage…</option>
                {STAGES.map((s) => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
              </select>
              <select className="admin-select" aria-label="Assign selected" defaultValue="" onChange={(e) => e.target.value && void applyBulk({ ownerId: e.target.value === "none" ? null : e.target.value })}>
                <option value="" disabled>Assign to…</option>
                <option value="none">Unassign</option>
                {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          ) : null}
          <LeadTable
            leads={leads}
            selected={selected}
            onToggle={(id) => setSelected((s) => {
              const n = new Set(s);
              if (n.has(id)) n.delete(id);
              else n.add(id);
              return n;
            })}
            onToggleAll={(checked) => setSelected(checked ? new Set(leads.map((l) => l._id)) : new Set())}
            onOpen={openLead}
            sort={filters.sort ?? "-createdAt"}
            onSort={(sort) => setParam({ sort })}
          />
          <div className={styles.pager}>
            <span>Page {page} of {pages}</span>
            <span style={{ display: "flex", gap: 6 }}>
              <button type="button" className="admin-page-btn" disabled={page <= 1} onClick={() => setParam({ page: String(page - 1) }, false)}>Previous</button>
              <button type="button" className="admin-page-btn" disabled={page >= pages} onClick={() => setParam({ page: String(page + 1) }, false)}>Next</button>
            </span>
          </div>
        </>
      )}

      {openLeadId ? (
        <LeadDrawer leadId={openLeadId} employees={employees} projectTypes={projectTypes} onClose={closeLead} onChanged={refresh} />
      ) : null}
    </>
  );
}
