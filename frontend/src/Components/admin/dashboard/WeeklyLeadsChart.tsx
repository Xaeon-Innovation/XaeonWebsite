import { useState } from "react";
import styles from "./Dashboard.module.css";

type Week = { weekStart: string; leads: number; won: number };

const fmtWeek = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });

/** Leads per week; the darker base of each column is the part already won. */
export default function WeeklyLeadsChart({ weeks }: { weeks: Week[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...weeks.map((w) => w.leads));
  // A "nice" top value so gridlines land on whole numbers.
  const step = max <= 4 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : Math.ceil(max / 5 / 10) * 10;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step);

  return (
    <figure style={{ margin: 0 }}>
      <div className={styles.chart}>
        <div className={styles.yAxis} aria-hidden>
          {ticks.map((t) => (
            <span key={t} style={{ bottom: `${(t / top) * 100}%` }}>{t}</span>
          ))}
        </div>
        <div className={styles.plot} onMouseLeave={() => setActive(null)}>
          {ticks.slice(1).map((t) => (
            <span key={t} className={styles.gridLine} style={{ bottom: `${(t / top) * 100}%` }} aria-hidden />
          ))}
          {weeks.map((w, i) => (
            <div
              key={w.weekStart}
              className={styles.col}
              tabIndex={0}
              role="img"
              aria-label={`Week of ${fmtWeek(w.weekStart)}: ${w.leads} leads, ${w.won} won`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              {w.leads > 0 ? <span className={styles.bar} style={{ height: `${(w.leads / top) * 100}%` }} /> : null}
              {w.won > 0 ? <span className={styles.barWon} style={{ height: `${(w.won / top) * 100}%` }} /> : null}
              {active === i ? (
                <span className={styles.tooltip} role="presentation">
                  Week of {fmtWeek(w.weekStart)} · <strong>{w.leads}</strong> {w.leads === 1 ? "lead" : "leads"}{w.won ? `, ${w.won} won` : ""}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.xAxis} aria-hidden>
        <span>{weeks[0] ? fmtWeek(weeks[0].weekStart) : ""}</span>
        <span>{weeks.length > 2 ? fmtWeek(weeks[Math.floor(weeks.length / 2)].weekStart) : ""}</span>
        <span>{weeks.length > 1 ? fmtWeek(weeks[weeks.length - 1].weekStart) : ""}</span>
      </div>
      <figcaption className={styles.legend}>
        <span><span className={styles.swatch} style={{ background: "#72c04f" }} aria-hidden />All leads</span>
        <span><span className={styles.swatch} style={{ background: "#3d7a26" }} aria-hidden />Won</span>
      </figcaption>
      {/* Table view of the same numbers for screen readers. */}
      <table className={styles.sr}>
        <caption>Leads per week</caption>
        <thead><tr><th>Week of</th><th>Leads</th><th>Won</th></tr></thead>
        <tbody>
          {weeks.map((w) => <tr key={w.weekStart}><td>{fmtWeek(w.weekStart)}</td><td>{w.leads}</td><td>{w.won}</td></tr>)}
        </tbody>
      </table>
    </figure>
  );
}
