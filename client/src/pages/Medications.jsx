import { useState } from "react";
import { Pill, Plus, Clock, CheckCircle2, Sun, Sunset, Moon, Sunrise } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import MedicationCard from "../components/cards/MedicationCard";
import EmptyState from "../components/common/EmptyState";
import Toast from "../components/common/Toast";

import { initialMedications } from "../data/mockData";

const MedicationScheduleTimeline = ({ medications, onToggleTaken }) => {
  const timeSlots = [
    { key: "Morning", title: "Morning (6 AM - 12 PM)", icon: Sunrise, color: "#f59e0b" },
    { key: "Afternoon", title: "Afternoon (12 PM - 5 PM)", icon: Sun, color: "#0284c7" },
    { key: "Evening", title: "Evening (5 PM - 9 PM)", icon: Sunset, color: "#0d9488" },
    { key: "Night", title: "Night (9 PM - 12 AM)", icon: Moon, color: "#6366f1" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {timeSlots.map((slot) => {
        const SlotIcon = slot.icon;
        const matchingMeds = medications.filter(
          (m) => m.status === "Active" && m.timing && m.timing.includes(slot.key)
        );

        if (matchingMeds.length === 0) return null;

        return (
          <div
            key={slot.key}
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border-color)",
              borderRadius: "1rem",
              padding: "1.1rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
              <SlotIcon size={18} color={slot.color} />
              <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                {slot.title}
              </h4>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {matchingMeds.map((med) => (
                <div
                  key={med.id}
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <Pill size={18} color="#0284c7" />
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-main)" }}>
                        {med.name} <span style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: "600" }}>({med.dosage})</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {med.instructions || med.frequency}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleTaken(med.id)}
                    style={{
                      padding: "0.3rem 0.65rem",
                      borderRadius: "0.5rem",
                      border: med.takenToday ? "1px solid #10b981" : "1px solid var(--border-color)",
                      backgroundColor: med.takenToday ? "rgba(16, 185, 129, 0.12)" : "var(--bg-main)",
                      color: med.takenToday ? "#10b981" : "var(--text-muted)",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <CheckCircle2 size={14} />
                    {med.takenToday ? "Taken" : "Mark Taken"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Medications = () => {
  const [medications, setMedications] = useState(initialMedications);
  const [activeTab, setActiveTab] = useState("active");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Form state
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("Ongoing");
  const [instructions, setInstructions] = useState("");
  const [selectedTimings, setSelectedTimings] = useState(["Morning"]);

  const handleToggleTaken = (id) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, takenToday: !m.takenToday } : m))
    );
    setToastMessage("Medication status updated.");
  };

  const handleDeleteMedication = (id) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    setToastMessage("Medication deleted.");
  };

  const handleTimingToggle = (time) => {
    if (selectedTimings.includes(time)) {
      setSelectedTimings(selectedTimings.filter((t) => t !== time));
    } else {
      setSelectedTimings([...selectedTimings, time]);
    }
  };

  const handleSaveMedication = (e) => {
    e.preventDefault();
    if (!medName.trim()) return;

    if (editingMed) {
      setMedications((prev) =>
        prev.map((m) =>
          m.id === editingMed.id
            ? {
                ...m,
                name: medName,
                dosage,
                frequency,
                startDate,
                endDate,
                instructions,
                timing: selectedTimings
              }
            : m
        )
      );
      setToastMessage(`Medication "${medName}" updated.`);
    } else {
      const newMed = {
        id: "med_" + Date.now(),
        name: medName,
        dosage,
        frequency,
        timing: selectedTimings,
        startDate,
        endDate,
        instructions,
        status: "Active",
        prescribedBy: "Dr. Medical Specialist",
        takenToday: false
      };
      setMedications((prev) => [newMed, ...prev]);
      setToastMessage(`Medication "${medName}" added to active schedule!`);
    }

    setAddModalOpen(false);
    setEditingMed(null);
    setMedName("");
    setDosage("");
    setInstructions("");
  };

  const openEditModal = (med) => {
    setEditingMed(med);
    setMedName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setStartDate(med.startDate);
    setEndDate(med.endDate);
    setInstructions(med.instructions || "");
    setSelectedTimings(med.timing || ["Morning"]);
    setAddModalOpen(true);
  };

  const filteredMeds = medications.filter((m) =>
    activeTab === "active" ? m.status === "Active" : m.status === "Completed"
  );

  return (
    <DashboardLayout>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} type="success" />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
            Medication Tracker
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Track active prescription schedules, dosages, and daily consumption logs
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => {
            setEditingMed(null);
            setMedName("");
            setDosage("");
            setInstructions("");
            setAddModalOpen(true);
          }}
        >
          Add Medication
        </Button>
      </div>

      {/* Grid Layout: Left Schedule Timeline, Right Medications Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.75rem" }} className="lg:grid-cols-3">
        {/* Left Column (2 Spans): Active & Completed Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} className="lg:col-span-2">
          {/* Tabs Header */}
          <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
            <button
              onClick={() => setActiveTab("active")}
              style={{
                padding: "0.5rem 1.1rem",
                borderRadius: "0.65rem",
                fontSize: "0.9rem",
                fontWeight: "700",
                border: "none",
                backgroundColor: activeTab === "active" ? "#0284c7" : "transparent",
                color: activeTab === "active" ? "#ffffff" : "var(--text-muted)",
                cursor: "pointer"
              }}
            >
              Active Medications ({medications.filter((m) => m.status === "Active").length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              style={{
                padding: "0.5rem 1.1rem",
                borderRadius: "0.65rem",
                fontSize: "0.9rem",
                fontWeight: "700",
                border: "none",
                backgroundColor: activeTab === "completed" ? "#0284c7" : "transparent",
                color: activeTab === "completed" ? "#ffffff" : "var(--text-muted)",
                cursor: "pointer"
              }}
            >
              Past / Completed ({medications.filter((m) => m.status === "Completed").length})
            </button>
          </div>

          {filteredMeds.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              {filteredMeds.map((med) => (
                <MedicationCard
                  key={med.id}
                  medication={med}
                  onToggleTaken={handleToggleTaken}
                  onEdit={openEditModal}
                  onDelete={handleDeleteMedication}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Pill}
              title={`No ${activeTab} medications`}
              description="Keep your prescription list updated for accurate reminders."
              actionLabel="Add Medication"
              onAction={() => setAddModalOpen(true)}
            />
          )}
        </div>

        {/* Right Column (1 Span): Today's Schedule Timeline */}
        <div>
          <Card title="Daily Dose Timeline" subtitle="Today's scheduled medication slots" icon={Clock}>
            <MedicationScheduleTimeline
              medications={medications}
              onToggleTaken={handleToggleTaken}
            />
          </Card>
        </div>
      </div>

      {/* Add / Edit Medication Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={editingMed ? "Edit Medication" : "Add New Medication"}
        subtitle="Specify prescription details and schedule timings."
      >
        <form onSubmit={handleSaveMedication} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <Input
            label="Medicine Name"
            placeholder="e.g. Vitamin D3, Amoxicillin"
            value={medName}
            onChange={(e) => setMedName(e.target.value)}
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input
              label="Dosage"
              placeholder="e.g. 500 mg, 1 capsule"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              required
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
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
                <option value="Once daily">Once daily</option>
                <option value="Twice daily">Twice daily</option>
                <option value="Three times daily">Three times daily</option>
                <option value="As needed (PRN)">As needed (PRN)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date / Duration"
              placeholder="e.g. Ongoing, 2026-12-31"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Timing Pills Selection */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Schedule Timings</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {["Morning", "Afternoon", "Evening", "Night"].map((time) => {
                const selected = selectedTimings.includes(time);
                return (
                  <button
                    type="button"
                    key={time}
                    onClick={() => handleTimingToggle(time)}
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: "0.6rem",
                      fontSize: "0.8125rem",
                      fontWeight: "600",
                      border: selected ? "1px solid #0284c7" : "1px solid var(--border-color)",
                      backgroundColor: selected ? "rgba(2, 132, 199, 0.12)" : "var(--bg-main)",
                      color: selected ? "#0284c7" : "var(--text-muted)",
                      cursor: "pointer"
                    }}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Special Instructions</label>
            <textarea
              rows={2}
              placeholder="e.g. Take with breakfast or plenty of water..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
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
              {editingMed ? "Save Changes" : "Add Medication"}
            </Button>
          </div>
        </form>
      </Modal>

      <style>{`
        @media (min-width: 1024px) {
          .lg\\:grid-cols-3 { grid-template-columns: 2fr 1fr !important; }
          .lg\\:col-span-2 { grid-column: span 2 / span 2 !important; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default Medications;
