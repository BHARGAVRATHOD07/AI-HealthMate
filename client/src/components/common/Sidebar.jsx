import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  FileText,
  Pill,
  Activity,
  Bot,
  Bell,
  Settings,
  LogOut,
  X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/profile", label: "My Profile", icon: User },
  { path: "/records", label: "Health Records", icon: FileText },
  { path: "/medications", label: "Medications", icon: Pill },
  { path: "/monitoring", label: "Health Monitoring", icon: Activity },
  { path: "/assistant", label: "AI Assistant", icon: Bot, badge: "AI" },
  { path: "/reminders", label: "Reminders", icon: Bell },
  { path: "/settings", label: "Settings", icon: Settings }
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)"
          }}
          className="lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        style={{
          width: "260px",
          backgroundColor: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 45,
          transition: "transform 0.25s ease",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)"
        }}
        className="sidebar-container lg:translate-x-0"
      >
        {/* Top Header */}
        <div>
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "0.6rem",
                  background: "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 10px rgba(2, 132, 199, 0.25)"
                }}
              >
                <Activity size={20} />
              </div>
              <span style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                AI Health<span style={{ color: "#0284c7" }}>Mate</span>
              </span>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "0.25rem",
                display: "flex"
              }}
              className="lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav style={{ padding: "1.25rem 0.85rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.7rem 0.9rem",
                    borderRadius: "0.75rem",
                    fontSize: "0.9rem",
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? "#0284c7" : "var(--text-muted)",
                    backgroundColor: isActive ? "rgba(2, 132, 199, 0.12)" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s ease"
                  })}
                  className="sidebar-link hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: "800",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "9999px",
                        backgroundColor: "#0d9488",
                        color: "#ffffff"
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer User Profile & Logout */}
        <div style={{ padding: "1rem 0.85rem", borderTop: "1px solid var(--border-color)" }}>
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--bg-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.65rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "0.95rem"
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-main)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {user?.name || "Alex Johnson"}
                </div>
                <div style={{ fontSize: "0.725rem", color: "var(--text-subtle)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {user?.email || "alex@example.com"}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "0.65rem 0.9rem",
              borderRadius: "0.75rem",
              border: "1px solid var(--border-color)",
              backgroundColor: "transparent",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            className="hover:bg-red-50 dark:hover:bg-red-950"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <style>{`
        @media (min-width: 1024px) {
          .lg\\:translate-x-0 { transform: translateX(0) !important; }
          .lg\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
