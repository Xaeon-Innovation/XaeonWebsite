import { Suspense, useState } from "react";
import { Outlet } from "react-router";
import { LogOut } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { HelmetProvider } from "react-helmet-async";

import RequireAdmin from "../context/RequireAdmin";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../Components/admin/AdminSidebar";
import styles from "./AdminLayout.module.css";

function AdminShell() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <HelmetProvider>
      <Helmet>
        <title>Admin — Xaeon</title>
      </Helmet>

      <div className={`${styles.layout} ${collapsed ? styles.layoutCollapsed : ""}`}>
        <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

        <div className={styles.main}>
          <header className={styles.topbar}>
            <h1 className={styles.pageTitle}>Admin Dashboard</h1>
            <div className={styles.topbarRight}>
              <span className={styles.userName}>{user?.name}</span>
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={() => logout()}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </header>

          <div className={styles.content}>
            <Suspense
              fallback={
                <div className={styles.loading}>Loading…</div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>
    </HelmetProvider>
  );
}

export function Component() {
  return (
    <RequireAdmin>
      <AdminShell />
    </RequireAdmin>
  );
}
