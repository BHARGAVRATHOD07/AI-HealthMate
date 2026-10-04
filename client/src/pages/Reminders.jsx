import { useState } from "react";
import { Bell, Plus, Calendar, Clock, CheckCircle2 } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import ReminderCard from "../components/cards/ReminderCard";
import EmptyState from "../components/common/EmptyState";
import Toast from "../components/common/Toast";

import { initialReminders } from "../data/mockData";

const categories = ["All", "Medication", "Checkup", "Hydration", "Exercise"];

const Reminders = () => {
  const [reminders, setReminders] = useState(initialReminders);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("Today");
  const [time, setTime] = useState("09:00 AM");
  const [category, setCategory] = useState("Medication");
  const [repeat, setRepeat] = useState("Daily");
  const [notes, setNotes] = useState("");

  const handleToggleComplete = (id) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
    setToastMessage("Reminder status updated.");
  };

  const handleDeleteReminder = (id) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    setToastMessage("Reminder deleted.");
  };

  const handleSaveReminder = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingReminder) {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === editingReminder.id
            ? { ...r, title, date, time, category, repeat, notes }
            : r
        )
      );
      setToastMessage(`Reminder "${title}" updated.`);
    } else {
      const newRem = {
        id: "rem_" + Date.now(),
        title,
        date,
        time,
        category,
        repeat,
        notes,
        completed: false
      };
      setReminders((prev) => [newRem, ...prev]);
      setToastMessage(`Reminder "${title}" added.`);
    }

    setAddModalOpen(false);
    setEditingReminder(null);
    setTitle("");
    setNotes("");
  };

  const filteredReminders = reminders.filter(
    (r) => selectedCategory === "All" || r.category === selectedCategory
  );

  const todayList = filteredReminders.filter((r) => r.date === "Today" && !r.completed);
  const upcomingList = filteredReminders.filter((r) => r.date !== "Today" && !r.completed);
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

      {/* Category Filter Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.75rem" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "0.4rem 0.95rem",
              borderRadius: "9999px",
              fontSize: "0.85rem",
              fontWeight: "600",
              border: selectedCategory === cat ? "1px solid #0284c7" : "1px solid var(--border-color)",
              backgroundColor: selectedCategory === cat ? "rgba(2, 132, 199, 0.12)" : "var(--bg-card)",
              color: selectedCategory === cat ? "#0284c7" : "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Reminder Columns Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {/* Today's Reminders */}
        <Card title="Today's Reminders" subtitle={`${todayList.length} scheduled for today`} icon={Clock}>
          {todayList.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {todayList.map((rem) => (
                <ReminderCard
                  key={rem.id}
                  reminder={rem}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteReminder}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Bell} title="All clear for today!" description="No pending reminders scheduled for today." />
          )}
        </Card>

        {/* Upcoming Reminders */}
        <Card title="Upcoming Reminders" subtitle="Scheduled for future dates" icon={Calendar}>
          {upcomingList.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {upcomingList.map((rem) => (
                <ReminderCard
                  key={rem.id}
                  reminder={rem}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteReminder}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Calendar} title="No upcoming reminders" description="Future reminders will appear here." />
          )}
        </Card>

        {/* Completed Reminders */}
        <Card title="Completed Tasks" subtitle="Recently completed activities" icon={CheckCircle2}>
          {completedList.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {completedList.map((rem) => (
                <ReminderCard
                  key={rem.id}
                  reminder={rem}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteReminder}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCircle2} title="No completed tasks" description="Completed reminders will log here." />
          )}
        </Card>
      </div>

      {/* Add / Edit Reminder Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={editingReminder ? "Edit Reminder" : "Schedule New Reminder"}
        subtitle="Set timing and frequency for your health task."
      >
        <form onSubmit={handleSaveReminder} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <Input
            label="Reminder Title"
            placeholder="e.g. Drink 500ml Water, Take Vitamin D3"
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
                {categories.filter((c) => c !== "All").map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Repeat Frequency</label>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input
              label="Date"
              placeholder="e.g. Today, Tomorrow, 2026-10-05"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              label="Time"
              placeholder="e.g. 09:00 AM"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Notes / Instructions</label>
            <textarea
              rows={2}
              placeholder="e.g. Take with food or rest 5 mins prior..."
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
                outline: "none",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Button variant="outline" size="md" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Reminder
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Reminders;
