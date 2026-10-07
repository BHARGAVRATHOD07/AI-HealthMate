import Button from "./Button";
import { FolderOpen } from "lucide-react";

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = "No data available",
  description = "Get started by adding your first item.",
  actionLabel,
  onAction
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "3rem 1.5rem",
        borderRadius: "1rem",
        border: "1px dashed var(--border-color)",
        backgroundColor: "var(--bg-card)",
        margin: "1rem 0"
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "rgba(22, 163, 74, 0.1)",
          color: "#16A34A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1rem"
        }}
      >
        <Icon size={28} />
      </div>

      <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.4rem" }}>
        {title}
      </h4>

      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "360px", marginBottom: actionLabel ? "1.25rem" : "0" }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
