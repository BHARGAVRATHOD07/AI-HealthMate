import { useState, useEffect } from "react";
import { Plus, Calendar, Clock, CheckCircle2 } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import ReminderCard from "../components/cards/ReminderCard";
import EmptyState from "../components/common/EmptyState";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";

import {
  getReminders,
  createReminder,
  updateReminder,
  toggleReminder,
  deleteReminder
} from "../api/api";

const categories = ["All", "Medication", "Appointment", "Vitals Check", "Lab Test", "General"];
const dateFilters = ["All dates", "Today", "Upcoming", "Past"];

const toDateInput = (date) => {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const resolved = new Date();
  if (typeof date === "string" && date.toLowerCase() === "tomorrow") {
    resolved.setDate(resolved.getDate() + 1);
  } else if (date && date.toLowerCase() !== "today") {
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  }
  return `${resolved.getFullYear()}-${String(resolved.getMonth() + 1).padStart(2, "0")}-${String(resolved.getDate()).padStart(2, "0")}`;
};

const getReminderDateKey = (reminder) => {
  const value = reminder.date;
  if (!value || (typeof value === "string" && value.toLowerCase() === "today")) return toDateInput();
  if (typeof value === "string" && value.toLowerCase() === "tomorrow") return toDateInput("Tomorrow");
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
};

const getTimeInput = (value) => {
  const match = typeof value === "string" && value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "09:00";
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
};

const getReminderMinutes = (value) => {
  const match = typeof value === "string" && value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return hour * 60 + Number(match[2]);
};

const formatReminderDate = (date) => {
  const dateKey = getReminderDateKey({ date });
  if (!dateKey) return date || "Date needs review";
  const parsed = new Date(`${dateKey}T00:00:00`);
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState("All dates");
  const [pendingActionIds, setPendingActionIds] = useState([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(toDateInput());
  const [time, setTime] = useState("09:00");
  const [category, setCategory] = useState("Medication");
  const [repeat, setRepeat] = useState("Daily");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;

    getReminders()
      .then((res) => {
        if (!res.success || !Array.isArray(res.data)) {
          throw new Error(res.message || "Reminder response was invalid.");
        }
        if (!cancelled) {
          setReminders(res.data);
          setLoadError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message || "Could not load reminders.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const retryLoadReminders = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getReminders();
      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(res.message || "Reminder response was invalid.");
      }
      setReminders(res.data);
    } catch (err) {
      setLoadError(err.message || "Could not load reminders.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (id) => {
    if (pendingActionIds.includes(id)) return;
    const reminder = reminders.find((item) => (item._id || item.id) === id);
    if (!reminder) return;
    setPendingActionIds((current) => [...current, id]);
    try {
      const res = await toggleReminder(id, !reminder.completed);
      setReminders((prev) => prev.map((item) =>
        (item._id === id || item.id === id) ? res.data : item
      ));
      setToastMessage("Reminder status updated.");
      setToastType("success");
    } catch (err) {
      setToastMessage(`Error toggling reminder: ${err.message}`);
      setToastType("error");
    } finally {
      setPendingActionIds((current) => current.filter((itemId) => itemId !== id));
    }
  };

  const handleDeleteReminder = async (id) => {
    if (pendingActionIds.includes(id)) return;
    setPendingActionIds((current) => [...current, id]);
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => (r._id !== id && r.id !== id)));
      setToastMessage("Reminder deleted.");
      setToastType("success");
    } catch (err) {
      setToastMessage(`Error deleting reminder: ${err.message}`);
      setToastType("error");
    } finally {
      setPendingActionIds((current) => current.filter((itemId) => itemId !== id));
    }
  };

  const handleSaveReminder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { title: title.trim(), date, time, category, repeat, notes: notes.trim() };
      const res = editingReminder
        ? await updateReminder(editingReminder._id || editingReminder.id, payload)
        : await createReminder(payload);
      if (res.success) {
        setReminders((prev) => editingReminder
          ? prev.map((item) => (item._id === res.data._id || item.id === res.data._id) ? res.data : item)
          : [res.data, ...prev]);
        setToastMessage(editingReminder ? `Reminder "${title}" updated.` : `Reminder "${title}" added.`);
        setToastType("success");
      }

      setAddModalOpen(false);
      setEditingReminder(null);
      setTitle("");
      setNotes("");
      setDate(toDateInput());
      setTime("09:00");
      setCategory("Medication");
      setRepeat("Daily");
    } catch (err) {
      setToastMessage(`Error saving reminder: ${err.message}`);
      setToastType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReminders = reminders.filter(
    (r) => selectedCategory === "All" || r.category === selectedCategory
  );

  const today = toDateInput();
  const dateMatchesFilter = (reminder) => {
    if (selectedDateFilter === "All dates") return true;
    const dateKey = getReminderDateKey(reminder);
    if (!dateKey) return selectedDateFilter === "Past";
    if (selectedDateFilter === "Today") return dateKey === today;
    if (selectedDateFilter === "Upcoming") return dateKey > today;
    return dateKey < today;
  };
  const sortReminders = (left, right) => {
    const leftDate = getReminderDateKey(left) || "";
    const rightDate = getReminderDateKey(right) || "";
    return leftDate.localeCompare(rightDate) || getReminderMinutes(left.time) - getReminderMinutes(right.time);
  };
  const todayList = filteredReminders.filter((r) => !r.completed && getReminderDateKey(r) === today && dateMatchesFilter(r)).sort(sortReminders);
  const upcomingList = filteredReminders.filter((r) => !r.completed && getReminderDateKey(r) > today && dateMatchesFilter(r)).sort(sortReminders);
  const pastList = filteredReminders.filter((r) => !r.completed && (!getReminderDateKey(r) || getReminderDateKey(r) < today) && dateMatchesFilter(r)).sort(sortReminders);
  const completedList = filteredReminders.filter((r) => r.completed && dateMatchesFilter(r)).sort(sortReminders);

  const openAddModal = () => {
    setEditingReminder(null);
    setTitle("");
    setDate(toDateInput());
    setTime("09:00");
    setCategory("Medication");
    setRepeat("Daily");
    setNotes("");
    setAddModalOpen(true);
  };

  const openEditModal = (reminder) => {
    setEditingReminder(reminder);
    setTitle(reminder.title || "");
    setDate(toDateInput(reminder.date));
    setTime(getTimeInput(reminder.time));
    setCategory(reminder.category || "General");
    setRepeat(reminder.repeat || "Once");
    setNotes(reminder.notes || "");
    setAddModalOpen(true);
  };

  return (
    <DashboardLayout>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} type={toastType} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
            Health Reminders
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Schedule and manage daily medication alerts, doctor checkups, and wellness routines
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={openAddModal}
        >
          Add Reminder
        </Button>
      </div>

      {/* Category Filters */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "0.75rem",
              fontSize: "0.85rem",
              fontWeight: "600",
              border: selectedCategory === cat ? "1px solid #16A34A" : "1px solid var(--border-color)",
              backgroundColor: selectedCategory === cat ? "rgba(22, 163, 74, 0.12)" : "var(--bg-card)",
              color: selectedCategory === cat ? "#16A34A" : "var(--text-muted)",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <label htmlFor="reminder-date-filter" style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600 }}>Date range</label>
        <select
          id="reminder-date-filter"
          value={selectedDateFilter}
          onChange={(e) => setSelectedDateFilter(e.target.value)}
          style={{ padding: "0.5rem 0.75rem", borderRadius: "0.65rem", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-card)", color: "var(--text-main)" }}
        >
          {dateFilters.map((filter) => <option key={filter} value={filter}>{filter}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", display: "flex", justifyContent: "center" }}>
          <LoadingSpinner size="lg" text="Loading health reminders..." />
        </div>
      ) : loadError ? (
        <div role="alert" style={{ padding: "2rem", textAlign: "center", color: "var(--text-main)" }}>
          <p style={{ color: "#b91c1c" }}>Could not load reminders: {loadError}</p>
          <Button variant="outline" size="md" onClick={retryLoadReminders}>Try again</Button>
        </div>
      ) : (
        /* Reminders Sections */
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Today's Tasks */}
          <Card title="Today's Pending Tasks" subtitle="Items scheduled for today" icon={Clock}>
            {todayList.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {todayList.map((rem) => (
                  <ReminderCard
                    key={rem._id || rem.id}
                    reminder={{
                      ...rem,
                      id: rem._id || rem.id,
                      displayDate: formatReminderDate(rem.date)
                    }}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteReminder}
                    onEdit={openEditModal}
                    disabled={pendingActionIds.includes(rem._id || rem.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="No pending tasks for today"
                description="You are all caught up on your scheduled health routines."
              />
            )}
          </Card>

          {/* Upcoming Schedule */}
          <Card title="Upcoming Reminders" subtitle="Future appointments and tests" icon={Calendar}>
            {upcomingList.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {upcomingList.map((rem) => (
                  <ReminderCard
                    key={rem._id || rem.id}
                    reminder={{
                      ...rem,
                      id: rem._id || rem.id,
                      displayDate: formatReminderDate(rem.date)
                    }}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteReminder}
                    onEdit={openEditModal}
                    disabled={pendingActionIds.includes(rem._id || rem.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No upcoming reminders"
                description="Add new tasks to get notified for upcoming checkups."
              />
            )}
          </Card>

          {/* Past / Overdue */}
          <Card title="Past / Overdue" subtitle="Pending reminders with a date that has passed" icon={Calendar}>
            {pastList.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {pastList.map((rem) => (
                  <ReminderCard
                    key={rem._id || rem.id}
                    reminder={{ ...rem, id: rem._id || rem.id, displayDate: formatReminderDate(rem.date) }}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteReminder}
                    onEdit={openEditModal}
                    disabled={pendingActionIds.includes(rem._id || rem.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon={CheckCircle2} title="No past-due reminders" description="Pending reminders with earlier dates will be listed here." />
            )}
          </Card>

          {/* Completed History */}
          {completedList.length > 0 && (
            <Card title="Completed History" subtitle="Tasks completed recently" icon={CheckCircle2}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {completedList.map((rem) => (
                  <ReminderCard
                    key={rem._id || rem.id}
                    reminder={{
                      ...rem,
                      id: rem._id || rem.id,
                      displayDate: formatReminderDate(rem.date)
                    }}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteReminder}
                    onEdit={openEditModal}
                    disabled={pendingActionIds.includes(rem._id || rem.id)}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Add / Edit Reminder Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={editingReminder ? "Edit Reminder" : "Create New Reminder"}
        subtitle="Set up alerts for medications, lab tests, or doctor appointments"
      >
        <form onSubmit={handleSaveReminder} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <Input
            label="Reminder Title"
            placeholder="e.g. Take Morning Lisinopril, Blood Sugar Check"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="modal-form-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  fontSize: "0.9rem",
                  borderRadius: "0.65rem",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-main)",
                  color: "var(--text-main)",
                  outline: "none"
                }}
              >
                <option value="Medication">Medication</option>
                <option value="Appointment">Appointment</option>
                <option value="Vitals Check">Vitals Check</option>
                <option value="Lab Test">Lab Test</option>
                <option value="General">General</option>
              </select>
            </div>

            <Input
              label="Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="modal-form-grid">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Repeat Schedule</label>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  fontSize: "0.9rem",
                  borderRadius: "0.65rem",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-main)",
                  color: "var(--text-main)",
                  outline: "none"
                }}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Once">Once</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Notes / Instructions (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Take with full glass of water..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              style={{
                width: "100%",
                padding: "0.65rem 0.9rem",
                fontSize: "0.9rem",
                borderRadius: "0.65rem",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-main)",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Button variant="outline" size="md" onClick={() => setAddModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={submitting}>
              {submitting ? "Saving..." : editingReminder ? "Update Reminder" : "Save Reminder"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Reminders;
