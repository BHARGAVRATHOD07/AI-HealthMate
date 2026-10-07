import LoadingSpinner from "./LoadingSpinner";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  style: customStyle = {},
  onClick,
  type = "button",
  ...props
}) => {
  const inlineVariantStyles = {
    primary: { background: "linear-gradient(135deg, #16A34A 0%, #059669 100%)", color: "#ffffff", border: "none" },
    teal: { background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", border: "none" },
    secondary: { backgroundColor: "var(--bg-card-hover)", color: "var(--text-main)", border: "1px solid var(--border-color)" },
    outline: { backgroundColor: "transparent", color: "var(--text-main)", border: "1px solid var(--border-color)" },
    ghost: { backgroundColor: "transparent", color: "var(--text-muted)", border: "none" },
    danger: { background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#ffffff", border: "none" }
  };

  const inlineSizeStyles = {
    sm: { padding: "0.45rem 0.8rem", fontSize: "0.8125rem" },
    md: { padding: "0.7rem 1.2rem", fontSize: "0.9375rem" },
    lg: { padding: "0.9rem 1.55rem", fontSize: "1rem" }
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        fontWeight: "600",
        borderRadius: "0.75rem",
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        opacity: disabled || isLoading ? 0.65 : 1,
        transition: "all 0.2s ease",
        width: fullWidth ? "100%" : "auto",
        ...inlineSizeStyles[size],
        ...inlineVariantStyles[variant],
        ...customStyle,
      }}
      className={`btn-${variant} ${className}`}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" color={variant === "outline" || variant === "ghost" ? "primary" : "white"} />
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 18} />}
          <span>{children}</span>
          {Icon && iconPosition === "right" && <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 18} />}
        </>
      )}
    </button>
  );
};

export default Button;
