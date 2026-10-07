import { useId } from "react";

const Input = ({
  label,
  id,
  type = "text",
  placeholder = "",
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  rightElement,
  required = false,
  disabled = false,
  className = "",
  containerStyle = {},
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", width: "100%", ...containerStyle }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "0.85rem",
            fontWeight: "600",
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem"
          }}
        >
          {label}
          {required && <span style={{ color: "#ef4444" }}>*</span>}
        </label>
      )}

      <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
        {Icon && (
          <div
            style={{
              position: "absolute",
              left: "0.85rem",
              color: "var(--text-subtle)",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none"
            }}
          >
            <Icon size={18} />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "0.65rem 0.9rem",
            paddingLeft: Icon ? "2.5rem" : "0.9rem",
            paddingRight: rightElement ? "2.5rem" : "0.9rem",
            fontSize: "0.9rem",
            borderRadius: "0.65rem",
            border: `1px solid ${error ? "#ef4444" : "var(--border-color)"}`,
            backgroundColor: "var(--bg-main)",
            color: "var(--text-main)",
            outline: "none",
            transition: "all 0.15s ease"
          }}
          className={`input-field ${className}`}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = "#16A34A";
            e.target.style.boxShadow = "0 0 0 3px rgba(22, 163, 74, 0.15)";
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = "var(--border-color)";
            e.target.style.boxShadow = "none";
          }}
          {...props}
        />

        {rightElement && (
          <div
            style={{
              position: "absolute",
              right: "0.75rem",
              display: "flex",
              alignItems: "center"
            }}
          >
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <span style={{ fontSize: "0.78rem", color: "#ef4444", fontWeight: "500" }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{helperText}</span>
      ) : null}
    </div>
  );
};

export default Input;
