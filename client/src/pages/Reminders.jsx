import { useState, useEffect } from "react";
import { Bell, Plus, Calendar, Clock, CheckCircle2 } from "lucide-react";
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
  toggleReminder,
  deleteReminder
} from "../api/api";

const categories = ["All", "Medication", "Appointment", "Vitals Check", "Lab Test", "General"];

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("Today");
  const [time, setTime] = useState("09:00 AM");
  const [category, setCategory] = useState("Medication");
  const [repeat, setRepeat] = useState("Daily");
  const [notes, setNotes] = useState("");

  const fetchRemindersList = async () => {
    try {
      setLoading(true);
      const res = await getReminders();
      if (res.success) {
        setReminders(res.data);
      }
    } catch (err) {
      console.error("Failed to load reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemindersList();
  }, []);

  const handleToggleComplete = async (id) => {
    try {
      // Optimistic update
      setReminders((prev) =>
        prev.map((r) => ((r._id === id || r.id === id) ? { ...r, completed: !r.completed } : r))
      );
      await toggleReminder(id);
      setToastMessage("Reminder status updated.");
    } catch (err) {
      setToastMessage(`Error toggling reminder: ${err.message}`);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => (r._id !== id && r.id !== id)));
      setToastMessage("Reminder deleted.");
    } catch (err) {
      setToastMessage(`Error deleting reminder: ${err.message}`);
    }
  };

  const handleSaveReminder = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await createReminder({
        title,
        date,
        time,
        category,
        repeat,
        notes
      });
      if (res.success) {
        setReminders((prev) => [res.data, ...prev]);
        setToastMessage(`Reminder "${title}" saved to MongoDB!`);
      }

      setAddModalOpen(false);
      setEditingReminder(null);
      setTitle("");
      setNotes("");
    } catch (err) {
      setToastMessage(`Error saving reminder: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReminders = reminders.filter(
    (r) => selectedCategory === "All" || r.category === selectedCategory
  );

  const todayList = filteredReminders.filter((r) => (r.date === "Today" || !r.date) && !r.completed);
  const upcomingList = filteredReminders.filter((r) => r.date !== "Today" && r.date && !r.completed);
  const completedList = filteredReminders.filter((r) => r.completed);

  return (
    <DashboardLayout>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} type="success" />

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
          onClick={() => {
            setEditingReminder(null);
            setTitle("");
            setNotes("");
            setAddModalOpen(true);
          }}
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
              border: selectedCategory === cat ? "1px solid #0284c7" : "1px solid var(--border-color)",
              backgroundColor: selectedCategory === cat ? "rgba(2, 132, 199, 0.12)" : "var(--bg-card)",
              color: selectedCategory === cat ? "#0284c7" : "var(--text-muted)",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "3rem", display: "flex", justifyContent: "center" }}>
          <LoadingSpinner size="lg" text="Loading health reminders..." />
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
                      id: rem._id || rem.id
                    }}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteReminder}
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
                      id: rem._id || rem.id
                    }}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteReminder}
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

          {/* Completed History */}
          {completedList.length > 0 && (
            <Card title="Completed History" subtitle="Tasks completed recently" icon={CheckCircle2}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {completedList.map((rem) => (
                  <ReminderCard
                    key={rem._id || rem.id}
                    reminder={{
                      ...rem,
                      id: rem._id || rem.id
                    }}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteReminder}
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
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
              type="text"
              placeholder="e.g. 08:00 AM"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input
              label="Date / Day"
              type="text"
              placeholder="e.g. Today, Tomorrow, Oct 15"
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
