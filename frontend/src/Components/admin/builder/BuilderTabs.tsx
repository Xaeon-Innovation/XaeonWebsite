import { NavLink } from "react-router";

const TABS = [
  { to: "/admin/builder-orders", label: "Orders" },
  { to: "/admin/builder-templates", label: "Templates" },
  { to: "/admin/builder-addons", label: "Add-ons" },
  { to: "/admin/builder-plans", label: "Plans" },
  { to: "/admin/site-stars", label: "Galaxy of stars" },
];

/** Sub-navigation shared by the Website Builder admin pages. */
export default function BuilderTabs() {
  return (
    <nav aria-label="Website Builder" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => `admin-btn ${isActive ? "admin-btn-primary" : "admin-btn-ghost"}`}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
