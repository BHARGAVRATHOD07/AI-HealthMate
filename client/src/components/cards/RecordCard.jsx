import { Eye, Trash2, Calendar, User, Building } from "lucide-react";

const RecordCard = ({ record, onView, onDelete }) => {
  const categoryBadgeMap = {
    "Lab Report": { bg: "rgba(5, 150, 105, 0.12)", color: "#059669" },
    Prescription: { bg: "rgba(22, 163, 74, 0.12)", color: "#16A34A" },
    "Medical Report": { bg: "rgba(99, 102, 241, 0.12)", color: "#6366f1" },
    Vaccination: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981" },
    Other: { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b" }
  };

  const badgeStyle = categoryBadgeMap[record.category] || categoryBadgeMap.Other;

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "1rem",
        padding: "1.25rem",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "1rem",
        transition: "all 0.2s ease"
      }}
      className="hover:border-sky-400"
    >
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.725rem",
              fontWeight: "700",
              padding: "0.25rem 0.65rem",
              borderRadius: "9999px",
              backgroundColor: badgeStyle.bg,
              color: badgeStyle.color
            }}
          >
            {record.category}
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <Calendar size={13} /> {record.date}
          </span>
        </div>

        <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.4rem", lineHeight: 1.3 }}>
          {record.title}
        </h4>

        <p style={{ fontSize: "0.8375rem", color: "var(--text-muted)", lineHeight: 1.45, marginBottom: "0.75rem" }}>
          {record.description}
        </p>

        {(record.doctor || record.facility) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", fontSize: "0.78rem", color: "var(--text-subtle)" }}>
            {record.doctor && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <User size={13} /> {record.doctor}
              </span>
            )}
            {record.facility && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Building size={13} /> {record.facility}
              </span>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "0.75rem",
          borderTop: "1px solid var(--border-color)",
          fontSize: "0.78rem"
        }}
      >
        <span style={{ color: "var(--text-subtle)", fontWeight: "500" }}>
          {record.fileType} • {record.fileSize}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <button
            onClick={() => onView(record)}
            style={{
              padding: "0.35rem 0.65rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-main)",
              color: "var(--text-main)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.78rem",
              fontWeight: "600"
            }}
          >
            <Eye size={14} /> View
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(record.id)}
              style={{
                padding: "0.35rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--text-subtle)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-subtle)")}
              title="Delete record"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordCard;
