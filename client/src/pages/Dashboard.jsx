import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Pill,
  Bell,
  FileText,
  Bot,
  ArrowRight,
  Plus,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import HealthCard from "../components/cards/HealthCard";
import ReminderCard from "../components/cards/ReminderCard";
import RecordCard from "../components/cards/RecordCard";
import Modal from "../components/common/Modal";

import {
  initialHealthOverview,
  initialReminders,
  initialHealthRecords,
  initialMedications
} from "../data/mockData";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reminders, setReminders] = useState(initialReminders);
  const [records] = useState(initialHealthRecords);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleToggleReminder = (id) => {
    setReminders((prev) =>
      prev.map((rem) => (rem.id === id ? { ...rem, completed: !rem.completed } : rem))
    );
  };

  const activeMedicationsCount = initialMedications.filter((m) => m.status === "Active").length;
  const pendingRemindersCount = reminders.filter((r) => !r.completed && r.date === "Today").length;

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "1.25rem",
          border: "1px solid var(--border-color)",
          padding: "1.5rem 1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.25rem",
          background: "linear-gradient(135deg, rgba(2, 132, 199, 0.06) 0%, rgba(13, 148, 136, 0.06) 100%)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#0284c7", fontWeight: "700", marginBottom: "0.3rem" }}>
            <Sparkles size={16} /> Daily Health Summary
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-0.02em" }}>
            Good Morning, {user?.name || "Alex Johnson"}
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Here's your personal health overview and schedule for today.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Button variant="outline" size="md" icon={Plus} onClick={() => navigate("/monitoring")}>
            Log Vitals
          </Button>
          <Button variant="primary" size="md" icon={Bot} onClick={() => navigate("/assistant")}>
            Ask AI Assistant
          </Button>
        </div>
      </div>

      {/* 4 Health Summary Top Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem"
        }}
      >
        {/* Health Score */}
        <Card padding="1.1rem">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "500" }}>Overall Health Score</div>
              <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#10b981", margin: "0.15rem 0" }}>
                92<span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: "600" }}>/100</span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "600" }}>● Optimal Wellness</span>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Activity size={22} />
            </div>
          </div>
        </Card>

        {/* Active Medications */}
        <Card padding="1.1rem">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "500" }}>Active Medications</div>
              <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0284c7", margin: "0.15rem 0" }}>
                {activeMedicationsCount}
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Prescriptions active</span>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(2, 132, 199, 0.12)",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Pill size={22} />
            </div>
          </div>
        </Card>

        {/* Pending Reminders */}
        <Card padding="1.1rem">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "500" }}>Today's Reminders</div>
              <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#f59e0b", margin: "0.15rem 0" }}>
                {pendingRemindersCount}
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tasks pending</span>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Bell size={22} />
            </div>
          </div>
        </Card>

        {/* Total Health Records */}
        <Card padding="1.1rem">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "500" }}>Stored Health Records</div>
              <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#6366f1", margin: "0.15rem 0" }}>
                {records.length}
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Documents archived</span>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(99, 102, 241, 0.12)",
                color: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <FileText size={22} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Health Vitals + Right Column */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }} className="lg:grid-cols-3">
        {/* Left Column (2 Spans): Vitals Overview + Recent Records */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} className="lg:col-span-2">
          {/* Health Vitals Grid */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                Health Vitals & Measurements
              </h2>
              <button
                onClick={() => navigate("/monitoring")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#0284c7",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}
              >
                View Analytics <ArrowRight size={15} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.1rem" }}>
              {initialHealthOverview.metrics.slice(0, 4).map((metric) => (
                <HealthCard
                  key={metric.id}
                  metric={metric}
                  onClick={() => navigate("/monitoring")}
                />
              ))}
            </div>
          </div>

          {/* Recent Health Records */}
          <Card
            title="Recent Health Records"
            subtitle="Uploaded medical reports and lab results"
            icon={FileText}
            headerAction={
              <Button variant="ghost" size="sm" onClick={() => navigate("/records")}>
                View All
              </Button>
            }
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              {records.slice(0, 2).map((rec) => (
                <RecordCard
                  key={rec.id}
                  record={rec}
                  onView={(r) => setSelectedRecord(r)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (1 Span): Reminders + AI Prominent Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* AI Assistant Callout Banner Card */}
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              borderRadius: "1.25rem",
              border: "1px solid rgba(2, 132, 199, 0.3)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-md)",
              background: "linear-gradient(135deg, rgba(2, 132, 199, 0.1) 0%, rgba(13, 148, 136, 0.1) 100%)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "0.75rem",
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 10px rgba(2, 132, 199, 0.3)"
                }}
              >
                <Bot size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                  Need Help Understanding Your Health?
                </h3>
                <span style={{ fontSize: "0.75rem", color: "#0d9488", fontWeight: "700" }}>
                  AI HealthMate Assistant
                </span>
              </div>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "1.25rem" }}>
              Ask questions about your medication timings, blood pressure readings, or receive clear breakdowns of medical terminology.
            </p>

            <Button
              variant="primary"
              size="md"
              fullWidth
              icon={Bot}
              onClick={() => navigate("/assistant")}
            >
              Ask AI Assistant
            </Button>
          </div>

          {/* Today's Schedule Reminders */}
          <Card
            title="Today's Reminders"
            subtitle="Scheduled health tasks"
            icon={Bell}
            headerAction={
              <Button variant="ghost" size="sm" onClick={() => navigate("/reminders")}>
                Manage
              </Button>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {reminders.filter((r) => r.date === "Today").map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onToggleComplete={handleToggleReminder}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Record View Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={selectedRecord.title}
          subtitle={`Category: ${selectedRecord.category} • Date: ${selectedRecord.date}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "600" }}>Physician / Facility</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginTop: "0.15rem" }}>
                {selectedRecord.doctor || "General Medical Record"} ({selectedRecord.facility || "Central Lab"})
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "600" }}>Clinical Notes / Summary</div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-main)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                {selectedRecord.description}
              </p>
            </div>

            <div style={{ padding: "0.85rem", borderRadius: "0.75rem", backgroundColor: "var(--bg-main)", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              File Details: {selectedRecord.fileType} format ({selectedRecord.fileSize})
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .lg\\:grid-cols-3 { grid-template-columns: 2fr 1fr !important; }
          .lg\\:col-span-2 { grid-column: span 2 / span 2 !important; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default Dashboard;
