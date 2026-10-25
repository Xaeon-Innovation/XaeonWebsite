import ServiceRequest, { LEAD_STAGES, type LeadStage, OPEN_STAGES } from "../models/serviceRequest.model";
import { attributionChannel, type Attribution } from "./attribution";

type Row = {
  createdAt: Date;
  stage?: LeadStage;
  source: string;
  value?: number | null;
  currency?: string;
  firstResponseAt?: Date;
  attribution?: Attribution;
};

export type LeadStats = {
  days: number;
  since: string;
  total: number;
  byStage: Record<LeadStage, number>;
  /** won / (won + lost) for leads created in the period; null when nothing has closed. */
  winRate: number | null;
  /** Open-stage deal value (all time), per currency. */
  pipelineValue: Record<string, number>;
  /** Won deal value for leads created in the period, per currency. */
  wonValue: Record<string, number>;
  /** Median hours from lead creation to first reply / stage change; null without data. */
  medianFirstResponseHours: number | null;
  /** Share of period leads that got a first response within 24h. */
  respondedWithin24h: number | null;
  overdueFollowUps: number;
  unassignedOpen: number;
  channels: { channel: string; leads: number; won: number }[];
  sources: { source: string; leads: number; won: number }[];
  /** Leads per week (week starting Monday, Cairo time), oldest first, gaps filled with 0. */
  weekly: { weekStart: string; leads: number; won: number }[];
};

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function weekStart(d: Date): string {
  // Cairo calendar date, then back to Monday.
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const [y, m, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, day));
  utc.setUTCDate(utc.getUTCDate() - ((utc.getUTCDay() + 6) % 7));
  return utc.toISOString().slice(0, 10);
}

function addTo(map: Record<string, number>, key: string, amount: number): void {
  map[key] = (map[key] ?? 0) + amount;
}

export async function computeLeadStats(days: number): Promise<LeadStats> {
  const now = new Date();
  const since = new Date(now.getTime() - days * 86_400_000);

  const [rows, openWithValue, overdueFollowUps, unassignedOpen] = await Promise.all([
    ServiceRequest.find({ createdAt: { $gte: since } })
      .select("createdAt stage source value currency firstResponseAt attribution")
      .lean<Row[]>(),
    ServiceRequest.find({ stage: { $in: OPEN_STAGES }, value: { $gt: 0 } }).select("value currency").lean<Row[]>(),
    ServiceRequest.countDocuments({ stage: { $in: OPEN_STAGES }, followUpAt: { $lt: now } }),
    ServiceRequest.countDocuments({ stage: { $in: OPEN_STAGES }, owner: { $exists: false } }),
  ]);

  const byStage = Object.fromEntries(LEAD_STAGES.map((s) => [s, 0])) as Record<LeadStage, number>;
  const channels = new Map<string, { channel: string; leads: number; won: number }>();
  const sources = new Map<string, { source: string; leads: number; won: number }>();
  const weekly = new Map<string, { weekStart: string; leads: number; won: number }>();
  const wonValue: Record<string, number> = {};
  const responseHours: number[] = [];
  let within24 = 0;

  for (const r of rows) {
    const stage = r.stage ?? "new";
    const won = stage === "won" ? 1 : 0;
    byStage[stage] += 1;

    const channel = r.attribution ? attributionChannel(r.attribution) : "Not tracked";
    const c = channels.get(channel) ?? { channel, leads: 0, won: 0 };
    c.leads += 1;
    c.won += won;
    channels.set(channel, c);

    const s = sources.get(r.source) ?? { source: r.source, leads: 0, won: 0 };
    s.leads += 1;
    s.won += won;
    sources.set(r.source, s);

    const wk = weekStart(new Date(r.createdAt));
    const w = weekly.get(wk) ?? { weekStart: wk, leads: 0, won: 0 };
    w.leads += 1;
    w.won += won;
    weekly.set(wk, w);

    if (won && r.value) addTo(wonValue, r.currency ?? "EGP", r.value);
    if (r.firstResponseAt) {
      const hours = (new Date(r.firstResponseAt).getTime() - new Date(r.createdAt).getTime()) / 3_600_000;
      if (hours >= 0) {
        responseHours.push(hours);
        if (hours <= 24) within24 += 1;
      }
    }
  }

  // Fill empty weeks so the chart has an honest, continuous x-axis.
  const filled: LeadStats["weekly"] = [];
  for (let d = new Date(`${weekStart(since)}T00:00:00Z`); d <= now; d.setUTCDate(d.getUTCDate() + 7)) {
    const key = d.toISOString().slice(0, 10);
    filled.push(weekly.get(key) ?? { weekStart: key, leads: 0, won: 0 });
  }

  const pipelineValue: Record<string, number> = {};
  for (const r of openWithValue) addTo(pipelineValue, r.currency ?? "EGP", r.value ?? 0);

  const closed = byStage.won + byStage.lost;
  const medianHours = median(responseHours);
  return {
    days,
    since: since.toISOString(),
    total: rows.length,
    byStage,
    winRate: closed ? byStage.won / closed : null,
    pipelineValue,
    wonValue,
    medianFirstResponseHours: medianHours === null ? null : Math.round(medianHours * 10) / 10,
    respondedWithin24h: rows.length ? within24 / rows.length : null,
    overdueFollowUps,
    unassignedOpen,
    channels: [...channels.values()].sort((a, b) => b.leads - a.leads),
    sources: [...sources.values()].sort((a, b) => b.leads - a.leads),
    weekly: filled,
  };
}
