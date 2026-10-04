import { Activity, Heart, Scale, Droplet, Wind, Thermometer } from "lucide-react";

const iconMap = {
  Activity,
  Heart,
  Scale,
  Droplet,
  Wind,
  Thermometer
};

const HealthCard = ({ metric, onClick }) => {
  const IconComponent = iconMap[metric.icon] || Activity;

  const statusBgMap = {
    Normal: "rgba(16, 185, 129, 0.12)",
    Good: "rgba(16, 185, 129, 0.12)",
    Excellent: "rgba(13, 148, 136, 0.12)",
    Optimal: "rgba(16, 185, 129, 0.12)",
    "On Track": "rgba(2, 132, 199, 0.12)",
    "Fasting Normal": "rgba(16, 185, 129, 0.12)"
  };

  const statusTextMap = {
    Normal: "#10b981",
    Good: "#10b981",
    Excellent: "#0d9488",
    Optimal: "#10b981",
    "On Track": "#0284c7",
    "Fasting Normal": "#10b981"
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "1rem",
        padding: "1.25rem",
        boxShadow: "var(--shadow-sm)",
        transition: "all 0.2s ease",
        cursor: onClick ? "pointer" : "default"
      }}
      className="health-metric-card hover:border-sky-500"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "0.75rem",
            backgroundColor: "rgba(2, 132, 199, 0.1)",
            color: "#0284c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <IconComponent size={22} />
        </div>

        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: "700",
            padding: "0.25rem 0.65rem",
            borderRadius: "9999px",
            backgroundColor: statusBgMap[metric.status] || "rgba(2, 132, 199, 0.1)",
            color: statusTextMap[metric.status] || "#0284c7"
          }}
        >
          {metric.status}
        </span>
      </div>

      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "500" }}>
        {metric.name}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", margin: "0.25rem 0" }}>
        <span style={{ fontSize: "1.65rem", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.03em" }}>
          {metric.value}
        </span>
        <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-muted)" }}>
          {metric.unit}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "var(--text-subtle)",
          marginTop: "0.6rem",
          paddingTop: "0.6rem",
          borderTop: "1px dashed var(--border-color)"
        }}
      >
        <span>Target: {metric.targetRange}</span>
        <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>{metric.change}</span>
      </div>
    </div>
  );
};

export default HealthCard;
