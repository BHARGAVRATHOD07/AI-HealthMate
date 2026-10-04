import { useState } from "react";
import { Search, Bell, Sun, Moon, Menu, Shield } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const initialNotifications = [
  { id: 1, title: "Medication Due", desc: "Take Vitamin D3 (2000 IU) with breakfast", time: "10m ago", read: false },
  { id: 2, title: "Blood Pressure Recorded", desc: "118/78 mmHg saved to your profile", time: "1h ago", read: false },
  { id: 3, title: "AI Health Assistant Ready", desc: "Ask questions about your recent lab report", time: "3h ago", read: true }
];

const Topbar = ({ onOpenMobileSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/records?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "var(--bg-topbar)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-color)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem"
      }}
    >
      {/* Left: Mobile Menu & Search */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, maxWidth: "420px" }}>
        <button
          onClick={onOpenMobileSidebar}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-main)",
            cursor: "pointer",
            padding: "0.4rem",
            display: "flex",
            alignItems: "center"
          }}
          className="lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>

        <form onSubmit={handleSearchSubmit} style={{ position: "relative", width: "100%" }}>
          <Search
            size={17}
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-subtle)",
              pointerEvents: "none"
            }}
          />
          <input
            type="text"
            placeholder="Search health records, medications, logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.9rem 0.5rem 2.5rem",
              fontSize: "0.85rem",
              borderRadius: "9999px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-main)",
              color: "var(--text-main)",
              outline: "none"
            }}
          />
        </form>
      </div>

      {/* Right: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        {/* Patient Badge */}
        <div
          style={{
            display: "none",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.75rem",
            fontWeight: "700",
            color: "#0d9488",
            backgroundColor: "rgba(13, 148, 136, 0.12)",
            padding: "0.3rem 0.65rem",
            borderRadius: "9999px"
          }}
          className="md:flex"
        >
          <Shield size={13} /> Patient Portal
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "0.6rem",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-card)",
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#0284c7" />}
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "0.6rem",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative"
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444"
                }}
              />
            )}
          </button>

          {/* Notifications Dropdown Modal */}
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "48px",
                width: "320px",
                backgroundColor: "var(--bg-card)",
                borderRadius: "1rem",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-lg)",
                overflow: "hidden",
                zIndex: 100
              }}
              className="animate-modal"
            >
              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-main)" }}>
                  Notifications ({unreadCount})
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "0.75rem",
                      color: "#0284c7",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid var(--border-color)",
                      backgroundColor: item.read ? "transparent" : "rgba(2, 132, 199, 0.05)"
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      {item.desc}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-subtle)", marginTop: "0.3rem" }}>
                      {item.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div
          onClick={() => navigate("/profile")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            cursor: "pointer",
            padding: "0.25rem 0.5rem",
            borderRadius: "0.6rem"
          }}
          className="hover:bg-slate-100 dark:hover:bg-slate-800"
        >
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
              fontSize: "0.95rem",
              boxShadow: "0 2px 6px rgba(2, 132, 199, 0.3)"
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div style={{ display: "none" }} className="md:block">
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-main)" }}>
              {user?.name || "Alex Johnson"}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .md\\:flex { display: flex !important; }
          .md\\:block { display: block !important; }
        }
      `}</style>
    </header>
  );
};

export default Topbar;
