const LoadingSpinner = ({ size = "md", color = "primary", label = "" }) => {
  const sizePixels = {
    sm: 16,
    md: 24,
    lg: 36,
    xl: 48
  }[size] || 24;

  const colorHex = {
    primary: "#0284c7",
    teal: "#0d9488",
    white: "#ffffff",
    gray: "#64748b"
  }[color] || "#0284c7";

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      <svg
        width={sizePixels}
        height={sizePixels}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: "spin 0.8s linear infinite"
        }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={colorHex}
          strokeWidth="3"
          strokeOpacity="0.25"
        />
        <path
          d="M12 2A10 10 0 0 1 22 12"
          stroke={colorHex}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label && <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{label}</span>}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
