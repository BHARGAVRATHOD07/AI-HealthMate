import { Pill, Clock, Check, Calendar, Trash2, Edit3 } from "lucide-react";

const MedicationCard = ({ medication, onToggleTaken, onEdit, onDelete }) => {
  const isActive = medication.status === "Active";

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
        gap: "0.85rem"
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "0.65rem",
                backgroundColor: isActive ? "rgba(22, 163, 74, 0.1)" : "var(--bg-main)",
                color: isActive ? "#16A34A" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Pill size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                {medication.name}
              </h4>
              <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#16A34A" }}>
                {medication.dosage}
              </span>
            </div>
          </div>

          <span
            style={{
              fontSize: "0.725rem",
              fontWeight: "700",
              padding: "0.2rem 0.6rem",
              borderRadius: "9999px",
              backgroundColor: isActive ? "rgba(16, 185, 129, 0.12)" : "rgba(100, 116, 139, 0.12)",
              color: isActive ? "#10b981" : "#64748b"
            }}
          >
            {medication.status}
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", margin: "0.75rem 0", fontSize: "0.8125rem" }}>
          <span
            style={{
              backgroundColor: "var(--bg-main)",
              padding: "0.25rem 0.6rem",
              borderRadius: "0.4rem",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              fontWeight: "500"
            }}
          >
            <Clock size={13} color="var(--text-muted)" /> {medication.frequency}
          </span>
          <span
            style={{
              backgroundColor: "var(--bg-main)",
              padding: "0.25rem 0.6rem",
              borderRadius: "0.4rem",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem"
            }}
          >
            <Calendar size={13} /> {medication.startDate} - {medication.endDate}
          </span>
        </div>

        {medication.instructions && (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.45, fontStyle: "italic" }}>
            "{medication.instructions}"
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "0.75rem",
          borderTop: "1px solid var(--border-color)"
        }}
      >
        <button
          onClick={() => onToggleTaken && onToggleTaken(medication._id || medication.id)}
          style={{
            padding: "0.4rem 0.85rem",
            borderRadius: "0.5rem",
            border: medication.takenToday ? "1px solid #10b981" : "1px solid var(--border-color)",
            backgroundColor: medication.takenToday ? "rgba(16, 185, 129, 0.12)" : "var(--bg-main)",
            color: medication.takenToday ? "#10b981" : "var(--text-main)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.8125rem",
            fontWeight: "600",
            transition: "all 0.15s ease"
          }}
        >
          <Check size={15} color={medication.takenToday ? "#10b981" : "var(--text-muted)"} />
          {medication.takenToday ? "Taken Today" : "Mark as Taken"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {onEdit && (
            <button
              onClick={() => onEdit(medication)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-subtle)",
                padding: "0.35rem",
                borderRadius: "0.4rem"
              }}
              title="Edit medication"
            >
              <Edit3 size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(medication._id || medication.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-subtle)",
                padding: "0.35rem",
                borderRadius: "0.4rem"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-subtle)")}
              title="Delete medication"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationCard;
