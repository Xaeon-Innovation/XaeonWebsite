import { useEffect, useState } from "react";
import { Link, useLoaderData } from "react-router";
import { Helmet } from "react-helmet-async";
import { AlertTriangle } from "lucide-react";

import WeeklyLeadsChart from "../../Components/admin/dashboard/WeeklyLeadsChart";
import styles from "../../Components/admin/dashboard/Dashboard.module.css";
import { fetchLeadStats, type DashboardLoaderData, type LeadStats } from "../../lib/adminLoaders";
import { formatMoney, SOURCE_LABELS, STAGE_META, STAGES } from "../../lib/leads";

const RANGES = [30, 90, 365] as const;

function pct(n: number | null): string {
  return n === null ? "—" : `${Math.round(n * 100)}%`;
}

function hours(h: number | null): string {
  if (h === null) return "—";
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) return `${Math.round(h)} h`;
  return `${Math.round(h / 24)} days`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** One line per currency; amounts are never summed across currencies or broken mid-number. */
function Money({ map }: { map: Record<string, number> }) {
  const entries = Object.entries(map).filter(([, v]) => v > 0);
  if (!entries.length) return <>—</>;
  return (
    <>
      {entries.map(([cur, v]) => (
        <span key={cur} style={{ display: "block", whiteSpace: "nowrap", fontSize: entries.length > 1 ? "1.125rem" : undefined }}>
          {formatMoney(v, cur)}
        </span>
      ))}
    </>
  );
}

export function Component() {
  const initial = useLoaderData<DashboardLoaderData>();
  const [days, setDays] = useState<number>(90);
  const [stats, setStats] = useState<LeadStats | null>(initial.stats);
  const [error, setError] = useState<string | null>(initial.error);

  useEffect(() => {
    if (days === 90 && stats?.days === 90) return;
    let cancelled = false;
    fetchLeadStats(days)
      .then((s) => !cancelled && (setStats(s), setError(null)))
      .catch(() => !cancelled && setError("Couldn't load lead statistics."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const stageMax = stats ? Math.max(1, ...STAGES.map((s) => stats.byStage[s])) : 1;

  return (
    <>
      <Helmet><title>Dashboard — Xaeon Admin</title></Helmet>
      <div className={styles.toolbar}>
        <h2 className="admin-page-title" style={{ margin: 0 }}>Overview</h2>
        <div className={styles.range} role="group" aria-label="Period">
          {RANGES.map((r) => (
            <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}>
              {r === 365 ? "12 months" : `${r} days`}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="admin-field-error" role="alert">{error}</p> : null}

      <div className={styles.tiles}>
        <div className={styles.tile}>
          <span className={styles.tileLabel}>New leads</span>
          <span className={styles.tileValue}>{stats?.total ?? "—"}</span>
          <span className={styles.tileHint}>last {days === 365 ? "12 months" : `${days} days`}</span>
        </div>
        <div className={styles.tile}>
          <span className={styles.tileLabel}>Win rate</span>
          <span className={styles.tileValue}>{pct(stats?.winRate ?? null)}</span>
          <span className={styles.tileHint}>{stats ? `${stats.byStage.won} won · ${stats.byStage.lost} lost` : ""}</span>
        </div>
        <div className={styles.tile}>
          <span className={styles.tileLabel}>Open pipeline</span>
          <span className={styles.tileValue}>{stats ? <Money map={stats.pipelineValue} /> : "—"}</span>
          <span className={styles.tileHint}>deal value of open leads</span>
        </div>
        <div className={styles.tile}>
          <span className={styles.tileLabel}>Median first reply</span>
          <span className={styles.tileValue}>{hours(stats?.medianFirstResponseHours ?? null)}</span>
          <span className={styles.tileHint}>{stats?.respondedWithin24h != null ? `${pct(stats.respondedWithin24h)} answered within 24 h` : ""}</span>
        </div>
        <Link to="/admin/leads?followUp=overdue" className={`${styles.tile} ${stats?.overdueFollowUps ? styles.tileWarn : ""}`}>
          <span className={`${styles.tileLabel} ${styles.tileWarnLabel}`}>
            {stats?.overdueFollowUps ? <AlertTriangle size={13} aria-hidden color="#fcd34d" /> : null}
            Overdue follow-ups
          </span>
          <span className={styles.tileValue}>{stats?.overdueFollowUps ?? "—"}</span>
          <span className={styles.tileHint}>open leads past their follow-up date</span>
        </Link>
        <Link to="/admin/leads?owner=none&stage=new,contacted,qualified,proposal" className={styles.tile}>
          <span className={styles.tileLabel}>Unassigned</span>
          <span className={styles.tileValue}>{stats?.unassignedOpen ?? "—"}</span>
          <span className={styles.tileHint}>open leads without an owner</span>
        </Link>
      </div>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="weekly-title">
          <h3 id="weekly-title" className={styles.panelTitle}>Leads per week</h3>
          <p className={styles.panelSub}>Every enquiry, booking and demo request. Hover a week for details.</p>
          {stats ? <WeeklyLeadsChart weeks={stats.weekly} /> : <p className={styles.panelSub}>No data</p>}
        </section>
        <section className={styles.panel} aria-labelledby="stage-title">
          <h3 id="stage-title" className={styles.panelTitle}>Where leads are now</h3>
          <p className={styles.panelSub}>Leads from this period, by pipeline stage</p>
          <ol className={styles.stageList}>
            {STAGES.map((s) => (
              <li key={s} className={styles.stageRow}>
                <Link to={`/admin/leads?stage=${s}`} className={styles.stageName}>{STAGE_META[s].label}</Link>
                <span className={styles.stageTrack} aria-hidden>
                  <span className={styles.stageFill} style={{ display: "block", width: `${((stats?.byStage[s] ?? 0) / stageMax) * 100}%` }} />
                </span>
                <span className={styles.stageCount}>{stats?.byStage[s] ?? 0}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className={styles.grid}>
        <section className={styles.panel} aria-labelledby="channels-title">
          <h3 id="channels-title" className={styles.panelTitle}>Where leads come from</h3>
          <p className={styles.panelSub}>Channel is the visitor's first visit (campaign link, ad click or referring site)</p>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Channel</th>
                  <th className="admin-th">Leads</th>
                  <th className="admin-th">Won</th>
                  <th className="admin-th">Win share</th>
                </tr>
              </thead>
              <tbody>
                {!stats?.channels.length ? (
                  <tr><td className="admin-td-empty" colSpan={4}>No leads in this period</td></tr>
                ) : (
                  stats.channels.map((c) => (
                    <tr key={c.channel}>
                      <td className="admin-td">{c.channel}</td>
                      <td className={`admin-td ${styles.num}`}>{c.leads}</td>
                      <td className={`admin-td ${styles.num}`}>{c.won}</td>
                      <td className={`admin-td ${styles.num}`}>{pct(c.leads ? c.won / c.leads : null)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {stats?.sources.length ? (
            <p className={styles.panelSub} style={{ marginTop: 12, marginBottom: 0 }}>
              By form: {stats.sources.map((s) => `${SOURCE_LABELS[s.source] ?? s.source} ${s.leads}`).join(" · ")}
            </p>
          ) : null}
        </section>

        <section className={styles.panel} aria-labelledby="recent-title">
          <h3 id="recent-title" className={styles.panelTitle}>Latest leads</h3>
          <p className={styles.panelSub}>
            <Link to="/admin/leads" style={{ color: "#a7e08b" }}>Open the pipeline</Link>
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {initial.recentLeads.length === 0 ? <li className={styles.panelSub}>No leads yet</li> : null}
            {initial.recentLeads.map((l) => (
              <li key={l._id}>
                <Link to={`/admin/leads?lead=${l._id}`} style={{ color: "#f4f4f5", fontWeight: 600, fontSize: "0.875rem" }}>
                  {l.contactName || l.title}
                </Link>
                <div className={styles.tileHint}>
                  {[STAGE_META[l.stage]?.label, SOURCE_LABELS[l.source] ?? l.source, new Date(l.createdAt).toLocaleDateString()].join(" · ")}
                </div>
              </li>
            ))}
          </ul>
          <p className={styles.panelSub} style={{ marginTop: 16, marginBottom: 0 }}>
            {plural(initial.counts.projects, "project")} · {plural(initial.counts.users, "user")} · {plural(initial.counts.employees, "employee")}
          </p>
        </section>
      </div>
    </>
  );
}
