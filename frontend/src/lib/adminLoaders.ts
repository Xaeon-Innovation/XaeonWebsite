import api from "./api";

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
};

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
};

const EMPTY_DASHBOARD_DATA: DashboardLoaderData = {
  kpis: { users: 0, employees: 0, projects: 0, pendingRequests: 0 },
  recentRequests: [],
  recentProjects: [],
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
