import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  Calendar,
  Clock3,
  FileText,
  Pill,
  Plus,
  RefreshCw,
  UserRound
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import HealthCard from "../components/cards/HealthCard";
import ReminderCard from "../components/cards/ReminderCard";
import EmptyState from "../components/common/EmptyState";
import {
  getVitals,
  getMedications,
  getReminders,
  getRecords,
  toggleReminder
} from "../api/api";

const EMPTY_RESOURCE = { status: "loading", data: [] };

const formatDate = (value, options = { year: "numeric", month: "short", day: "numeric" }) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, options);
};

const formatUpdateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const isToday = date.toDateString() === new Date().toDateString();
  const formattedTime = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return isToday
    ? `today at ${formattedTime}`
    : date.toLocaleDateString();
};

const normalizeVitalType = (type) => {
  const value = typeof type === "string" ? type.trim() : "";
  if (!value) return "";

  const lower = value.toLowerCase();
  if (lower === "spo2" || lower === "oxygen" || lower === "oxygen level") return "Oxygen Level";
  return value;
};

const getLatestVital = (vitals, type) => {
  const normalizedType = normalizeVitalType(type);

  return vitals
    .filter((vital) => normalizeVitalType(vital.type) === normalizedType)
    .sort((a, b) =>
      new Date(b.loggedAt || b.createdAt || 0).getTime()
      - new Date(a.loggedAt || a.createdAt || 0).getTime()
    )[0];
};

const getReminderSortDate = (reminder) => {
  if (!reminder.date || reminder.date.toLowerCase() === "today") return 0;
  if (reminder.date.toLowerCase() === "tomorrow") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }
  const parsed = new Date(reminder.date);
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
};

const getReminderTime = (reminder) => {
  const match = typeof reminder.time === "string"
    ? reminder.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    : null;
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return hours * 60 + Number(match[2]);
};

const localDateKey = (value) => {
  if (!value || (typeof value === "string" && value.toLowerCase() === "today")) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }
  if (typeof value === "string" && value.toLowerCase() === "tomorrow") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const isMedicationCurrentlyActive = (medication) => {
  if (medication.status !== "Active") return false;
  const today = localDateKey();
  const start = localDateKey(medication.startDate);
  const end = localDateKey(medication.endDate);
  return (!medication.startDate || start) && (!medication.endDate || end)
    && (!start || start <= today) && (!end || end >= today);
};

const isReminderUpcoming = (reminder) => {
  if (reminder.completed) return false;
  const date = localDateKey(reminder.date);
  return Boolean(date && date >= localDateKey());
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [dashboardData, setDashboardData] = useState({
    vitals: EMPTY_RESOURCE,
    medications: EMPTY_RESOURCE,
    reminders: EMPTY_RESOURCE,
    records: EMPTY_RESOURCE
  });
  const [togglingReminderIds, setTogglingReminderIds] = useState([]);
  const [reminderActionError, setReminderActionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadDashboardData = async () => {
      const results = await Promise.allSettled([
        getVitals(),
        getMedications(),
        getReminders(),
        getRecords()
      ]);
      if (cancelled) return;

      const resourceNames = ["vitals", "medications", "reminders", "records"];
      const nextData = {};
      results.forEach((result, index) => {
        const name = resourceNames[index];
        const isValidResponse = result.status === "fulfilled"
          && result.value?.success
          && Array.isArray(result.value.data);
        nextData[name] = isValidResponse
          ? { status: "success", data: result.value.data }
          : { status: "error", data: [] };
      });
      setDashboardData(nextData);
    };

    const handleVitalsUpdated = () => {
      setRefreshKey((current) => current + 1);
    };

    loadDashboardData();
    window.addEventListener("vitals:updated", handleVitalsUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("vitals:updated", handleVitalsUpdated);
    };
  }, [refreshKey]);

  const vitals = dashboardData.vitals.data;
  const medications = dashboardData.medications.data;
  const reminders = dashboardData.reminders.data;
  const records = dashboardData.records.data;

  const activeMedications = useMemo(
    () => medications.filter(isMedicationCurrentlyActive),
    [medications]
  );

  const upcomingReminders = useMemo(
    () => reminders
      .filter(isReminderUpcoming)
      .sort((a, b) => {
        const dateDifference = getReminderSortDate(a) - getReminderSortDate(b);
        return dateDifference || getReminderTime(a) - getReminderTime(b);
      })
      .slice(0, 4),
    [reminders]
  );

  const recentRecords = useMemo(
    () => [...records]
      .sort((a, b) =>
        new Date(b.date || b.createdAt || 0).getTime()
        - new Date(a.date || a.createdAt || 0).getTime()
      )
      .slice(0, 4),
    [records]
  );

  const latestMetrics = useMemo(() => {
    const definitions = [
      { id: "weight", type: "Weight", name: "Weight", icon: "Scale" },
      { id: "heart-rate", type: "Heart Rate", name: "Heart Rate", icon: "Activity" },
      { id: "blood-pressure", type: "Blood Pressure", name: "Blood Pressure", icon: "Heart" },
      { id: "oxygen", type: "Oxygen Level", name: "SpO2", icon: "Wind" },
      { id: "blood-sugar", type: "Blood Sugar", name: "Blood Sugar", icon: "Droplet" },
      { id: "temperature", type: "Temperature", name: "Temperature", icon: "Thermometer" }
    ];

    return definitions.map((definition) => {
      const vital = getLatestVital(vitals, definition.type);
      return {
        ...definition,
        value: vital?.value || "",
        unit: vital?.unit || "",
        status: dashboardData.vitals.status === "error"
          ? "Unable to load"
          : vital?.status || "No data available",
        lastUpdated: formatUpdateTime(vital?.loggedAt || vital?.createdAt)
      };
    });
  }, [dashboardData.vitals.status, vitals]);

  const handleToggleReminder = useCallback(async (id) => {
    const reminder = reminders.find((item) => (item._id || item.id) === id);
    if (!reminder || togglingReminderIds.includes(id)) return;

    setReminderActionError("");
    setTogglingReminderIds((current) => [...current, id]);
    setDashboardData((current) => ({
      ...current,
      reminders: {
        ...current.reminders,
        data: current.reminders.data.map((item) =>
          (item._id || item.id) === id ? { ...item, completed: !item.completed } : item
        )
      }
    }));
    try {
      await toggleReminder(id);
    } catch {
      setDashboardData((current) => ({
        ...current,
        reminders: {
          ...current.reminders,
          data: current.reminders.data.map((item) =>
            (item._id || item.id) === id ? { ...item, completed: reminder.completed } : item
          )
        }
      }));
      setReminderActionError("Could not update that reminder. Please try again.");
    } finally {
      setTogglingReminderIds((current) => current.filter((itemId) => itemId !== id));
    }
  }, [reminders, togglingReminderIds]);

  const retryDashboardData = () => {
    setDashboardData((current) => Object.fromEntries(
      Object.entries(current).map(([name, resource]) => [
        name,
        resource.status === "error" ? { ...resource, status: "loading" } : resource
      ])
    ));
    setRefreshKey((current) => current + 1);
  };

  const name = user?.name?.trim();
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";
  const healthProfile = user?.healthProfile || {};
  const profileSummary = [
    { label: "Height", value: healthProfile.height || "Not added" },
    { label: "Weight", value: healthProfile.weight || "Not added" },
    { label: "Blood group", value: healthProfile.bloodGroup || "Not added" }
  ];

  const sectionError = (resourceName, label) => dashboardData[resourceName].status === "error" && (
    <div role="alert" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.85rem 1rem", borderRadius: "0.75rem", background: "var(--bg-card-alt)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
      Unable to load {label}.
      <Button variant="outline" size="sm" icon={RefreshCw} onClick={retryDashboardData}>Retry</Button>
    </div>
  );

  const vitalCard = (metric) => (
    <HealthCard
      key={metric.id}
      metric={metric}
      onClick={() => navigate("/monitoring")}
    />
  );

  return (
    <DashboardLayout>
      <section
        aria-labelledby="dashboard-heading"
        style={{
          background: "radial-gradient(circle at top left, rgba(22, 163, 74, 0.12), transparent 32%), linear-gradient(135deg, rgba(22, 163, 74, 0.07), rgba(5, 150, 105, 0.06))",
          border: "1px solid rgba(22, 163, 74, 0.18)",
          borderRadius: "1.4rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div>
          <p style={{ margin: "0 0 0.35rem", color: "#15803D", fontSize: "0.85rem", fontWeight: 700 }}>
            Your health overview
          </p>
          <h1 id="dashboard-heading" style={{ margin: 0, color: "var(--text-main)", fontSize: "clamp(1.4rem, 4vw, 1.9rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            {greeting}{name ? `, ${name}` : ""} 👋
          </h1>
          <p style={{ margin: "0.4rem 0 0", color: "var(--text-muted)", fontSize: "0.9375rem" }}>
            A quick look at your latest health information.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
          <Button variant="outline" size="md" icon={UserRound} onClick={() => navigate("/profile")}>View Profile</Button>
          <Button variant="primary" size="md" icon={Plus} onClick={() => navigate("/monitoring")}>Add Health Reading</Button>
        </div>
      </section>

      <div className="dashboard-overview-grid" style={{ gap: "1.25rem", marginBottom: "1.5rem" }}>
        <Card title="Profile Summary" subtitle="Your saved personal health details" icon={UserRound}
          headerAction={<Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>View Profile <ArrowRight size={14} /></Button>}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", alignItems: "center" }}>
            <div aria-hidden="true" style={{ width: "3.4rem", height: "3.4rem", display: "grid", placeItems: "center", flexShrink: 0, borderRadius: "50%", background: "linear-gradient(135deg, #DCFCE7, #A7F3D0)", color: "#166534", fontWeight: 800, fontSize: "1.1rem" }}>
              {name ? name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") : "?"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "var(--text-main)", fontWeight: 750, fontSize: "1.05rem", overflowWrap: "anywhere" }}>{name || "Name not available"}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", overflowWrap: "anywhere" }}>{user?.email || "Account email not available"}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.8rem", marginTop: "1.25rem" }}>
            {profileSummary.map((item) => (
              <div key={item.label} style={{ minWidth: 0, padding: "0.8rem", borderRadius: "0.75rem", background: "var(--bg-card-alt)" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>{item.label}</div>
                <div style={{ color: "var(--text-main)", fontWeight: 700, fontSize: "0.92rem", marginTop: "0.15rem", overflowWrap: "anywhere" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Quick Links" subtitle="Shortcuts to your health tools" icon={Activity}>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {[
              { label: "Log a health reading", route: "/monitoring", icon: Plus },
              { label: "Manage medications", route: "/medications", icon: Pill },
              { label: "View reminders", route: "/reminders", icon: Bell },
              { label: "View health records", route: "/records", icon: FileText },
              { label: "Open AI Assistant", route: "/assistant", icon: Bot }
            ].map(({ label, route, icon: Icon }) => (
              <button
                key={route}
                type="button"
                onClick={() => navigate(route)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", width: "100%", padding: "0.7rem 0.8rem", borderRadius: "0.7rem", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", font: "inherit", fontSize: "0.86rem", fontWeight: 650, textAlign: "left", cursor: "pointer" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}><Icon size={17} color="#16A34A" />{label}</span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      <section aria-labelledby="health-overview-heading" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.9rem" }}>
          <div>
            <h2 id="health-overview-heading" style={{ margin: 0, color: "var(--text-main)", fontSize: "1.15rem", fontWeight: 750 }}>Health Overview</h2>
            <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Latest recorded readings</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/monitoring")}>All readings <ArrowRight size={14} /></Button>
        </div>
        {sectionError("vitals", "vital readings")}
        {dashboardData.vitals.status === "loading" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" }}>
            {["Weight", "Heart Rate", "Blood Pressure", "SpO2"].map((label) => (
              <Card key={label} padding="1.1rem"><div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{label}</div><div role="status" style={{ marginTop: "0.65rem", color: "var(--text-muted)" }}>Loading...</div></Card>
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" }}>
              {latestMetrics.slice(0, 4).map(vitalCard)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
              {latestMetrics.slice(4).map(vitalCard)}
            </div>
          </>
        )}
      </section>

      <div className="dashboard-overview-grid" style={{ gap: "1.25rem", marginBottom: "1.5rem" }}>
        <Card title="Current Medications" subtitle="Your active medications" icon={Pill}
          headerAction={<Button variant="ghost" size="sm" onClick={() => navigate("/medications")}>View all <ArrowRight size={14} /></Button>}
        >
          {dashboardData.medications.status === "loading" ? (
            <div role="status" style={{ color: "var(--text-muted)", padding: "0.5rem 0" }}>Loading medications...</div>
          ) : dashboardData.medications.status === "error" ? sectionError("medications", "medications") : activeMedications.length ? (
            <div style={{ display: "grid", gap: "0.7rem" }}>
              {activeMedications.slice(0, 4).map((medication) => (
                <div key={medication._id || medication.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", padding: "0.75rem", border: "1px solid var(--border-color)", borderRadius: "0.75rem", minWidth: 0 }}>
                  <div aria-hidden="true" style={{ width: "2rem", height: "2rem", flexShrink: 0, borderRadius: "0.6rem", display: "grid", placeItems: "center", color: "#15803D", background: "#DCFCE7" }}><Pill size={16} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "var(--text-main)", fontWeight: 700, overflowWrap: "anywhere" }}>{medication.name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", overflowWrap: "anywhere" }}>
                      {[medication.dosage, medication.frequency, medication.timing].filter(Boolean).join(" · ") || "Schedule not added"}
                    </div>
                  </div>
                </div>
              ))}
              {activeMedications.length > 4 && <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>And {activeMedications.length - 4} more active medications</div>}
            </div>
          ) : (
            <EmptyState icon={Pill} title="No active medications." description="Active prescriptions will appear here." actionLabel="View Medications" onAction={() => navigate("/medications")} />
          )}
        </Card>

        <Card title="Today's & Upcoming Reminders" subtitle="Pending scheduled health tasks" icon={Bell}
          headerAction={<Button variant="ghost" size="sm" onClick={() => navigate("/reminders")}>View all <ArrowRight size={14} /></Button>}
        >
          {dashboardData.reminders.status === "loading" ? (
            <div role="status" style={{ color: "var(--text-muted)", padding: "0.5rem 0" }}>Loading reminders...</div>
          ) : dashboardData.reminders.status === "error" ? sectionError("reminders", "reminders") : upcomingReminders.length ? (
            <div style={{ display: "grid", gap: "0.65rem" }}>
              {reminderActionError && <div role="alert" style={{ color: "#B91C1C", fontSize: "0.82rem" }}>{reminderActionError}</div>}
              {upcomingReminders.map((reminder) => {
                const id = reminder._id || reminder.id;
                return (
                  <div key={id}>
                    <ReminderCard
                      reminder={{ ...reminder, id }}
                      onToggleComplete={handleToggleReminder}
                    />
                    {reminder.date && reminder.date !== "Today" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", margin: "0.3rem 0 0 3.2rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        <Calendar size={12} />{formatDate(reminder.date) || reminder.date}
                      </div>
                    )}
                    {togglingReminderIds.includes(id) && <span role="status" style={{ display: "block", marginLeft: "3.2rem", color: "var(--text-muted)", fontSize: "0.72rem" }}>Updating...</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Clock3} title="No reminders for today." description="Pending reminders will appear here." actionLabel="View Reminders" onAction={() => navigate("/reminders")} />
          )}
        </Card>
      </div>

      <Card title="Recent Health Records" subtitle="Your latest saved health records" icon={FileText}
        headerAction={<Button variant="ghost" size="sm" onClick={() => navigate("/records")}>View all records <ArrowRight size={14} /></Button>}
      >
        {dashboardData.records.status === "loading" ? (
          <div role="status" style={{ color: "var(--text-muted)", padding: "0.5rem 0" }}>Loading health records...</div>
        ) : dashboardData.records.status === "error" ? sectionError("records", "health records") : recentRecords.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {recentRecords.map((record) => (
              <div key={record._id || record.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", padding: "0.85rem", border: "1px solid var(--border-color)", borderRadius: "0.75rem", minWidth: 0 }}>
                <div aria-hidden="true" style={{ width: "2rem", height: "2rem", flexShrink: 0, borderRadius: "0.6rem", display: "grid", placeItems: "center", color: "#047857", background: "#D1FAE5" }}><FileText size={16} /></div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "var(--text-main)", fontWeight: 700, overflowWrap: "anywhere" }}>{record.title}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{record.category || "Health record"}</div>
                  {record.date && <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.25rem", color: "var(--text-subtle)", fontSize: "0.75rem" }}><Calendar size={12} />{formatDate(record.date)}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={FileText} title="No health records yet." description="Your saved health records will appear here." actionLabel="View Health Records" onAction={() => navigate("/records")} />
        )}
      </Card>
    </DashboardLayout>
  );
};

export default Dashboard;
