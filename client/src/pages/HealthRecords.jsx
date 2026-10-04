import { useState } from "react";
import { FileText, Plus, Search, Upload } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import RecordCard from "../components/cards/RecordCard";
import EmptyState from "../components/common/EmptyState";
import Toast from "../components/common/Toast";

import { initialHealthRecords } from "../data/mockData";

const categories = ["All", "Lab Report", "Prescription", "Medical Report", "Vaccination", "Other"];

const HealthRecords = () => {
  const [records, setRecords] = useState(initialHealthRecords);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // New Record Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Lab Report");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newDoctor, setNewDoctor] = useState("");
  const [newFacility, setNewFacility] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const handleAddRecord = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const createdRecord = {
      id: "rec_" + Date.now(),
      title: newTitle,
      category: newCategory,
      date: newDate,
      doctor: newDoctor || "Self Uploaded",
      facility: newFacility || "Personal Hub",
      description: newDescription || "Medical document stored in personal vault.",
      fileSize: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : "1.2 MB",
      fileType: selectedFile ? selectedFile.name.split(".").pop().toUpperCase() : "PDF"
    };

    setRecords((prev) => [createdRecord, ...prev]);
    setAddModalOpen(false);
    setToastMessage(`Record "${newTitle}" added successfully!`);

    // Reset Form
    setNewTitle("");
    setNewDoctor("");
    setNewFacility("");
    setNewDescription("");
    setSelectedFile(null);
  };

  const handleDeleteRecord = (id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setToastMessage("Record deleted successfully.");
  };

  // Filter and Sort Logic
  const filteredRecords = records
    .filter((r) => {
      const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;
      const matchesQuery =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.doctor && r.doctor.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesQuery;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
      if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
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
          Add Health Record
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card padding="1.1rem" style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          {/* Search Input */}
          <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
            <input
              type="text"
              placeholder="Search records by title, physician, or summary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem 0.9rem 0.55rem 2.5rem",
                fontSize: "0.875rem",
                borderRadius: "0.65rem",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-main)",
                outline: "none"
              }}
            />
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: "600" }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "0.55rem 0.85rem",
                fontSize: "0.85rem",
                borderRadius: "0.65rem",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-main)",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px border var(--border-color)" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "9999px",
                fontSize: "0.8125rem",
                fontWeight: "600",
                border: selectedCategory === cat ? "1px solid #0284c7" : "1px solid var(--border-color)",
                backgroundColor: selectedCategory === cat ? "rgba(2, 132, 199, 0.12)" : "var(--bg-main)",
                color: selectedCategory === cat ? "#0284c7" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Record Cards Grid */}
      {filteredRecords.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1.25rem" }}>
          {filteredRecords.map((rec) => (
            <RecordCard
              key={rec.id}
              record={rec}
              onView={(r) => setViewRecord(r)}
              onDelete={handleDeleteRecord}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No health records found"
          description="Try adjusting your search filters or click below to upload a record."
          actionLabel="Add Health Record"
          onAction={() => setAddModalOpen(true)}
        />
      )}

      {/* Add Record Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Upload New Health Record"
        subtitle="Add a lab report, prescription, or clinical summary to your vault."
      >
        <form onSubmit={handleAddRecord} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <Input
            label="Record Title"
            placeholder="e.g. Blood Test Report, Lipid Panel"
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
                {categories.filter((c) => c !== "All").map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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
              label="Doctor / Specialist"
              placeholder="e.g. Dr. Eleanor Vance"
              value={newDoctor}
              onChange={(e) => setNewDoctor(e.target.value)}
            />
            <Input
              label="Clinic / Diagnostic Facility"
              placeholder="e.g. City Health Lab"
              value={newFacility}
              onChange={(e) => setNewFacility(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Description / Clinical Notes</label>
            <textarea
              rows={3}
              placeholder="Summarize key findings or instructions..."
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

          {/* File Upload Box Mockup */}
          <div
            style={{
              border: "2px dashed var(--border-color)",
              borderRadius: "0.85rem",
              padding: "1.25rem",
              textAlign: "center",
              backgroundColor: "var(--bg-main)",
              cursor: "pointer"
            }}
          >
            <input
              type="file"
              id="file-upload"
              style={{ display: "none" }}
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <label htmlFor="file-upload" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <Upload size={24} color="#0284c7" />
              <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--text-main)" }}>
                {selectedFile ? selectedFile.name : "Click to select PDF or image file"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Supported formats: PDF, PNG, JPG (Max 10MB)</span>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Button variant="outline" size="md" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Record Details Modal */}
      {viewRecord && (
        <Modal
          isOpen={!!viewRecord}
          onClose={() => setViewRecord(null)}
          title={viewRecord.title}
          subtitle={`Type: ${viewRecord.category} • Date: ${viewRecord.date}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600" }}>Physician</div>
                <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)" }}>
                  {viewRecord.doctor || "N/A"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600" }}>Diagnostic Facility</div>
                <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)" }}>
                  {viewRecord.facility || "N/A"}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "0.25rem" }}>Clinical Summary & Findings</div>
              <div style={{ padding: "0.85rem", borderRadius: "0.75rem", backgroundColor: "var(--bg-main)", fontSize: "0.9rem", color: "var(--text-main)", lineHeight: 1.5 }}>
                {viewRecord.description}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.85rem", borderTop: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {viewRecord.fileType} File ({viewRecord.fileSize})
              </span>
              <Button variant="primary" size="sm" onClick={() => setToastMessage("Downloading record file...")}>
                Download Document
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default HealthRecords;
