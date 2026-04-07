import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Users, UserCog, FolderKanban, MessageSquareText } from "lucide-react";

import api from "../../lib/api";
import KpiCard from "../../Components/admin/KpiCard";
import StatusBadge from "../../Components/admin/StatusBadge";

type Kpis = {
  users: number;
  employees: number;
  projects: number;
  pendingRequests: number;
};

type ServiceReq = {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
};

type Project = {
  _id: string;
  title: string;
  status_count: number;
  deadline: string;
};

export function Component() {
  const [kpis, setKpis] = useState<Kpis>({ users: 0, employees: 0, projects: 0, pendingRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [recentRequests, setRecentRequests] = useState<ServiceReq[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/user"),
      api.get("/employee"),
      api.get("/project"),
      api.get("/system-request"),
    ])
      .then(([usersRes, empRes, projRes, reqRes]) => {
        const users = usersRes.data?.users ?? [];
        const employees = empRes.data?.employees ?? [];
        const projects = projRes.data?.projects ?? [];
        const requests = reqRes.data?.serviceRequests ?? [];

        setKpis({
          users: users.length,
          employees: employees.length,
          projects: projects.length,
          pendingRequests: requests.filter((r: ServiceReq) => r.status === "Pending Review").length,
        });

        setRecentRequests(
          [...requests]
            .sort((a: ServiceReq, b: ServiceReq) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5),
        );

        setRecentProjects(
          [...projects]
            .sort((a: Project, b: Project) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime())
            .slice(0, 5),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>Dashboard — Xaeon Admin</title>
      </Helmet>

      <div className="admin-page-header">
        <h2 className="admin-page-title">Overview</h2>
      </div>

      <div className="admin-kpi-grid">
        <KpiCard icon={<Users size={20} />} label="Total Users" value={kpis.users} loading={loading} />
        <KpiCard icon={<UserCog size={20} />} label="Employees" value={kpis.employees} loading={loading} />
        <KpiCard icon={<FolderKanban size={20} />} label="Projects" value={kpis.projects} loading={loading} />
        <KpiCard icon={<MessageSquareText size={20} />} label="Pending Requests" value={kpis.pendingRequests} loading={loading} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div className="admin-section">
          <h3 className="admin-section-title">Recent Service Requests</h3>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Title</th>
                  <th className="admin-th">Status</th>
                  <th className="admin-th">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.length === 0 ? (
                  <tr><td className="admin-td-empty" colSpan={3}>No requests</td></tr>
                ) : (
                  recentRequests.map((r) => (
                    <tr key={r._id}>
                      <td className="admin-td">{r.title}</td>
                      <td className="admin-td"><StatusBadge status={r.status} /></td>
                      <td className="admin-td">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h3 className="admin-section-title">Recent Projects</h3>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Title</th>
                  <th className="admin-th">Stage</th>
                  <th className="admin-th">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.length === 0 ? (
                  <tr><td className="admin-td-empty" colSpan={3}>No projects</td></tr>
                ) : (
                  recentProjects.map((p) => (
                    <tr key={p._id}>
                      <td className="admin-td">{p.title}</td>
                      <td className="admin-td"><span className="admin-badge admin-badge-blue">Stage {p.status_count}</span></td>
                      <td className="admin-td">{new Date(p.deadline).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
