import { useState } from "react";
import { Search, Bell, Sun, Moon, Menu, Shield } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Topbar = ({ onOpenMobileSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/records?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header
      className="dashboard-topbar"
      style={{
        height: "68px",
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
      <div className="topbar-search-region" style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, maxWidth: "420px" }}>
        <button
          onClick={onOpenMobileSidebar}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-main)",
            cursor: "pointer",
            padding: "0.45rem",
            display: "flex",
            alignItems: "center",
            borderRadius: "0.7rem"
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
              left: "0.9rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-subtle)",
              pointerEvents: "none"
            }}
          />
          <input
            type="text"
            placeholder="Search records, medications, logs..."
            aria-label="Search records, medications, and logs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.62rem 0.9rem 0.62rem 2.5rem",
              fontSize: "0.85rem",
              borderRadius: "9999px",
              border: "1px solid var(--border-color)",
              background: "linear-gradient(180deg, var(--bg-card), var(--bg-main))",
              color: "var(--text-main)",
              outline: "none"
            }}
          />
        </form>
      </div>

      <div className="topbar-actions" style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        <div
          style={{
            display: "none",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.75rem",
            fontWeight: "700",
            color: "#047857",
            backgroundColor: "rgba(5, 150, 105, 0.12)",
            padding: "0.38rem 0.72rem",
            borderRadius: "9999px",
            border: "1px solid rgba(5, 150, 105, 0.15)"
          }}
          className="md:flex"
        >
          <Shield size={13} /> Patient Portal
        </div>

        <button
          onClick={toggleTheme}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "0.75rem",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-card)",
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)"
          }}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#16A34A" />}
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "0.75rem",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              boxShadow: "var(--shadow-sm)"
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          {/* Notifications Dropdown Modal */}
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "48px",
                width: "min(320px, calc(100vw - 1.5rem))",
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
                  Notifications
                </div>
              </div>

              <div style={{ padding: "1.5rem 1rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>
                  No notifications yet
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Your notifications will appear here when available.
                </div>
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
              backgroundColor: "#16A34A",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "0.95rem",
              boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)"
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div style={{ display: "none" }} className="md:block">
            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-main)" }}>
              {user?.name || "Patient"}
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
