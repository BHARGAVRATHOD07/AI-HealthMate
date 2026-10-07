import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Mail, Lock, Eye, EyeOff, ArrowRight, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { requestPasswordResetOtp, resetPasswordWithOtp } from "../api/api";
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
  const [recoveryStep, setRecoveryStep] = useState("request");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const openForgotPassword = () => {
    setRecoveryStep("request");
    setRecoveryEmail(email.trim());
    setRecoveryCode("");
    setRecoveryPassword("");
    setRecoveryPasswordConfirm("");
    setRecoveryError("");
    setRecoveryMessage("");
    setResendSeconds(0);
    setForgotModalOpen(true);
  };

  const closeForgotPassword = () => {
    if (recoveryLoading) return;
    setForgotModalOpen(false);
    setRecoveryError("");
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setRecoveryError("");
    setRecoveryLoading(true);
    try {
      const result = await requestPasswordResetOtp(recoveryEmail.trim());
      setRecoveryMessage(result.message);
      setRecoveryStep("reset");
      setResendSeconds(60);
    } catch (error) {
      setRecoveryError(error.message);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setRecoveryError("");
    if (recoveryPassword.length < 6) {
      setRecoveryError("Password must be at least 6 characters.");
      return;
    }
    if (recoveryPassword !== recoveryPasswordConfirm) {
      setRecoveryError("The passwords do not match.");
      return;
    }

    setRecoveryLoading(true);
    try {
      const result = await resetPasswordWithOtp(
        recoveryEmail.trim(),
        recoveryCode.trim(),
        recoveryPassword
      );
      setForgotModalOpen(false);
      setToastMessage(result.message);
      setPassword("");
      setRecoveryCode("");
      setRecoveryPassword("");
      setRecoveryPasswordConfirm("");
    } catch (error) {
      setRecoveryError(error.message);
    } finally {
      setRecoveryLoading(false);
    }
  };

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

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        background: "radial-gradient(circle at top, rgba(22, 163, 74, 0.13), transparent 30%), linear-gradient(180deg, var(--bg-main), rgba(22, 163, 74, 0.04))"
      }}
    >
      <Toast message={toastMessage} onClose={() => setToastMessage("")} type="info" />

      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "1.75rem",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-glow)",
          padding: "2.25rem",
          animation: "fadeIn 0.25s ease forwards",
          backdropFilter: "blur(10px)"
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
                background: "linear-gradient(135deg, #16A34A 0%, #059669 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)"
              }}
            >
              <Activity size={24} />
            </div>
            <span style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--text-main)" }}>
              AI Health<span style={{ color: "#16A34A" }}>Mate</span>
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
                style={{ accentColor: "#16A34A" }}
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={openForgotPassword}
              style={{
                background: "transparent",
                border: "none",
                color: "#16A34A",
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
          <Link to="/register" style={{ color: "#16A34A", fontWeight: "700" }}>
            Create free profile
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={closeForgotPassword}
        title="Reset Your Password"
        subtitle={recoveryStep === "request"
          ? "Receive a one-time verification code at your email address."
          : "Enter the code from your email and choose a new password."}
      >
        <form
          onSubmit={recoveryStep === "request" ? handleRequestOtp : handleResetPassword}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {recoveryError && (
            <div role="alert" style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--danger-bg)",
              color: "var(--danger)",
              fontSize: "0.85rem"
            }}>
              {recoveryError}
            </div>
          )}

          {recoveryStep === "request" ? (
            <>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Enter the email address associated with your account. If it matches an account, we’ll send a six-digit code.
              </p>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                icon={Mail}
                value={recoveryEmail}
                onChange={(event) => setRecoveryEmail(event.target.value)}
                autoComplete="email"
                required
              />
              <Button type="submit" variant="primary" size="md" fullWidth isLoading={recoveryLoading} icon={ArrowRight} iconPosition="right">
                Send verification code
              </Button>
            </>
          ) : (
            <>
              <p role="status" style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {recoveryMessage}
              </p>
              <Input
                label="Six-digit verification code"
                type="text"
                placeholder="000000"
                icon={KeyRound}
                value={recoveryCode}
                onChange={(event) => setRecoveryCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
              <Input
                label="New Password"
                type="password"
                placeholder="At least 6 characters"
                icon={Lock}
                value={recoveryPassword}
                onChange={(event) => setRecoveryPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter your new password"
                icon={Lock}
                value={recoveryPasswordConfirm}
                onChange={(event) => setRecoveryPasswordConfirm(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
              <Button type="submit" variant="primary" size="md" fullWidth isLoading={recoveryLoading}>
                Reset password
              </Button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={resendSeconds > 0 || recoveryLoading}
                  onClick={handleRequestOtp}
                >
                  {resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend code"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={recoveryLoading}
                  onClick={() => {
                    setRecoveryStep("request");
                    setRecoveryError("");
                  }}
                >
                  Change email
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default Login;
