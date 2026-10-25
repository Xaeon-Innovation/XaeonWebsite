import api from "./api";
import { channelLabel, type Attribution } from "./attribution";

export type DashboardKpis = {
  users: number;
  employees: number;
  projects: number;
  pendingRequests: number;
};

export type DashboardServiceReq = {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
  attribution?: Attribution;
};

export type ChannelCount = { channel: string; leads: number; accepted: number };

export type DashboardProject = {
  _id: string;
  title: string;
  status_count: number;
  deadline: string;
};

export type DashboardLoaderData = {
  kpis: DashboardKpis;
  recentRequests: DashboardServiceReq[];
  recentProjects: DashboardProject[];
  /** Leads per acquisition channel over the last 30 days, most leads first. */
  channels: ChannelCount[];
  leadsLast30Days: number;
};

const CHANNEL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function countChannels(requests: DashboardServiceReq[]): { channels: ChannelCount[]; total: number } {
  const since = Date.now() - CHANNEL_WINDOW_MS;
  const byChannel = new Map<string, ChannelCount>();
  let total = 0;
  for (const r of requests) {
    if (new Date(r.createdAt).getTime() < since) continue;
    total += 1;
    const channel = r.attribution ? channelLabel(r.attribution) : "Not tracked";
    const row = byChannel.get(channel) ?? { channel, leads: 0, accepted: 0 };
    row.leads += 1;
    if (r.status === "Accepted") row.accepted += 1;
    byChannel.set(channel, row);
  }
  return { channels: [...byChannel.values()].sort((a, b) => b.leads - a.leads), total };
}

const EMPTY_DASHBOARD_DATA: DashboardLoaderData = {
  kpis: { users: 0, employees: 0, projects: 0, pendingRequests: 0 },
  recentRequests: [],
  recentProjects: [],
  channels: [],
  leadsLast30Days: 0,
};

export async function dashboardLoader(): Promise<DashboardLoaderData> {
  try {
    const [usersRes, empRes, projRes, reqRes] = await Promise.all([
      api.get("/user"),
      api.get("/employee"),
      api.get("/project"),
      api.get("/system-request"),
    ]);

    const users = usersRes.data?.users ?? [];
    const employees = empRes.data?.employees ?? [];
    const projects = projRes.data?.projects ?? [];
    const requests = reqRes.data?.serviceRequests ?? [];
    const { channels, total: leadsLast30Days } = countChannels(requests);

    return {
      kpis: {
        users: users.length,
        employees: employees.length,
        projects: projects.length,
        pendingRequests: requests.filter((request: DashboardServiceReq) => request.status === "Pending Review").length,
      },
      recentRequests: [...requests]
        .sort((a: DashboardServiceReq, b: DashboardServiceReq) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
      recentProjects: [...projects]
        .sort((a: DashboardProject, b: DashboardProject) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime())
        .slice(0, 5),
      channels,
      leadsLast30Days,
    };
  } catch {
    return EMPTY_DASHBOARD_DATA;
  }
}

export type ServiceRequestLoaderRow = {
  _id: string;
  title: string;
  description?: string;
  status: string;
  meeting_date?: string;
  user?: string;
  package?: string;
  createdAt: string;
  source?: string;
  interest?: string;
  contactEmail?: string;
  contactName?: string;
  contactPhone?: string;
  company?: string;
};

export type ServiceRequestsLoaderData = {
  serviceRequests: ServiceRequestLoaderRow[];
};

export async function serviceRequestsLoader(): Promise<ServiceRequestsLoaderData> {
  try {
    const res = await api.get("/system-request");
    const serviceRequests = res.data?.serviceRequests;
    return {
      serviceRequests: Array.isArray(serviceRequests) ? serviceRequests : [],
    };
  } catch {
    return { serviceRequests: [] };
  }
}
