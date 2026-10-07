import { useState, useEffect } from "react";
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
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import LoadingSpinner from "../components/common/LoadingSpinner";

import {
  getVitals,
  getMedications,
  getReminders,
  getRecords,
  toggleReminder
} from "../api/api";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vitals, setVitals] = useState([]);
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [vitalsRes, medsRes, remsRes, recsRes] = await Promise.allSettled([
          getVitals(),
          getMedications(),
          getReminders(),
          getRecords()
        ]);

        if (vitalsRes.status === "fulfilled" && vitalsRes.value.success) {
          setVitals(vitalsRes.value.data);
        }
        if (medsRes.status === "fulfilled" && medsRes.value.success) {
          setMedications(medsRes.value.data);
        }
        if (remsRes.status === "fulfilled" && remsRes.value.success) {
          setReminders(remsRes.value.data);
        }
        if (recsRes.status === "fulfilled" && recsRes.value.success) {
          setRecords(recsRes.value.data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleToggleReminder = async (id) => {
    try {
      // Optimistic update
      setReminders((prev) =>
        prev.map((rem) => (rem._id === id || rem.id === id ? { ...rem, completed: !rem.completed } : rem))
      );
      await toggleReminder(id);
    } catch (err) {
      console.error("Failed to toggle reminder:", err);
    }
  };

  const activeMedicationsCount = (Array.isArray(medications) ? medications : []).filter((m) => m.status === "Active").length;
  const pendingRemindersCount = (Array.isArray(reminders) ? reminders : []).filter((r) => !r.completed).length;

  const safeVitals = Array.isArray(vitals) ? vitals : [];
  const safeRecords = Array.isArray(records) ? records : [];
  const safeReminders = Array.isArray(reminders) ? reminders : [];

  const getLatestVital = (type) =>
    safeVitals
      .filter((vital) => vital.type === type)
      .sort(
        (a, b) =>
          new Date(b.loggedAt || b.createdAt || 0).getTime() -
          new Date(a.loggedAt || a.createdAt || 0).getTime()
      )[0];

  const vitalMetrics = [
    {
      id: "bp",
      name: "Blood Pressure",
      value: getLatestVital("Blood Pressure")?.value,
      unit: "mmHg",
      status: getLatestVital("Blood Pressure")?.status || "Not logged",
      lastUpdated: getLatestVital("Blood Pressure")?.loggedAt
        ? new Date(getLatestVital("Blood Pressure").loggedAt).toLocaleDateString()
        : null
    },
    {
      id: "hr",
      name: "Heart Rate",
      value: getLatestVital("Heart Rate")?.value,
      unit: "bpm",
      status: getLatestVital("Heart Rate")?.status || "Not logged",
      lastUpdated: getLatestVital("Heart Rate")?.loggedAt
        ? new Date(getLatestVital("Heart Rate").loggedAt).toLocaleDateString()
        : null
    },
    {
      id: "sugar",
      name: "Blood Sugar",
      value: getLatestVital("Blood Sugar")?.value,
      unit: "mg/dL",
      status: getLatestVital("Blood Sugar")?.status || "Not logged",
      lastUpdated: getLatestVital("Blood Sugar")?.loggedAt
        ? new Date(getLatestVital("Blood Sugar").loggedAt).toLocaleDateString()
        : null
    },
    {
      id: "weight",
      name: "Weight",
      value: getLatestVital("Weight")?.value,
      unit: "kg",
      status: getLatestVital("Weight")?.status || "Not logged",
      lastUpdated: getLatestVital("Weight")?.loggedAt
        ? new Date(getLatestVital("Weight").loggedAt).toLocaleDateString()
        : null
    }
  ];

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "1.45rem",
          border: "1px solid rgba(22, 163, 74, 0.18)",
          padding: "1.5rem 1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.25rem",
          background: "radial-gradient(circle at top left, rgba(22, 163, 74, 0.12), transparent 25%), linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.85rem", color: "#16A34A", fontWeight: "700", marginBottom: "0.35rem" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(22, 163, 74, 0.1)" }}>
              <Sparkles size={14} />
            </div>
            Daily Health Summary
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", margin: 0, letterSpacing: "-0.03em" }}>
            Good Day, {user?.name || "Patient"}
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            Here's your personal health overview and schedule for today.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <Button variant="outline" size="md" icon={Plus} onClick={() => navigate("/monitoring")}>
            Log Vitals
          </Button>
          <Button variant="primary" size="md" icon={Bot} onClick={() => navigate("/assistant")}>
            Ask AI Assistant
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", display: "flex", justifyContent: "center" }}>
          <LoadingSpinner size="lg" text="Loading health overview..." />
        </div>
      ) : (
        <>
          {/* 4 Health Summary Top Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem"
            }}
          >
            {/* Vitals Count */}
            <Card padding="1.1rem">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "500" }}>Vitals Logged</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#10b981", margin: "0.15rem 0" }}>
                    {safeVitals.length}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>Measurements recorded</span>
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
                  <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#16A34A", margin: "0.15rem 0" }}>
                    {activeMedicationsCount}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Prescriptions active</span>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(22, 163, 74, 0.12)",
                    color: "#16A34A",
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
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "500" }}>Pending Reminders</div>
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
          <div style={{ gridTemplateColumns: "minmax(0, 1fr)", gap: "1.5rem" }} className="dashboard-overview-grid">
            {/* Left Column (2 Spans): Vitals Overview + Recent Records */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", minWidth: 0 }}>
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
                      color: "#16A34A",
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
                  {vitalMetrics.map((metric) => (
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
                  {safeRecords.length ? safeRecords.slice(0, 2).map((rec) => (
                    <RecordCard
                      key={rec._id || rec.id}
                      record={{
                        ...rec,
                        id: rec._id || rec.id,
                        doctor: rec.doctorName || rec.doctor,
                        date: rec.date ? new Date(rec.date).toLocaleDateString() : "Recent",
                        fileType: rec.category,
                        fileSize: "1.2 MB",
                        description: rec.summary
                      }}
                      onView={(r) => setSelectedRecord(r)}
                    />
                  )) : (
                    <EmptyState
                      icon={FileText}
                      title="No health records yet"
                      description="Add your first record to keep reports and notes together."
                      actionLabel="Add a record"
                      onAction={() => navigate("/records")}
                    />
                  )}
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
                  border: "1px solid rgba(22, 163, 74, 0.3)",
                  padding: "1.5rem",
                  boxShadow: "var(--shadow-md)",
                  background: "linear-gradient(135deg, rgba(22, 163, 74, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)",
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
                      backgroundColor: "#16A34A",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 10px rgba(22, 163, 74, 0.3)"
                    }}
                  >
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
                      Need Help Understanding Your Health?
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: "700" }}>
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
                title="Schedule Reminders"
                subtitle="Scheduled health tasks"
                icon={Bell}
                headerAction={
                  <Button variant="ghost" size="sm" onClick={() => navigate("/reminders")}>
                    Manage
                  </Button>
                }
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {safeReminders.length ? safeReminders.slice(0, 4).map((reminder) => (
                    <ReminderCard
                      key={reminder._id || reminder.id}
                      reminder={{
                        ...reminder,
                        id: reminder._id || reminder.id
                      }}
                      onToggleComplete={handleToggleReminder}
                    />
                  )) : (
                    <EmptyState
                      icon={Bell}
                      title="No reminders scheduled"
                      description="Create a reminder for medication, appointments, or health checks."
                      actionLabel="Manage reminders"
                      onAction={() => navigate("/reminders")}
                    />
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Record View Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={selectedRecord.title}
          subtitle={`Category: ${selectedRecord.category || selectedRecord.fileType} • Date: ${selectedRecord.date}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "600" }}>Physician / Facility</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginTop: "0.15rem" }}>
                {selectedRecord.doctorName || selectedRecord.doctor || "General Medical Record"} ({selectedRecord.facility || "Central Lab"})
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "600" }}>Clinical Notes / Summary</div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-main)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                {selectedRecord.summary || selectedRecord.description}
              </p>
            </div>
          </div>
        </Modal>
      )}

      <style>{`
      `}</style>
    </DashboardLayout>
  );
};

export default Dashboard;
