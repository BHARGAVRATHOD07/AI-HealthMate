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
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "1rem",
        boxShadow: "var(--shadow-sm)",
        padding: padding,
        transition: "all 0.2s ease",
        cursor: hoverable ? "pointer" : "default",
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
                  width: "38px",
                  height: "38px",
                  borderRadius: "0.6rem",
                  backgroundColor: "rgba(2, 132, 199, 0.1)",
                  color: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
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
