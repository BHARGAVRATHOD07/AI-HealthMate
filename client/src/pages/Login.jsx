import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Toast from "../components/common/Toast";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setErrors({ general: result.message || "Invalid email or password." });
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      setToastMessage("Please enter a valid email address");
      return;
    }
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotModalOpen(false);
      setForgotSuccess(false);
      setForgotEmail("");
      setToastMessage("Password reset instructions sent to your email!");
    }, 1500);
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
      <Toast message={toastMessage} onClose={() => setToastMessage("")} type="info" />

      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "1.5rem",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-lg)",
          padding: "2.25rem",
          animation: "fadeIn 0.25s ease forwards"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", marginBottom: "1rem" }}>
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

          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.4rem" }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Log in to access your personal healthcare portal
          </p>
        </div>

        {/* Errors Alert */}
        {errors.general && (
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
            {errors.general}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
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

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: "#0284c7" }}
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={() => setForgotModalOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "#0284c7",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            fullWidth
            icon={ArrowRight}
            iconPosition="right"
          >
            Log In
          </Button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "1.75rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-color)",
            fontSize: "0.875rem",
            color: "var(--text-muted)"
          }}
        >
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#0284c7", fontWeight: "700" }}>
            Create free profile
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Your Password"
        subtitle="Enter your email address and we'll send you a password reset link."
      >
        {forgotSuccess ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <ShieldCheck size={48} color="#10b981" style={{ margin: "0 auto 1rem" }} />
            <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)" }}>Reset Link Sent!</h4>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              Please check your email inbox for instructions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" size="md" fullWidth>
              Send Reset Link
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Login;
