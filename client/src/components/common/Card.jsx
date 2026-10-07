const Card = ({
  children,
  title,
  subtitle,
  icon: Icon,
  headerAction,
  className = "",
  padding = "1.25rem",
  hoverable = false,
  style = {}
}) => {
  return (
    <div
      style={{
        background: "var(--bg-card-surface)",
        border: "1px solid var(--border-color)",
        borderRadius: "1.15rem",
        boxShadow: "var(--shadow-sm)",
        padding: padding,
        transition: "all 0.2s ease",
        cursor: hoverable ? "pointer" : "default",
        transform: hoverable ? "translateY(-1px)" : "none",
        ...style
      }}
      className={`health-card ${hoverable ? "hover:border-sky-400 dark:hover:border-sky-600" : ""} ${className}`}
    >
      {(title || subtitle || Icon || headerAction) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {Icon && (
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "0.8rem",
                  background: "linear-gradient(135deg, rgba(22, 163, 74,0.12), rgba(5, 150, 105,0.08))",
                  color: "#16A34A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: "1px solid rgba(22, 163, 74, 0.08)"
                }}
              >
                <Icon size={20} />
              </div>
            )}
            <div>
              {title && (
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: "700",
                    color: "var(--text-main)",
                    margin: 0,
                    lineHeight: 1.3
                  }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-muted)",
                    marginTop: "0.15rem"
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Card;
