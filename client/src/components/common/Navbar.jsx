import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Sun, Moon, Menu, X, ArrowRight, UserCheck } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Button from "./Button";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "var(--bg-topbar)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-color)",
        transition: "all 0.2s ease"
      }}
    >
      <div
        className="navbar-content"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0.85rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        {/* Brand Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.65rem", textDecoration: "none" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "0.65rem",
              background: "linear-gradient(135deg, #16A34A 0%, #059669 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)"
            }}
          >
            <Activity size={22} />
          </div>
          <div>
            <span className="navbar-brand-name" style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.02em" }}>
              AI Health<span style={{ color: "#16A34A" }}>Mate</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav
          style={{
            display: "none",
            alignItems: "center",
            gap: "2rem"
          }}
          className="md:flex"
        >
          <a href="#home" style={{ fontSize: "0.925rem", fontWeight: "600", color: "var(--text-main)" }}>
            Home
          </a>
          <a href="#features" style={{ fontSize: "0.925rem", fontWeight: "500", color: "var(--text-muted)" }}>
            Features
          </a>
          <a href="#how-it-works" style={{ fontSize: "0.925rem", fontWeight: "500", color: "var(--text-muted)" }}>
            How It Works
          </a>
          <a href="#about" style={{ fontSize: "0.925rem", fontWeight: "500", color: "var(--text-muted)" }}>
            About
          </a>
          <a href="#contact" style={{ fontSize: "0.925rem", fontWeight: "500", color: "var(--text-muted)" }}>
            Contact
          </a>
        </nav>

        {/* Right Actions */}
        <div className="navbar-actions" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
            aria-label="Toggle Dark Mode"
          >
            {theme === "dark" ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#16A34A" />}
          </button>

          {isAuthenticated ? (
            <Button
              variant="primary"
              size="md"
              className="navbar-primary-cta"
              icon={UserCheck}
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </Button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Button
                variant="ghost"
                size="md"
                className="navbar-login-button"
                onClick={() => navigate("/login")}
              >
                Log In
              </Button>
              <Button
                variant="primary"
                size="md"
                className="navbar-primary-cta"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => navigate("/register")}
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-main)",
              cursor: "pointer",
              padding: "0.4rem",
              display: "flex",
              alignItems: "center"
            }}
            className="md:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderBottom: "1px solid var(--border-color)",
            padding: "1rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
          className="md:hidden"
        >
          <a
            href="#home"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-main)" }}
          >
            Home
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: "1rem", fontWeight: "500", color: "var(--text-muted)" }}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: "1rem", fontWeight: "500", color: "var(--text-muted)" }}
          >
            How It Works
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: "1rem", fontWeight: "500", color: "var(--text-muted)" }}
          >
            About
          </a>
          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: "1rem", fontWeight: "500", color: "var(--text-muted)" }}
          >
            Contact
          </a>
          {!isAuthenticated && (
            <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)" }}>
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/login");
                }}
              >
                Log In
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/register");
                }}
              >
                Get Started
              </Button>
            </div>
          )}
          {isAuthenticated && (
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/dashboard");
              }}
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .md\\:flex { display: flex !important; }
          .md\\:hidden { display: none !important; }
        }
        @media (max-width: 480px) {
          .navbar-content { padding: 0.75rem 1rem !important; }
          .navbar-brand-name { font-size: 1.05rem !important; white-space: nowrap; }
          .navbar-actions { gap: 0.35rem !important; }
          .navbar-login-button { display: none !important; }
          .navbar-primary-cta { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
