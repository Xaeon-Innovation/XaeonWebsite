import api from "./api";
import type { LeadSummary, Stage } from "./leads";

export type LeadStats = {
  days: number;
  since: string;
  total: number;
  byStage: Record<Stage, number>;
  winRate: number | null;
  pipelineValue: Record<string, number>;
  wonValue: Record<string, number>;
  medianFirstResponseHours: number | null;
  respondedWithin24h: number | null;
  overdueFollowUps: number;
  unassignedOpen: number;
  channels: { channel: string; leads: number; won: number }[];
  sources: { source: string; leads: number; won: number }[];
  weekly: { weekStart: string; leads: number; won: number }[];
};

export type DashboardLoaderData = {
  stats: LeadStats | null;
  recentLeads: LeadSummary[];
  counts: { users: number; employees: number; projects: number };
  error: string | null;
};

export async function fetchLeadStats(days: number): Promise<LeadStats> {
  const res = await api.get<LeadStats>("/lead/stats", { params: { days } });
  return res.data;
}

export async function dashboardLoader(): Promise<DashboardLoaderData> {
  const [stats, leads, projects, users, employees] = await Promise.allSettled([
    fetchLeadStats(90),
    api.get("/lead", { params: { limit: 6, sort: "-createdAt" } }),
    api.get("/project"),
    api.get("/user"),
    api.get("/employee"),
  ]);
  const value = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === "fulfilled" ? r.value : null);
  const projectList: unknown[] = value(projects)?.data?.projects ?? [];
  return {
    stats: value(stats),
    recentLeads: value(leads)?.data?.leads ?? [],
    counts: {
      users: value(users)?.data?.users?.length ?? 0,
      employees: value(employees)?.data?.employees?.length ?? 0,
      projects: projectList.length,
    },
    error: stats.status === "rejected" ? "Couldn't load lead statistics." : null,
  };
}
