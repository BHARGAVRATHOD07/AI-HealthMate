import { useState } from "react";
import { User, Lock, Bell, Moon, Sun, Shield, LogOut, Trash2, Download, Save } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Toast from "../components/common/Toast";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();

  const [toastMessage, setToastMessage] = useState("");

  // Account State
  const [name, setName] = useState(user?.name || "Alex Johnson");
  const [email, setEmail] = useState(user?.email || "alex.johnson@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Preferences State
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [aiInsightsNotifs, setAiInsightsNotifs] = useState(true);

  // Danger Zone Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleSaveAccount = (e) => {
    e.preventDefault();
    updateProfile({ name, email });
    setToastMessage("Account settings updated successfully!");
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setToastMessage("Please enter current and new passwords.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setToastMessage("New passwords do not match.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setToastMessage("Password changed successfully!");
  };

  const handleExportData = () => {
    const healthDataJSON = JSON.stringify(
      { user, exportedAt: new Date().toISOString(), note: "AI HealthMate Patient Data Export" },
      null,
      2
    );
    const blob = new Blob([healthDataJSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AI_HealthMate_Export_${user?.name || "User"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage("Health data exported to JSON!");
  };

  return (
    <DashboardLayout>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} type="success" />

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
          Application Settings
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          Manage your account details, notification preferences, themes, and data security
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        {/* Account Settings Card */}
        <Card title="Account Information" subtitle="Update profile name and email address" icon={User}>
          <form onSubmit={handleSaveAccount} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Button type="submit" variant="primary" size="md" icon={Save}>
                Save Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* Password Security Card */}
        <Card title="Security & Password" subtitle="Update your account login password" icon={Lock}>
          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Button type="submit" variant="outline" size="md">
                Update Password
              </Button>
            </div>
          </form>
        </Card>

        {/* Preferences Card */}
        <Card title="Notification Preferences" subtitle="Control medication alerts and email reports" icon={Bell}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.925rem", fontWeight: "600", color: "var(--text-main)" }}>Email Notifications</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Receive daily health overviews via email</div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                style={{ width: "20px", height: "20px", accentColor: "#0284c7" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)" }}>
              <div>
                <div style={{ fontSize: "0.925rem", fontWeight: "600", color: "var(--text-main)" }}>SMS Medication Alerts</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Receive instant SMS alerts for prescription timings</div>
              </div>
              <input
                type="checkbox"
                checked={smsNotifs}
                onChange={(e) => setSmsNotifs(e.target.checked)}
                style={{ width: "20px", height: "20px", accentColor: "#0284c7" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)" }}>
              <div>
                <div style={{ fontSize: "0.925rem", fontWeight: "600", color: "var(--text-main)" }}>AI Health Insights</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Allow AI Assistant to generate weekly vital trend summaries</div>
              </div>
              <input
                type="checkbox"
                checked={aiInsightsNotifs}
                onChange={(e) => setAiInsightsNotifs(e.target.checked)}
                style={{ width: "20px", height: "20px", accentColor: "#0284c7" }}
              />
            </div>
          </div>
        </Card>

        {/* Appearance & Dark Mode */}
        <Card title="Appearance & Interface Theme" subtitle="Toggle dark mode and visual themes" icon={theme === "dark" ? Moon : Sun}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)" }}>
                Current Mode: {theme === "dark" ? "Dark Theme" : "Light Theme"}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Adjust color scheme for low-light environments
              </div>
            </div>

            <Button
              variant="secondary"
              size="md"
              icon={theme === "dark" ? Sun : Moon}
              onClick={toggleTheme}
            >
              Switch to {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
          </div>
        </Card>

        {/* Privacy & Data Export */}
        <Card title="Privacy & Personal Data Export" subtitle="Export or backup your patient records" icon={Shield}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)" }}>
                Export My Health Data
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Download a JSON backup of your records, medications, and profile
              </div>
            </div>

            <Button variant="outline" size="md" icon={Download} onClick={handleExportData}>
              Export Data
            </Button>
          </div>
        </Card>

        {/* Danger Zone Card */}
        <Card title="Danger Zone" subtitle="Irreversible account actions" icon={LogOut} style={{ borderColor: "#ef4444" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#ef4444" }}>
                Delete Account & Purge Data
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Permanently erase your patient profile and medical record vault
              </div>
            </div>

            <Button variant="danger" size="md" icon={Trash2} onClick={() => setDeleteModalOpen(true)}>
              Delete Account
            </Button>
          </div>
        </Card>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        subtitle="Are you sure you want to permanently delete your AI HealthMate account?"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-main)", lineHeight: 1.5 }}>
            This action cannot be undone. All your health records, vital measurements, medication logs, and profile data will be permanently removed.
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Button variant="outline" size="md" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => {
                setDeleteModalOpen(false);
                logout();
              }}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Settings;
