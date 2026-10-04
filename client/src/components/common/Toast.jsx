import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const Toast = ({ message, type = "success", onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      bgColor: "var(--success-bg)",
      borderColor: "#10b981",
      textColor: "#065f46"
    },
    error: {
      icon: AlertCircle,
      bgColor: "var(--danger-bg)",
      borderColor: "#ef4444",
      textColor: "#991b1b"
    },
    info: {
      icon: Info,
      bgColor: "var(--info-bg)",
      borderColor: "#3b82f6",
      textColor: "#1e40af"
    }
  }[type] || typeConfig.info;

  const IconComponent = typeConfig.icon;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 10000,
        backgroundColor: "var(--bg-card)",
        borderLeft: `4px solid ${typeConfig.borderColor}`,
        borderRadius: "0.75rem",
        boxShadow: "var(--shadow-lg)",
        padding: "0.85rem 1.1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        maxWidth: "400px",
        animation: "fadeIn 0.2s ease forwards"
      }}
    >
      <IconComponent size={20} color={typeConfig.borderColor} />
      <div style={{ flex: 1, fontSize: "0.875rem", color: "var(--text-main)", fontWeight: "500" }}>
        {message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center"
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
