import { Clock, CheckCircle2, Circle, Pill, Activity, Droplet, Dumbbell, Calendar, Trash2 } from "lucide-react";

const categoryIconMap = {
  Medication: Pill,
  Checkup: Activity,
  Hydration: Droplet,
  Exercise: Dumbbell
};

const ReminderCard = ({ reminder, onToggleComplete, onDelete }) => {
  const IconComponent = categoryIconMap[reminder.category] || Calendar;

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: `1px solid ${reminder.completed ? "var(--border-color)" : "rgba(22, 163, 74, 0.3)"}`,
        borderRadius: "0.85rem",
        padding: "1rem 1.1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.85rem",
        opacity: reminder.completed ? 0.75 : 1,
        transition: "all 0.2s ease"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flex: 1 }}>
        <button
          onClick={() => onToggleComplete(reminder.id)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: reminder.completed ? "#10b981" : "var(--text-subtle)",
            display: "flex",
            alignItems: "center",
            padding: 0,
            transition: "transform 0.15s ease"
          }}
          aria-label={reminder.completed ? "Mark incomplete" : "Mark complete"}
        >
          {reminder.completed ? <CheckCircle2 size={22} color="#10b981" /> : <Circle size={22} />}
        </button>

        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "0.5rem",
            backgroundColor: reminder.completed ? "var(--bg-main)" : "rgba(22, 163, 74, 0.1)",
            color: reminder.completed ? "var(--text-muted)" : "#16A34A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <IconComponent size={18} />
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.925rem",
              fontWeight: "600",
              color: "var(--text-main)",
              textDecoration: reminder.completed ? "line-through" : "none"
            }}
          >
            {reminder.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.2rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Clock size={13} /> {reminder.time}
            </span>
            <span>•</span>
            <span
              style={{
                backgroundColor: "var(--bg-main)",
                padding: "0.1rem 0.45rem",
                borderRadius: "0.25rem",
                fontSize: "0.72rem",
                fontWeight: "600"
              }}
            >
              {reminder.category}
            </span>
          </div>
        </div>
      </div>

      {onDelete && (
        <button
          onClick={() => onDelete(reminder.id)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-subtle)",
            padding: "0.35rem",
            borderRadius: "0.4rem",
            display: "flex",
            alignItems: "center"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-subtle)")}
          title="Delete reminder"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};

export default ReminderCard;
