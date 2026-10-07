import { useState } from "react";
import { User, Lock, Bell, Moon, Sun, Shield, LogOut, Download, Save } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Toast from "../components/common/Toast";
import {
  changeAuthenticatedPassword,
  getVitals,
  getMedications,
  getReminders,
  getRecords
} from "../api/api";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();

  const [toastMessage, setToastMessage] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  // Account State
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Preferences State
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [aiInsightsNotifs, setAiInsightsNotifs] = useState(true);

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const updatedUser = await updateProfile({ name, email });
      setName(updatedUser.name);
      setEmail(updatedUser.email);
      setToastMessage("Account settings saved.");
    } catch (error) {
      setToastMessage(`Could not save account settings: ${error.message}`);
    } finally {
      setSavingAccount(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setToastMessage("Please enter current and new passwords.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setToastMessage("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setToastMessage("New password must be at least 6 characters.");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await changeAuthenticatedPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setToastMessage(response.message);
    } catch (error) {
      setToastMessage(`Could not change password: ${error.message}`);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      const [vitals, medications, reminders, records] = await Promise.all([
        getVitals(),
        getMedications(),
        getReminders(),
        getRecords()
      ]);
      const exportData = {
        user,
        vitals: vitals.data,
        medications: medications.data,
        reminders: reminders.data,
        records: records.data,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AI_HealthMate_Export_${(user?.name || "User").replace(/[^a-z0-9_-]/gi, "_")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setToastMessage("Health data exported to JSON.");
    } catch (error) {
      setToastMessage(`Could not export health data: ${error.message}`);
    } finally {
      setExportingData(false);
    }
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
              <Button type="submit" variant="primary" size="md" icon={Save} isLoading={savingAccount}>
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
                required
              />
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div>
              <Button type="submit" variant="outline" size="md" isLoading={changingPassword}>
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
                style={{ width: "20px", height: "20px", accentColor: "#16A34A" }}
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
                style={{ width: "20px", height: "20px", accentColor: "#16A34A" }}
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
                style={{ width: "20px", height: "20px", accentColor: "#16A34A" }}
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

            <Button variant="outline" size="md" icon={Download} isLoading={exportingData} onClick={handleExportData}>
              Export Data
            </Button>
          </div>
        </Card>

        {/* Danger Zone Card */}
        <Card title="Account Actions" subtitle="Sign out without deleting your account or health records" icon={LogOut}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Permanent account deletion is not available. Contact your administrator if you need your account removed.
              </div>
            </div>

            <Button variant="outline" size="md" icon={LogOut} onClick={logout}>
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
