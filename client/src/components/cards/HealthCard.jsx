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
    Excellent: "rgba(5, 150, 105, 0.12)",
    Optimal: "rgba(16, 185, 129, 0.12)",
    "On Track": "rgba(22, 163, 74, 0.12)",
    "Fasting Normal": "rgba(16, 185, 129, 0.12)"
  };
  const statusTextMap = {
    Normal: "#10b981",
    Good: "#10b981",
    Excellent: "#059669",
    Optimal: "#10b981",
    "On Track": "#16A34A",
    "Fasting Normal": "#10b981"
  };
  const hasValue = metric.value !== undefined
    && metric.value !== null
    && String(metric.value).trim() !== "";
  const isUnlogged = !hasValue || metric.status === "Unable to load";
  const valueStyle = {
    fontSize: hasValue ? "1.65rem" : "0.98rem",
    fontWeight: 800,
    color: "var(--text-main)",
    letterSpacing: hasValue ? "-0.03em" : "normal"
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        width: "100%",
        textAlign: "left",
        font: "inherit",
        background: "var(--bg-card-surface)",
        border: "1px solid var(--border-color)",
        borderRadius: "1.05rem",
        padding: "1.25rem",
        boxShadow: "var(--shadow-sm)",
        transition: "all 0.2s ease",
        cursor: onClick ? "pointer" : "default",
        transform: onClick ? "translateY(-1px)" : "none",
        opacity: 1
      }}
      className="health-metric-card"
      aria-label={onClick ? `View ${metric.name || metric.title} readings` : undefined}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "0.75rem",
            backgroundColor: "rgba(22, 163, 74, 0.1)",
            color: "#16A34A",
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
            backgroundColor: isUnlogged ? "var(--bg-card-alt)" : statusBgMap[metric.status] || "rgba(22, 163, 74, 0.1)",
            color: isUnlogged ? "var(--text-muted)" : statusTextMap[metric.status] || "#16A34A"
          }}
        >
          {metric.status || (hasValue ? "Recorded" : "No data available")}
        </span>
      </div>

      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "500" }}>
        {metric.name || metric.title}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", margin: "0.25rem 0" }}>
        <span style={valueStyle}>
          {hasValue ? metric.value : metric.status === "Unable to load" ? "Unavailable" : "No data available"}
        </span>
        <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-muted)" }}>
          {metric.unit && hasValue ? metric.unit : ""}
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
        <span>{metric.lastUpdated || (hasValue ? "Update time unavailable" : metric.status === "Unable to load" ? "Please try again later" : "Add your first reading")}</span>
        {metric.change && <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>{metric.change}</span>}
      </div>
    </button>
  );
};

export default HealthCard;
