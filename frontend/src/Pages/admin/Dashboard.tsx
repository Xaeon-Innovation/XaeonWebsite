import { useLoaderData } from "react-router";
import { Helmet } from "react-helmet-async";
import { Users, UserCog, FolderKanban, MessageSquareText } from "lucide-react";

import KpiCard from "../../Components/admin/KpiCard";
import StatusBadge from "../../Components/admin/StatusBadge";
import { type DashboardLoaderData } from "../../lib/adminLoaders";

export function Component() {
  const { kpis, recentRequests, recentProjects } = useLoaderData<DashboardLoaderData>();
  const loading = false;

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
