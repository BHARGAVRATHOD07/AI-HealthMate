import { Link } from "react-router-dom";
import { Activity, Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: "var(--bg-card)",
        borderTop: "1px solid var(--border-color)",
        padding: "3.5rem 1.5rem 2rem",
        marginTop: "auto"
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "2.5rem",
          marginBottom: "3rem"
        }}
      >
        {/* Brand Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "0.6rem",
                background: "linear-gradient(135deg, #16A34A 0%, #059669 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Activity size={20} />
            </div>
            <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-main)" }}>
              AI Health<span style={{ color: "#16A34A" }}>Mate</span>
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "300px" }}>
            Your Intelligent Personal Healthcare Companion. Centralizing personal health records, vital tracking, medication management, and smart informational assistance.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#10b981", fontWeight: "600" }}>
            <Shield size={16} /> Patient Data Focused & Confidential
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem" }}>
            Quick Links
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.875rem" }}>
            <li><Link to="/" style={{ color: "var(--text-muted)" }}>Home</Link></li>
            <li><a href="#features" style={{ color: "var(--text-muted)" }}>Features</a></li>
            <li><a href="#how-it-works" style={{ color: "var(--text-muted)" }}>How It Works</a></li>
            <li><a href="#why-us" style={{ color: "var(--text-muted)" }}>Why AI HealthMate</a></li>
          </ul>
        </div>

        {/* Core Features */}
        <div>
          <h4 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem" }}>
            Patient Features
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.875rem" }}>
            <li><Link to="/dashboard" style={{ color: "var(--text-muted)" }}>Health Overview</Link></li>
            <li><Link to="/records" style={{ color: "var(--text-muted)" }}>Medical Records Storage</Link></li>
            <li><Link to="/medications" style={{ color: "var(--text-muted)" }}>Medication Tracker</Link></li>
            <li><Link to="/monitoring" style={{ color: "var(--text-muted)" }}>Vital Sign Analytics</Link></li>
            <li><Link to="/assistant" style={{ color: "var(--text-muted)" }}>AI Assistant</Link></li>
          </ul>
        </div>

        {/* Medical Disclaimer */}
        <div>
          <h4 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem" }}>
            Important Disclaimer
          </h4>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            AI HealthMate is designed for personal healthcare organization and informational support only. It does NOT provide medical diagnosis or replace professional clinical advice. Always consult a qualified physician for health concerns.
          </p>
        </div>
      </div>

      {/* Sub Footer */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          paddingTop: "1.5rem",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          fontSize: "0.8125rem",
          color: "var(--text-subtle)"
        }}
      >
        <div>
          © {new Date().getFullYear()} AI HealthMate. All rights reserved.
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Security Notice</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
