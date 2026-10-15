import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Toast from "../components/common/Toast";
import { requestPasswordResetOtp, resetPasswordWithOtp } from "../api/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState("request"); // "request" | "verify" | "success"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [toast, setToast] = useState({ message: "", type: "info" });

  // Pre-fill email from query string if available
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setTimeout(() => {
      setResendSeconds((sec) => Math.max(0, sec - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  // Calculate password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
    if (score === 2) return { score: 2, label: "Fair", color: "#f59e0b" };
    if (score === 3 || score === 4) return { score: 3, label: "Good", color: "#3b82f6" };
    return { score: 4, label: "Strong", color: "#16a34a" };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword && newPassword !== confirmPassword;

  // Step 1: Request 6-digit OTP
  const handleRequestOtp = async (e) => {
    e?.preventDefault?.();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordResetOtp(trimmedEmail);
      setInfoMessage(
        res.message || "If an account exists for that email, a verification code has been sent."
      );
      setStep("verify");
      setResendSeconds(60);
      setToast({
        message: "Verification code sent to your email inbox.",
        type: "info"
      });
    } catch (err) {
      setError(err.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendSeconds > 0 || resendLoading) return;
    setError("");
    setResendLoading(true);
    try {
      const res = await requestPasswordResetOtp(email.trim().toLowerCase());
      setInfoMessage(res.message);
      setResendSeconds(60);
      setToast({
        message: "A fresh verification code has been sent to your email.",
        type: "success"
      });
    } catch (err) {
      setError(err.message || "Could not resend verification code.");
    } finally {
      setResendLoading(false);
    }
  };

  // Step 2: Verify OTP and save new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    const cleanOtp = otp.replace(/\D/g, "").slice(0, 6);
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Your new password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter matching passwords.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithOtp(email.trim().toLowerCase(), cleanOtp, newPassword);
      setStep("success");
      setToast({
        message: "Password reset successful! You can now log in.",
        type: "success"
      });
    } catch (err) {
      setError(err.message || "Unable to reset password. Please check your code and try again.");
    } finally {
      setLoading(false);
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
        background:
          "radial-gradient(circle at top, rgba(22, 163, 74, 0.15), transparent 40%), linear-gradient(180deg, var(--bg-main), rgba(22, 163, 74, 0.05))"
      }}
    >
      <Toast
        message={toast.message}
        onClose={() => setToast({ message: "", type: "info" })}
        type={toast.type}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "1.75rem",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-glow)",
          padding: "2.5rem 2rem",
          animation: "fadeIn 0.25s ease forwards",
          backdropFilter: "blur(12px)"
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              textDecoration: "none",
              marginBottom: "1.25rem"
            }}
          >
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

          {/* Stepper Indicator */}
          {step !== "success" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginBottom: "1rem"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: step === "request" ? "#16a34a" : "var(--text-muted)"
                }}
              >
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: step === "request" ? "#16a34a" : "#22c55e20",
                    color: step === "request" ? "#ffffff" : "#16a34a",
                    fontSize: "0.7rem"
                  }}
                >
                  1
                </span>
                Enter Email
              </div>

              <div
                style={{
                  width: "28px",
                  height: "2px",
                  backgroundColor: step === "verify" ? "#16a34a" : "var(--border-color)",
                  transition: "background-color 0.3s"
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: step === "verify" ? "#16a34a" : "var(--text-muted)"
                }}
              >
                <span
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: step === "verify" ? "#16a34a" : "var(--border-color)",
                    color: step === "verify" ? "#ffffff" : "var(--text-muted)",
                    fontSize: "0.7rem"
                  }}
                >
                  2
                </span>
                Verify & Reset
              </div>
            </div>
          )}

          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "800",
              color: "var(--text-main)",
              marginBottom: "0.4rem"
            }}
          >
            {step === "request" && "Forgot Password?"}
            {step === "verify" && "Verify & Set New Password"}
            {step === "success" && "Password Reset Complete!"}
          </h2>

          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              lineHeight: 1.5,
              maxWidth: "380px",
              margin: "0 auto"
            }}
          >
            {step === "request" &&
              "No worries! Enter your registered account email, and we’ll immediately send you a six-digit verification code."}
            {step === "verify" && (
              <>
                We sent a 6-digit code to{" "}
                <strong style={{ color: "var(--text-main)" }}>{email}</strong>. Enter it below with
                your new password.
              </>
            )}
            {step === "success" &&
              "Your account password has been updated securely. You can now log in with your new credentials."}
          </p>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div
            role="alert"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              backgroundColor: "var(--danger-bg)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              fontSize: "0.85rem",
              fontWeight: "500",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem"
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Enter Email Form */}
        {step === "request" && (
          <form
            onSubmit={handleRequestOtp}
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <Input
              label="Account Email Address"
              type="email"
              placeholder="name@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              autoComplete="email"
              required
              autoFocus
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Send verification code
            </Button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: "1rem",
                borderTop: "1px solid var(--border-color)"
              }}
            >
              <Link
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: "var(--text-muted)",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  transition: "color 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#16A34A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: Verify Code and Reset Password */}
        {step === "verify" && (
          <form
            onSubmit={handleResetPassword}
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {/* Ensure browser password managers associate the new password with user email, never the OTP code */}
            <input type="text" name="username" value={email} autoComplete="username" style={{ display: "none" }} readOnly />

            {/* Verification Code Input */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.4rem"
                }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "var(--text-main)"
                  }}
                >
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setError("");
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#16A34A",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Change email
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <Input
                  type="text"
                  placeholder="• • • • • •"
                  icon={KeyRound}
                  value={otp}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtp(cleaned);
                    if (error) setError("");
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  autoFocus
                  style={{
                    letterSpacing: "6px",
                    fontWeight: "700",
                    fontSize: "1.1rem"
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "0.4rem"
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Code expires in 10 minutes
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendSeconds > 0 || resendLoading}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: resendSeconds > 0 ? "var(--text-muted)" : "#16A34A",
                    fontSize: "0.78rem",
                    fontWeight: "600",
                    cursor: resendSeconds > 0 ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem"
                  }}
                >
                  {resendLoading && <RefreshCw size={12} className="animate-spin" />}
                  {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
                </button>
              </div>
            </div>

            {/* New Password Input with Show/Hide toggle */}
            <div>
              <Input
                label="New Password"
                type={showNewPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                icon={Lock}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="new-password"
                minLength={6}
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      padding: 0
                    }}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {/* Password strength bar */}
              {newPassword && (
                <div style={{ marginTop: "0.45rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.75rem",
                      marginBottom: "0.25rem"
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>Strength:</span>
                    <span style={{ color: passwordStrength.color, fontWeight: "700" }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "4px",
                      borderRadius: "2px",
                      backgroundColor: "var(--border-color)",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(passwordStrength.score / 4) * 100}%`,
                        backgroundColor: passwordStrength.color,
                        transition: "width 0.3s ease, background-color 0.3s ease"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input with Show/Hide toggle */}
            <div>
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
                icon={Lock}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="new-password"
                minLength={6}
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      padding: 0
                    }}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {/* Match verification tag */}
              {passwordsMatch && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    color: "#16A34A",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    marginTop: "0.35rem"
                  }}
                >
                  <CheckCircle2 size={14} /> Passwords match
                </div>
              )}
              {passwordsMismatch && (
                <div
                  style={{
                    color: "#ef4444",
                    fontSize: "0.75rem",
                    fontWeight: "500",
                    marginTop: "0.35rem"
                  }}
                >
                  Passwords do not match
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              icon={ShieldCheck}
              iconPosition="right"
            >
              Reset password
            </Button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--border-color)",
                fontSize: "0.85rem"
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setError("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem"
                }}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <Link
                to="/login"
                style={{
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  fontWeight: "600"
                }}
              >
                Cancel
              </Link>
            </div>
          </form>
        )}

        {/* STEP 3: Success Screen */}
        {step === "success" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "1.5rem",
              padding: "1rem 0"
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(22, 163, 74, 0.2), rgba(5, 150, 105, 0.1))",
                border: "2px solid #16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#16A34A",
                animation: "scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
              }}
            >
              <CheckCircle2 size={40} />
            </div>

            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "0.75rem",
                backgroundColor: "var(--success-bg)",
                color: "#166534",
                border: "1px solid rgba(22, 163, 74, 0.25)",
                fontSize: "0.875rem",
                fontWeight: "500",
                width: "100%"
              }}
            >
              Your password has been changed. You can now use your new password to sign in.
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate("/login")}
            >
              Proceed to Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
