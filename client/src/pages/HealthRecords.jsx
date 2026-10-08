import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Plus, Search } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import RecordCard from "../components/cards/RecordCard";
import EmptyState from "../components/common/EmptyState";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { createRecord, deleteRecord, getRecord, getRecords, updateRecord } from "../api/api";

const CATEGORIES = ["Lab Report", "Prescription", "Imaging", "Doctor Note", "Vaccination"];
const STATUSES = ["Final", "Pending", "Archived"];
const FIELD_LIMITS = { title: 150, doctorName: 120, facility: 140, summary: 2000 };

const getLocalDateInputValue = () => {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

const createEmptyForm = () => ({
  title: "",
  category: CATEGORIES[0],
  doctorName: "",
  facility: "",
  date: getLocalDateInputValue(),
  summary: "",
  status: "Final"
});

const getFormValues = (record) => ({
  title: record.title || "",
  category: record.category || CATEGORIES[0],
  doctorName: record.doctorName || "",
  facility: record.facility || "",
  date: record.date ? new Date(record.date).toISOString().slice(0, 10) : getLocalDateInputValue(),
  summary: record.summary || "",
  status: STATUSES.includes(record.status) ? record.status : "Final"
});

const formatRecordDate = (value) => {
  if (!value) return "Date not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const selectStyle = {
  width: "100%",
  minWidth: 0,
  padding: "0.65rem 0.9rem",
  fontSize: "0.9rem",
  borderRadius: "0.65rem",
  border: "1px solid var(--border-color)",
  backgroundColor: "var(--bg-main)",
  color: "var(--text-main)",
  outline: "none"
};

const fieldLabelStyle = {
  fontSize: "0.85rem",
  fontWeight: "600",
  color: "var(--text-main)"
};

const HealthRecords = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const searchQuery = searchParams.get("search") || "";

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await getRecords(selectedCategory, searchQuery, selectedStatus, sortBy);
      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error("The records response was invalid.");
      }
      setRecords(response.data);
      return true;
    } catch {
      setLoadError(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, selectedStatus, sortBy]);

  useEffect(() => {
    let cancelled = false;
    const fetchRecords = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const response = await getRecords(selectedCategory, searchQuery, selectedStatus, sortBy);
        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error("The records response was invalid.");
        }
        if (!cancelled) setRecords(response.data);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRecords();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, searchQuery, selectedStatus, sortBy]);

  const sortedRecords = useMemo(() => [...records].sort((first, second) => {
    const firstDate = new Date(first.date || first.createdAt || 0).getTime();
    const secondDate = new Date(second.date || second.createdAt || 0).getTime();
    const difference = firstDate - secondDate;
    return sortBy === "oldest" ? difference : -difference;
  }), [records, sortBy]);

  const notify = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
  };

  const openCreateForm = () => {
    setEditingRecord(null);
    setForm(createEmptyForm());
    setFormOpen(true);
  };

  const openEditForm = (record) => {
    setEditingRecord(record);
    setForm(getFormValues(record));
    setViewRecord(null);
    setFormOpen(true);
  };

  const handleViewRecord = async (record) => {
    try {
      const response = await getRecord(record._id || record.id);
      if (!response?.success || !response.data) {
        throw new Error("Unable to load health record details.");
      }
      setViewRecord(response.data);
    } catch (error) {
      notify(error.message || "Unable to load health record details.", "error");
    }
  };

  const closeForm = () => {
    if (submitting) return;
    setFormOpen(false);
    setEditingRecord(null);
    setForm(createEmptyForm());
  };

  const updateFormField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveRecord = async (event) => {
    event.preventDefault();
    const recordData = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
    );
    if (!recordData.title) {
      notify("Record title is required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (editingRecord) {
        await updateRecord(editingRecord._id || editingRecord.id, recordData);
      } else {
        await createRecord(recordData);
      }
      setFormOpen(false);
      setEditingRecord(null);
      setForm(createEmptyForm());
      const loaded = await loadRecords();
      notify(
        loaded
          ? editingRecord ? "Health record updated." : "Health record added."
          : "Record saved, but the list could not be refreshed. Retry to reload it.",
        loaded ? "success" : "error"
      );
      window.dispatchEvent(new CustomEvent("records:updated"));
    } catch (error) {
      notify(error.message || "Unable to save the health record.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this health record?")) return;

    setDeletingId(id);
    try {
      await deleteRecord(id);
      setRecords((current) => current.filter((record) => (record._id || record.id) !== id));
      setViewRecord((current) => current && (current._id || current.id) === id ? null : current);
      notify("Health record deleted.");
      window.dispatchEvent(new CustomEvent("records:updated"));
    } catch (error) {
      notify(error.message || "Unable to delete the health record.", "error");
    } finally {
      setDeletingId("");
    }
  };

  const handleSearchChange = (event) => {
    const nextParams = new URLSearchParams(searchParams);
    const value = event.target.value;
    if (value) nextParams.set("search", value);
    else nextParams.delete("search");
    setSearchParams(nextParams, { replace: true });
  };

  const hasActiveFilters = Boolean(searchQuery) || selectedCategory !== "All" || selectedStatus !== "All";

  return (
    <DashboardLayout>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
            Health Records
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            Manage your health records and the details you have stored.
          </p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={openCreateForm}>
          Add Health Record
        </Button>
      </div>

      <Card padding="1rem" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ position: "relative", minWidth: 0 }}>
            <Search size={18} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
            <input
              type="search"
              placeholder="Search title, category, doctor, or facility"
              aria-label="Search health records"
              value={searchQuery}
              maxLength={100}
              onChange={handleSearchChange}
              style={{
                ...selectStyle,
                paddingLeft: "2.5rem"
              }}
            />
          </div>
          <select
            aria-label="Filter by category"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            style={selectStyle}
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select
            aria-label="Filter by status"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            style={selectStyle}
          >
            <option value="All">All statuses</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select
            aria-label="Sort records"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            style={selectStyle}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </Card>

      <div style={{ marginBottom: "0.85rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>Your Records</h2>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", display: "flex", justifyContent: "center" }}>
          <LoadingSpinner size="lg" text="Loading health records..." />
        </div>
      ) : loadError ? (
        <Card padding="1.5rem">
          <div role="alert" style={{ display: "grid", justifyItems: "center", gap: "0.85rem", textAlign: "center" }}>
            <p style={{ margin: 0, color: "var(--text-main)", fontWeight: 600 }}>Unable to load health records.</p>
            <Button variant="outline" onClick={loadRecords}>Retry</Button>
          </div>
        </Card>
      ) : sortedRecords.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
          {sortedRecords.map((record) => {
            const id = record._id || record.id;
            return (
              <RecordCard
                key={id}
                record={{
                  ...record,
                  id,
                  doctor: record.doctorName,
                  date: formatRecordDate(record.date)
                }}
                onView={handleViewRecord}
                onEdit={openEditForm}
                onDelete={handleDeleteRecord}
                deleting={deletingId === id}
              />
            );
          })}
        </div>
      ) : hasActiveFilters ? (
        <EmptyState
          icon={FileText}
          title="No records found."
          description="Try changing your search or filters."
          actionLabel="Clear filters"
          onAction={() => {
            setSelectedCategory("All");
            setSelectedStatus("All");
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("search");
            setSearchParams(nextParams, { replace: true });
          }}
        />
      ) : (
        <EmptyState
          icon={FileText}
          title="No health records yet."
          description="Add your first health record to start building your health history."
          actionLabel="Add Health Record"
          onAction={openCreateForm}
        />
      )}

      {viewRecord && (
        <Modal
          isOpen
          onClose={() => setViewRecord(null)}
          title={viewRecord.title}
          subtitle={`${viewRecord.category} · ${formatRecordDate(viewRecord.date)}`}
          maxWidth="680px"
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "1rem" }}>
            {[
              ["Category", viewRecord.category],
              ["Date", formatRecordDate(viewRecord.date)],
              ["Doctor", viewRecord.doctorName],
              ["Facility", viewRecord.facility],
              ["Status", viewRecord.status]
            ].map(([label, value]) => (
              <div key={label} style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
                <div style={{ color: "var(--text-main)", marginTop: "0.2rem", overflowWrap: "anywhere" }}>{value || "—"}</div>
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Summary</div>
              <p style={{ color: "var(--text-main)", margin: "0.25rem 0 0", lineHeight: 1.55, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {viewRecord.summary || "—"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.65rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <Button variant="outline" onClick={() => handleDeleteRecord(viewRecord._id || viewRecord.id)} disabled={deletingId === (viewRecord._id || viewRecord.id)}>
              Delete
            </Button>
            <Button variant="primary" onClick={() => openEditForm(viewRecord)}>Edit record</Button>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editingRecord ? "Edit health record" : "Add health record"}
        subtitle="Enter the information as it appears in your record."
        maxWidth="720px"
      >
        <form onSubmit={handleSaveRecord} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            label="Title"
            placeholder="Record title"
            value={form.title}
            onChange={(event) => updateFormField("title", event.target.value)}
            maxLength={FIELD_LIMITS.title}
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label htmlFor="record-category" style={fieldLabelStyle}>Category</label>
              <select id="record-category" value={form.category} onChange={(event) => updateFormField("category", event.target.value)} style={selectStyle}>
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(event) => updateFormField("date", event.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "1rem" }}>
            <Input
              label="Doctor"
              placeholder="Doctor name (optional)"
              value={form.doctorName}
              onChange={(event) => updateFormField("doctorName", event.target.value)}
              maxLength={FIELD_LIMITS.doctorName}
            />
            <Input
              label="Facility"
              placeholder="Facility name (optional)"
              value={form.facility}
              onChange={(event) => updateFormField("facility", event.target.value)}
              maxLength={FIELD_LIMITS.facility}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label htmlFor="record-status" style={fieldLabelStyle}>Status</label>
            <select id="record-status" value={form.status} onChange={(event) => updateFormField("status", event.target.value)} style={selectStyle}>
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label htmlFor="record-summary" style={fieldLabelStyle}>Summary</label>
            <textarea
              id="record-summary"
              rows={4}
              placeholder="Optional summary"
              value={form.summary}
              onChange={(event) => updateFormField("summary", event.target.value)}
              maxLength={FIELD_LIMITS.summary}
              style={{ ...selectStyle, resize: "vertical", lineHeight: 1.5 }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
            <Button variant="outline" onClick={closeForm} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving..." : editingRecord ? "Save changes" : "Save record"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default HealthRecords;
