import { useState, useEffect } from "react";
import { FileText, Plus, Search, Upload } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import RecordCard from "../components/cards/RecordCard";
import EmptyState from "../components/common/EmptyState";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";

import { getRecords, createRecord, deleteRecord } from "../api/api";

const categories = ["All", "Lab Report", "Prescription", "Imaging", "Doctor Note", "Vaccination"];

const HealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // New Record Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Lab Report");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newDoctor, setNewDoctor] = useState("");
  const [newFacility, setNewFacility] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const fetchRecordsList = async () => {
    try {
      setLoading(true);
      const res = await getRecords(selectedCategory, searchQuery);
      if (res.success) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordsList();
  }, [selectedCategory, searchQuery]);

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const res = await createRecord({
        title: newTitle,
        category: newCategory,
        date: newDate,
        doctorName: newDoctor || "Dr. Medical Professional",
        facility: newFacility || "City Hospital",
        summary: newDescription || "Medical document stored securely in patient vault."
      });

      if (res.success) {
        setRecords((prev) => [res.data, ...prev]);
        setToastMessage(`Record "${newTitle}" saved to MongoDB!`);
      }

      setAddModalOpen(false);
      setNewTitle("");
      setNewDoctor("");
      setNewFacility("");
      setNewDescription("");
    } catch (err) {
      setToastMessage(`Error saving record: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    try {
      await deleteRecord(id);
      setRecords((prev) => prev.filter((r) => (r._id !== id && r.id !== id)));
      setToastMessage("Record deleted successfully.");
    } catch (err) {
      setToastMessage(`Error deleting record: ${err.message}`);
    }
  };

  // Filter and Sort Logic
  const filteredRecords = records
    .filter((r) => {
      const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;
      const titleText = r.title || "";
      const descText = r.summary || r.description || "";
      const docText = r.doctorName || r.doctor || "";
      const matchesQuery =
        titleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        descText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        docText.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
      if (sortBy === "oldest") return new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });

  return (
    <DashboardLayout>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} type="success" />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
            Health Records Vault
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Securely upload, organize, and search your medical test reports and prescriptions
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={() => setAddModalOpen(true)}>
          Upload New Record
        </Button>
      </div>

      {/* Search Bar & Filter Controls */}
      <Card padding="1rem" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "0.9rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-subtle)"
              }}
            />
            <input
              type="text"
              placeholder="Search by report title, doctor name, or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem 0.9rem 0.65rem 2.6rem",
                fontSize: "0.875rem",
                borderRadius: "0.75rem",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-main)",
                outline: "none"
              }}
            />
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "600" }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "0.6rem 0.85rem",
                fontSize: "0.85rem",
                borderRadius: "0.75rem",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-main)",
                outline: "none",
                fontWeight: "600"
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Category Filter Chips */}
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
          <LoadingSpinner size="lg" text="Loading health records vault..." />
        </div>
      ) : (
        /* Records Grid Display */
        filteredRecords.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {filteredRecords.map((record) => (
              <RecordCard
                key={record._id || record.id}
                record={{
                  ...record,
                  id: record._id || record.id,
                  doctor: record.doctorName || record.doctor,
                  date: record.date ? new Date(record.date).toLocaleDateString() : "Recent",
                  fileType: record.category,
                  fileSize: "1.2 MB",
                  description: record.summary || record.description
                }}
                onView={(rec) => setViewRecord(rec)}
                onDelete={handleDeleteRecord}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No medical records found"
            description="No documents matched your filter. Upload your lab reports or prescriptions to store them safely."
            actionLabel="Upload Record"
            onAction={() => setAddModalOpen(true)}
          />
        )
      )}

      {/* Record Document Viewer Modal */}
      {viewRecord && (
        <Modal
          isOpen={!!viewRecord}
          onClose={() => setViewRecord(null)}
          title={viewRecord.title}
          subtitle={`Category: ${viewRecord.category || viewRecord.fileType} • Date: ${viewRecord.date}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "600" }}>Physician / Health Facility</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginTop: "0.15rem" }}>
                {viewRecord.doctorName || viewRecord.doctor || "Medical Specialist"} ({viewRecord.facility || "Diagnostic Clinic"})
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "600" }}>Clinical Impression / Summary</div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-main)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                {viewRecord.summary || viewRecord.description}
              </p>
            </div>

            <div style={{ padding: "0.85rem", borderRadius: "0.75rem", backgroundColor: "var(--bg-main)", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Document Vault Status: Encrypted & Verified ({viewRecord.category || viewRecord.fileType})
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Record Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Upload Medical Record"
        subtitle="Add a new lab result, imaging report, or prescription to your vault"
      >
        <form onSubmit={handleAddRecord} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <Input
            label="Report / Document Title"
            placeholder="e.g. Lipid Profile, Echocardiogram Report"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
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
                <option value="Lab Report">Lab Report</option>
                <option value="Prescription">Prescription</option>
                <option value="Imaging">Imaging / X-Ray</option>
                <option value="Doctor Note">Doctor Note</option>
                <option value="Vaccination">Vaccination</option>
              </select>
            </div>

            <Input
              label="Date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input
              label="Doctor / Physician Name"
              placeholder="e.g. Dr. Sarah Jenkins"
              value={newDoctor}
              onChange={(e) => setNewDoctor(e.target.value)}
            />

            <Input
              label="Hospital / Clinic Facility"
              placeholder="e.g. Quest Diagnostics"
              value={newFacility}
              onChange={(e) => setNewFacility(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Notes / Clinical Summary</label>
            <textarea
              rows={3}
              placeholder="Enter brief key findings or diagnostic summary..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
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
            <Button variant="outline" size="md" onClick={() => setAddModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={submitting}>
              {submitting ? "Saving..." : "Save to Vault"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default HealthRecords;
