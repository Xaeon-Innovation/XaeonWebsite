import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Users,
  UserCog,
  FolderKanban,
  Layers3,
  Package,
  FileText,
  MessageSquareText,
  PanelLeftClose,
  PanelLeft,
  UsersRound,
  Images,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/employees", label: "Employees", icon: UserCog },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/project-types", label: "Project Types", icon: Layers3 },
  { to: "/admin/packages", label: "Packages", icon: Package },
  { to: "/admin/blog-posts", label: "Blog Posts", icon: FileText },
  { to: "/admin/site-team", label: "Site — Team", icon: UsersRound },
  { to: "/admin/site-case-studies", label: "Site — Case studies", icon: Images },
  { to: "/admin/service-requests", label: "Requests", icon: MessageSquareText },
] as const;

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function AdminSidebar({ collapsed, onToggle }: Props) {
  return (
    <aside className={`admin-sidebar ${collapsed ? "admin-sidebar-collapsed" : ""}`}>
      <div className="admin-sidebar-top">
        <div className="admin-sidebar-brand">
          {!collapsed && <span className="admin-sidebar-logo">XAEON</span>}
          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon, ...rest }) => (
          <NavLink
            key={to}
            to={to}
            end={"end" in rest ? rest.end : false}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "admin-nav-active" : ""}`
            }
          >
            <Icon size={20} className="admin-nav-icon" />
            {!collapsed && <span className="admin-nav-label">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
