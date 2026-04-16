import api from "./api";

export type ClientServiceRequestRow = {
  _id: string;
  title: string;
  description?: string;
  status: string;
  meeting_date?: string;
  interest?: string;
  createdAt: string;
  package?: { _id: string; title?: string; discount?: number };
};

export type ClientProjectRow = {
  _id: string;
  title: string;
  description?: string;
  status_count: number;
  deadline: string;
  project_type?: { title?: string; stages?: string[] };
  project_manager?: { name?: string };
};

export type ClientDashboardLoaderData = {
  serviceRequests: ClientServiceRequestRow[];
  projects: ClientProjectRow[];
};

const empty: ClientDashboardLoaderData = {
  serviceRequests: [],
  projects: [],
};

export async function clientDashboardLoader(): Promise<ClientDashboardLoaderData> {
  try {
    const [reqRes, projRes] = await Promise.all([
      api.get("/system-request/mine"),
      api.get("/project"),
    ]);
    const serviceRequests = reqRes.data?.serviceRequests;
    const projects = projRes.data?.projects;
    return {
      serviceRequests: Array.isArray(serviceRequests) ? serviceRequests : [],
      projects: Array.isArray(projects) ? projects : [],
    };
  } catch {
    return empty;
  }
}
