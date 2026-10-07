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
          background: "linear-gradient(180deg, var(--bg-sidebar), var(--bg-card-alt))",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 45,
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          boxShadow: "2px 0 20px rgba(15, 23, 42, 0.04)"
        }}
        className="sidebar-container lg:translate-x-0"
      >
        <div>
          <div
            style={{
              padding: "1.4rem 1.5rem",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(180deg, rgba(22, 163, 74, 0.03), transparent)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "0.8rem",
                  background: "linear-gradient(135deg, #16A34A 0%, #059669 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 20px rgba(22, 163, 74, 0.25)"
                }}
              >
                <Activity size={21} />
              </div>
              <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                AI Health<span style={{ color: "#16A34A" }}>Mate</span>
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

          <nav style={{ padding: "1.1rem 0.8rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
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
                    padding: "0.8rem 0.9rem",
                    borderRadius: "0.9rem",
                    fontSize: "0.9rem",
                    fontWeight: isActive ? "700" : "600",
                    color: isActive ? "#16A34A" : "var(--text-muted)",
                    background: isActive ? "linear-gradient(90deg, rgba(22, 163, 74,0.12), rgba(5, 150, 105,0.06))" : "transparent",
                    textDecoration: "none",
                    border: isActive ? "1px solid rgba(22, 163, 74, 0.14)" : "1px solid transparent",
                    transition: "all 0.18s ease"
                  })}
                  className="sidebar-link"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "0.7rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(22, 163, 74, 0.08)",
                        color: "inherit"
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: "800",
                        padding: "0.18rem 0.45rem",
                        borderRadius: "9999px",
                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
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

        <div style={{ padding: "1rem 0.85rem", borderTop: "1px solid var(--border-color)" }}>
          <div
            style={{
              padding: "0.8rem 0.85rem",
              borderRadius: "1rem",
              background: "linear-gradient(180deg, rgba(22, 163, 74, 0.05), rgba(5, 150, 105, 0.03))",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #16A34A 0%, #059669 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  boxShadow: "0 8px 18px rgba(22, 163, 74, 0.22)"
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "P"}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "0.84rem", fontWeight: "700", color: "var(--text-main)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {user?.name || "Patient"}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {user?.email || "Signed in"}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "0.72rem 0.9rem",
              borderRadius: "0.9rem",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              backgroundColor: "rgba(239, 68, 68, 0.04)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontSize: "0.85rem",
              fontWeight: "700",
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
