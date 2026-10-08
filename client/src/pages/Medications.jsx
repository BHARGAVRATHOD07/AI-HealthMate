import { useState, useEffect } from "react";
import { Pill, Plus, Clock, CheckCircle2, Sun, Sunset, Moon, Sunrise } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import MedicationCard from "../components/cards/MedicationCard";
import EmptyState from "../components/common/EmptyState";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";

import {
  getMedications,
  createMedication,
  updateMedication,
  setMedicationTaken,
  deleteMedication
} from "../api/api";

const withTakenToday = (medication) => ({
  ...medication,
  takenToday: medication.lastTakenAt
    ? new Date(medication.lastTakenAt).toDateString() === new Date().toDateString()
    : false
});

const getTodayDateInput = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const toDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getMedicationDateKey = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const isMedicationCurrentlyActive = (medication) => {
  if (medication.status !== "Active") return false;
  const today = getTodayDateInput();
  const start = getMedicationDateKey(medication.startDate);
  const end = getMedicationDateKey(medication.endDate);
  if ((medication.startDate && !start) || (medication.endDate && !end)) return false;
  return (!start || start <= today) && (!end || end >= today);
};

const hasScheduledTimeSlot = (medication, timeSlots) => timeSlots.some(({ key }) =>
  typeof medication.timing === "string" && medication.timing.toLowerCase().includes(key.toLowerCase())
);

const getMedicationDisplayStatus = (medication) => {
  if (isMedicationCurrentlyActive(medication)) return "Active";
  if (medication.status !== "Active") return medication.status;
  const today = getTodayDateInput();
  const end = getMedicationDateKey(medication.endDate);
  if (end && end < today) return "Expired";
  const start = getMedicationDateKey(medication.startDate);
  if (start && start > today) return "Scheduled";
  return "Needs dates";
};

const MedicationScheduleTimeline = ({ medications, onToggleTaken }) => {
  const timeSlots = [
    { key: "Morning", title: "Morning (6 AM - 12 PM)", icon: Sunrise, color: "#f59e0b" },
    { key: "Afternoon", title: "Afternoon (12 PM - 5 PM)", icon: Sun, color: "#16A34A" },
    { key: "Evening", title: "Evening (5 PM - 9 PM)", icon: Sunset, color: "#059669" },
    { key: "Night", title: "Night (9 PM - 12 AM)", icon: Moon, color: "#6366f1" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {timeSlots.map((slot) => {
        const SlotIcon = slot.icon;
        const matchingMeds = medications.filter(
          (m) =>
            m.status === "Active" &&
            (typeof m.timing === "string"
              ? m.timing.toLowerCase().includes(slot.key.toLowerCase())
              : Array.isArray(m.timing) && m.timing.includes(slot.key))
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
                  key={med._id || med.id}
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
                    <Pill size={18} color="#16A34A" />
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-main)" }}>
                        {med.name} <span style={{ fontSize: "0.8rem", color: "#16A34A", fontWeight: "600" }}>({med.dosage})</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {[med.frequency, med.timing, med.instructions].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleTaken(med._id || med.id)}
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
      {medications.some(
        (medication) => medication.status === "Active" && !hasScheduledTimeSlot(medication, timeSlots)
      ) && (
        <div
          style={{
            backgroundColor: "var(--bg-main)",
            border: "1px solid var(--border-color)",
            borderRadius: "1rem",
            padding: "1.1rem"
          }}
        >
          <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", margin: "0 0 0.85rem" }}>
            Other / as directed
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {medications
              .filter((medication) => medication.status === "Active" && !hasScheduledTimeSlot(medication, timeSlots))
              .map((medication) => (
                <div
                  key={medication._id || medication.id}
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
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-main)" }}>
                      {medication.name} <span style={{ fontSize: "0.8rem", color: "#16A34A", fontWeight: "600" }}>({medication.dosage})</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {[medication.timing, medication.frequency, medication.instructions].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleTaken(medication._id || medication.id)}
                    style={{
                      padding: "0.3rem 0.65rem",
                      borderRadius: "0.5rem",
                      border: medication.takenToday ? "1px solid #10b981" : "1px solid var(--border-color)",
                      backgroundColor: medication.takenToday ? "rgba(16, 185, 129, 0.12)" : "var(--bg-main)",
                      color: medication.takenToday ? "#10b981" : "var(--text-muted)",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <CheckCircle2 size={14} />
                    {medication.takenToday ? "Taken" : "Mark Taken"}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Medications = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [prescribedBy, setPrescribedBy] = useState("");
  const [refillsLeft, setRefillsLeft] = useState("");
  const [totalRefills, setTotalRefills] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedTimings, setSelectedTimings] = useState(["Morning"]);
  const [startDate, setStartDate] = useState(getTodayDateInput);
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    let cancelled = false;

    getMedications()
      .then((res) => {
        if (!res.success || !Array.isArray(res.data)) {
          throw new Error(res.message || "Medication response was invalid.");
        }
        if (!cancelled) {
          setMedications(res.data.map(withTakenToday));
          setLoadError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message || "Could not load medications.");
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

  const retryLoadMedications = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getMedications();
      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(res.message || "Medication response was invalid.");
      }
      setMedications(res.data.map(withTakenToday));
    } catch (err) {
      setLoadError(err.message || "Could not load medications.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaken = async (id) => {
    const medication = medications.find((item) => item._id === id || item.id === id);
    if (!medication) return;

    try {
      const res = await setMedicationTaken(id, !medication.takenToday);
      if (res.success) {
        setMedications((prev) =>
          prev.map((item) =>
            (item._id === id || item.id === id) ? withTakenToday(res.data) : item
          )
        );
        setToastMessage("Medication status updated.");
        setToastType("success");
      }
    } catch (err) {
      setToastMessage(`Error updating medication status: ${err.message}`);
      setToastType("error");
    }
  };

  const handleDeleteMedication = async (id) => {
    try {
      await deleteMedication(id);
      setMedications((prev) => prev.filter((m) => (m._id !== id && m.id !== id)));
      setToastMessage("Medication deleted.");
      setToastType("success");
    } catch (err) {
      setToastMessage(`Error deleting medication: ${err.message}`);
      setToastType("error");
    }
  };

  const handleTimingToggle = (time) => {
    if (selectedTimings.includes(time)) {
      setSelectedTimings(selectedTimings.filter((t) => t !== time));
    } else {
      setSelectedTimings([...selectedTimings, time]);
    }
  };

  const handleSaveMedication = async (e) => {
    e.preventDefault();
    if (!medName.trim()) return;

    setSubmitting(true);
    try {
      if (editingMed) {
        const id = editingMed._id || editingMed.id;
        const res = await updateMedication(id, {
          name: medName.trim(),
          dosage: dosage.trim(),
          frequency: frequency.trim(),
          prescribedBy: prescribedBy.trim(),
          refillsLeft: refillsLeft === "" ? null : Number(refillsLeft),
          totalRefills: totalRefills === "" ? null : Number(totalRefills),
          instructions: instructions.trim(),
          timing: selectedTimings.join(", "),
          startDate,
          endDate: endDate || null,
          status
        });
        if (res.success) {
          setMedications((prev) =>
            prev.map((m) => ((m._id === id || m.id === id) ? withTakenToday(res.data) : m))
          );
          setToastMessage(`Medication "${medName}" updated.`);
          setToastType("success");
        }
      } else {
        const res = await createMedication({
          name: medName.trim(),
          dosage: dosage.trim(),
          frequency: frequency.trim(),
          prescribedBy: prescribedBy.trim(),
          refillsLeft: refillsLeft === "" ? null : Number(refillsLeft),
          totalRefills: totalRefills === "" ? null : Number(totalRefills),
          instructions: instructions.trim(),
          timing: selectedTimings.join(", "),
          status,
          startDate,
          endDate: endDate || null
        });
        if (res.success) {
          setMedications((prev) => [withTakenToday(res.data), ...prev]);
          setToastMessage(`Medication "${medName}" added to MongoDB!`);
          setToastType("success");
        }
      }

      setAddModalOpen(false);
      setEditingMed(null);
      setMedName("");
      setDosage("");
      setInstructions("");
      setFrequency("Once daily");
      setPrescribedBy("");
      setRefillsLeft("");
      setTotalRefills("");
      setSelectedTimings(["Morning"]);
      setStartDate(getTodayDateInput());
      setEndDate("");
      setStatus("Active");
    } catch (err) {
      setToastMessage(`Error saving medication: ${err.message}`);
      setToastType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (med) => {
    setEditingMed(med);
    setMedName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setPrescribedBy(med.prescribedBy || "");
    setRefillsLeft(med.refillsLeft ?? "");
    setTotalRefills(med.totalRefills ?? "");
    setInstructions(med.instructions || "");
    setSelectedTimings(typeof med.timing === "string" ? [med.timing] : (med.timing || ["Morning"]));
    setStartDate(toDateInput(med.startDate));
    setEndDate(toDateInput(med.endDate));
    setStatus(med.status || "Active");
    setAddModalOpen(true);
  };

  const filteredMeds = medications.filter((medication) =>
    activeTab === "active" ? isMedicationCurrentlyActive(medication) : !isMedicationCurrentlyActive(medication)
  );
  const activeMedications = medications.filter(isMedicationCurrentlyActive);

  return (
    <DashboardLayout>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} type={toastType} />

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
            setFrequency("Once daily");
            setPrescribedBy("");
            setRefillsLeft("");
            setTotalRefills("");
            setInstructions("");
            setSelectedTimings(["Morning"]);
            setStartDate(getTodayDateInput());
            setEndDate("");
            setStatus("Active");
            setAddModalOpen(true);
          }}
        >
          Add Medication
        </Button>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", display: "flex", justifyContent: "center" }}>
          <LoadingSpinner size="lg" text="Loading prescription schedule..." />
        </div>
      ) : loadError ? (
        <div role="alert" style={{ padding: "2rem", textAlign: "center", color: "var(--text-main)" }}>
          <p style={{ color: "#b91c1c" }}>Could not load medications: {loadError}</p>
          <Button variant="outline" size="md" onClick={retryLoadMedications}>Try again</Button>
        </div>
      ) : (
        /* Grid Layout: Left Schedule Timeline, Right Medications Cards */
        <div style={{ gap: "1.75rem" }} className="medications-overview-grid">
          {/* Left Column (2 Spans): Active & Completed Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", minWidth: 0 }}>
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
                  backgroundColor: activeTab === "active" ? "#16A34A" : "transparent",
                  color: activeTab === "active" ? "#ffffff" : "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                Active Medications ({activeMedications.length})
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                style={{
                  padding: "0.5rem 1.1rem",
                  borderRadius: "0.65rem",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  border: "none",
                  backgroundColor: activeTab === "completed" ? "#16A34A" : "transparent",
                  color: activeTab === "completed" ? "#ffffff" : "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                Paused / Completed / Out of date ({medications.length - activeMedications.length})
              </button>
            </div>

            {filteredMeds.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
                {filteredMeds.map((med) => (
                  <MedicationCard
                    key={med._id || med.id}
                    medication={{
                      ...med,
                      id: med._id || med.id,
                      effectiveStatus: getMedicationDisplayStatus(med)
                    }}
                    onToggleTaken={handleToggleTaken}
                    onEdit={openEditModal}
                    onDelete={handleDeleteMedication}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Pill}
                title={`No ${activeTab === "active" ? "active" : "inactive"} medications`}
                description={activeTab === "active" ? "Add a medication to keep your current schedule up to date." : "Paused, completed, and out-of-date medications will appear here."}
                actionLabel={activeTab === "active" ? "Add Medication" : undefined}
                onAction={activeTab === "active" ? () => setAddModalOpen(true) : undefined}
              />
            )}
          </div>

          {/* Right Column (1 Span): Today's Schedule Timeline */}
          <div>
            <Card title="Daily Dose Timeline" subtitle="Today's scheduled medication slots" icon={Clock}>
              {activeMedications.length > 0 ? (
                <MedicationScheduleTimeline
                  medications={activeMedications}
                  onToggleTaken={handleToggleTaken}
                />
              ) : (
                <EmptyState icon={Clock} title="No active medication schedule" description="Active medication dose times will appear here." />
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Add / Edit Medication Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={editingMed ? "Edit Medication" : "Add New Prescription"}
        subtitle="Manage your medication dosage and scheduled timings"
      >
        <form onSubmit={handleSaveMedication} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <Input
            label="Medication Name"
            placeholder="e.g. Lisinopril, Metformin"
            value={medName}
            onChange={(e) => setMedName(e.target.value)}
            maxLength={120}
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="modal-form-grid">
            <Input
              label="Dosage"
              placeholder="e.g. 10mg, 500mg"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              maxLength={80}
              required
            />

            <Input
              label="Frequency"
              placeholder="e.g. Once daily, every 8 hours, as needed"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="modal-form-grid">
            <Input
              label="Prescribed By (Optional)"
              placeholder="Clinician or practice"
              value={prescribedBy}
              onChange={(e) => setPrescribedBy(e.target.value)}
              maxLength={120}
            />
            <Input
              label="Current Refills (Optional)"
              type="number"
              min="0"
              max="1000"
              step="1"
              value={refillsLeft}
              onChange={(e) => setRefillsLeft(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="modal-form-grid">
            <Input
              label="Total Refills (Optional)"
              type="number"
              min="0"
              max="1000"
              step="1"
              value={totalRefills}
              onChange={(e) => setTotalRefills(e.target.value)}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Medication Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="modal-form-grid">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date (Optional)"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Scheduled Dose Times</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["Morning", "Afternoon", "Evening", "Night"].map((time) => {
                const isSel = selectedTimings.includes(time);
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimingToggle(time)}
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: "0.6rem",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      border: isSel ? "1px solid #16A34A" : "1px solid var(--border-color)",
                      backgroundColor: isSel ? "rgba(22, 163, 74, 0.12)" : "var(--bg-main)",
                      color: isSel ? "#16A34A" : "var(--text-muted)",
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
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Special Instructions (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Take with meals in the morning..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
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
              {submitting ? "Saving..." : editingMed ? "Update Prescription" : "Add Medication"}
            </Button>
          </div>
        </form>
      </Modal>

    </DashboardLayout>
  );
};

export default Medications;
