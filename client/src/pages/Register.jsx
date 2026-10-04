import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [errors, setErrors] = useState({});

  // Password strength logic
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "#cbd5e1", width: "0%" };
    if (pwd.length < 6) return { score: 1, label: "Weak", color: "#ef4444", width: "33%" };
    if (pwd.length < 10 || !/\d/.test(pwd)) return { score: 2, label: "Fair", color: "#f59e0b", width: "66%" };
    return { score: 3, label: "Strong", color: "#10b981", width: "100%" };
  };

  const pwdStrength = getPasswordStrength(password);

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Full Name is required";
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    if (!validateForm()) return;

    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setServerError(result.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        backgroundColor: "var(--bg-main)",
        background: "radial-gradient(circle at 50% 30%, rgba(2, 132, 199, 0.08) 0%, transparent 70%)"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "1.5rem",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-lg)",
          padding: "2.25rem",
          animation: "fadeIn 0.25s ease forwards"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", marginBottom: "0.85rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "0.75rem",
                background: "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)"
              }}
            >
              <Activity size={24} />
            </div>
            <span style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--text-main)" }}>
              AI Health<span style={{ color: "#0284c7" }}>Mate</span>
            </span>
          </Link>

          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.3rem" }}>
            Create Your Profile
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Join AI HealthMate to manage your personal health information
          </p>
        </div>

        {/* Server Error Notification */}
        {serverError && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--danger-bg)",
              color: "#ef4444",
              fontSize: "0.85rem",
              fontWeight: "500",
              marginBottom: "1.25rem",
              textAlign: "center"
            }}
          >
            {serverError}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <Input
            label="Full Name"
            type="text"
            placeholder="Alex Johnson"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="alex.johnson@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Create password"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-subtle)",
                  display: "flex",
                  alignItems: "center"
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          {/* Password Strength Meter */}
          {password && (
            <div style={{ marginTop: "-0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Password strength:</span>
                <span style={{ color: pwdStrength.color, fontWeight: "700" }}>{pwdStrength.label}</span>
              </div>
              <div style={{ height: "4px", backgroundColor: "var(--border-color)", borderRadius: "9999px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: pwdStrength.width,
                    backgroundColor: pwdStrength.color,
                    transition: "width 0.25s ease, background-color 0.25s ease"
                  }}
                />
              </div>
            </div>
          )}

          <Input
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter password"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            fullWidth
            icon={ArrowRight}
            iconPosition="right"
          >
            Create Profile
          </Button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border-color)",
            fontSize: "0.875rem",
            color: "var(--text-muted)"
          }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#0284c7", fontWeight: "700" }}>
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
