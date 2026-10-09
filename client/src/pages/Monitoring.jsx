import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Droplet,
  Heart,
  Plus,
  Scale,
  Thermometer,
  TrendingUp,
  Wind
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";

import { getVitals, createVital } from "../api/api";

const RANGE_OPTIONS = ["7 Days", "30 Days", "90 Days", "All"];
const METRIC_DEFINITIONS = {
  heartRate: { name: "Heart Rate", apiType: "Heart Rate", unit: "bpm", target: "60-100 bpm", icon: Heart, color: "#ef4444" },
  bloodPressure: { name: "Blood Pressure", apiType: "Blood Pressure", unit: "mmHg", target: "< 120/80 mmHg", icon: Activity, color: "#16A34A" },
  bloodSugar: { name: "Blood Sugar", apiType: "Blood Sugar", unit: "mg/dL", target: "70-99 mg/dL", icon: Droplet, color: "#10b981" },
  weight: { name: "Weight", apiType: "Weight", unit: "kg", target: "Healthy range varies", icon: Scale, color: "#059669" },
  oxygen: { name: "SpO2", apiType: "Oxygen Level", unit: "%", target: "95-100%", icon: Wind, color: "#0ea5e9" },
  temperature: { name: "Temperature", apiType: "Temperature", unit: "°C", target: "36.1-37.2°C", icon: Thermometer, color: "#f59e0b" }
};

const normalizeVitalType = (type) => {
  const value = typeof type === "string" ? type.trim() : "";
  if (!value) return "";

  const lower = value.toLowerCase();
  if (lower === "spo2" || lower === "oxygen" || lower === "oxygen level") return "Oxygen Level";
  return value;
};

const parseNumericValue = (value) => {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const parseBloodPressureValue = (value) => {
  const text = typeof value === "string" ? value.trim() : "";
  const match = text.match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
  if (!match) return null;

  const systolic = Number.parseFloat(match[1]);
  const diastolic = Number.parseFloat(match[2]);

  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) return null;
  return { systolic, diastolic };
};

const getRangeStart = (rangeLabel) => {
  const now = Date.now();
  switch (rangeLabel) {
    case "7 Days":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "30 Days":
      return now - 30 * 24 * 60 * 60 * 1000;
    case "90 Days":
      return now - 90 * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
};

const getMetricValue = (type, rawValue) => {
  if (type === "Blood Pressure") {
    const parsed = parseBloodPressureValue(rawValue);
    return parsed ? `${parsed.systolic}/${parsed.diastolic}` : null;
  }
  return parseNumericValue(rawValue);
};

const formatMetricValue = (type, rawValue, unit) => {
  if (type === "Blood Pressure") {
    const parsed = parseBloodPressureValue(rawValue);
    if (!parsed) return "—";
    return `${parsed.systolic}/${parsed.diastolic} ${unit}`;
  }

  const parsed = parseNumericValue(rawValue);
  return parsed === null ? "—" : `${parsed} ${unit}`;
};

const getDisplayDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const getWarningText = (type, value) => {
  const parsed = type === "Blood Pressure" ? parseBloodPressureValue(value) : parseNumericValue(value);
  if (parsed === null || parsed === undefined) return "";

  if (type === "Blood Pressure") {
    if (parsed.systolic > 180 || parsed.diastolic > 120) {
      return "This reading appears unusual. Consider rechecking the measurement.";
    }
    return "";
  }

  if (type === "Weight" && parsed > 200) return "This reading appears unusual. Consider rechecking the measurement.";
  if (type === "Heart Rate" && (parsed < 35 || parsed > 180)) return "This reading appears unusual. Consider rechecking the measurement.";
  if (type === "Blood Sugar" && (parsed < 40 || parsed > 300)) return "This reading appears unusual. Consider rechecking the measurement.";
  if (type === "Oxygen Level" && (parsed < 80 || parsed > 100)) return "This reading appears unusual. Consider rechecking the measurement.";
  if (type === "Temperature" && (parsed < 34 || parsed > 41)) return "This reading appears unusual. Consider rechecking the measurement.";
  return "";
};

const validateVitalReading = (type, value) => {
  if (!value || !String(value).trim()) {
    return { isValid: false, message: "A measurement value is required." };
  }

  if (type === "Blood Pressure") {
    const parsed = parseBloodPressureValue(value);
    if (!parsed) {
      return { isValid: false, message: "Blood pressure must use the format 120/80 mmHg." };
    }
    if (parsed.systolic < 40 || parsed.systolic > 260 || parsed.diastolic < 20 || parsed.diastolic > 180) {
      return { isValid: false, message: "Blood pressure is outside a realistic range. Please recheck the measurement." };
    }
    return { isValid: true, normalizedValue: `${parsed.systolic}/${parsed.diastolic}`, warning: getWarningText(type, value) };
  }

  const numeric = parseNumericValue(value);
  if (numeric === null) {
    return { isValid: false, message: "Please enter a valid numeric value." };
  }

  if (numeric < 0) {
    return { isValid: false, message: "Values cannot be negative." };
  }

  const ranges = {
    Weight: { min: 20, max: 500 },
    "Heart Rate": { min: 20, max: 250 },
    "Blood Sugar": { min: 20, max: 600 },
    "Oxygen Level": { min: 30, max: 100 },
    Temperature: { min: 30, max: 115 }
  };

  const range = ranges[type];
  if (range && (numeric < range.min || numeric > range.max)) {
    return { isValid: false, message: `${type} is outside a realistic range. Please recheck the measurement.` };
  }

  return { isValid: true, normalizedValue: String(numeric), warning: getWarningText(type, value) };
};

const buildTrendSeries = (history, rangeLabel) => {
  const start = getRangeStart(rangeLabel);

  return [...history]
    .filter((entry) => {
      const timestamp = new Date(entry.loggedAt || entry.createdAt || 0).getTime();
      if (!Number.isFinite(timestamp)) return false;
      return rangeLabel === "All" || timestamp >= start;
    })
    .sort((a, b) => new Date(a.loggedAt || a.createdAt).getTime() - new Date(b.loggedAt || b.createdAt).getTime())
    .map((entry) => {
      const timestamp = new Date(entry.loggedAt || entry.createdAt).getTime();
      const value = getMetricValue(entry.type, entry.value);
      return {
        loggedAt: timestamp,
        label: getDisplayDate(timestamp),
        value: entry.type === "Blood Pressure" ? value : Number(value),
        rawValue: entry.value
      };
    });
};

const buildSummaryStats = (history, type) => {
  if (!history.length) {
    return { latest: "No data", minimum: "No data", maximum: "No data", average: "No data" };
  }

  const numericValues = history
    .map((entry) => {
      if (type === "Blood Pressure") {
        const parsed = parseBloodPressureValue(entry.value);
        return parsed ? parsed.systolic : null;
      }
      const parsed = parseNumericValue(entry.value);
      return Number.isFinite(parsed) ? parsed : null;
    })
    .filter((value) => value !== null);

  if (!numericValues.length) {
    return { latest: "No numeric data", minimum: "No numeric data", maximum: "No numeric data", average: "No numeric data" };
  }

  const latestValue = history[0]?.value;
  const minimum = Math.min(...numericValues);
  const maximum = Math.max(...numericValues);
  const average = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;

  const unit = Object.values(METRIC_DEFINITIONS).find((metric) => metric.apiType === type)?.unit || "";

  return {
    latest: type === "Blood Pressure" ? formatMetricValue(type, latestValue, unit) : `${latestValue} ${unit}`.trim(),
    minimum: `${minimum.toFixed(1)} ${unit}`.trim(),
    maximum: `${maximum.toFixed(1)} ${unit}`.trim(),
    average: `${average.toFixed(1)} ${unit}`.trim()
  };
};

// Interactive Custom SVG Chart Component
const VitalTrendChart = ({ data = [], color = "#16A34A" }) => {
  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 220;
  const padding = 35;

  const values = data.map((point) => Number(point.value));
  const minValue = Math.min(...values) - 2;
  const maxValue = Math.max(...values) + 2;

  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - ((Number(point.value) - minValue) / (maxValue - minValue || 1)) * (height - 2 * padding);
    return { x, y, label: point.label, value: Number(point.value) };
  });

  const pathD = points.reduce((acc, point, index) => index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`, "");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", minWidth: "420px", height: "auto" }}>
        <defs>
          <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.33, 0.66, 1].map((ratio) => {
          const y = padding + ratio * (height - 2 * padding);
          return (
            <line
              key={ratio}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="var(--border-color)"
              strokeDasharray="4 4"
            />
          );
        })}

        <path d={areaD} fill={`url(#gradient-${color.replace("#", "")})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="#ffffff" stroke={color} strokeWidth="3" />
            <text x={point.x} y={point.y - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-main)">{point.value}</text>
            <text x={point.x} y={height - 10} textAnchor="middle" fontSize="11" fill="var(--text-muted)">{point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const Monitoring = () => {
  const [selectedMetric] = useState("heartRate");
  const [selectedRange, setSelectedRange] = useState("30 Days");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [newVal, setNewVal] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newNotes, setNewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [vitalsData, setVitalsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const currentInfo = METRIC_DEFINITIONS[selectedMetric] || METRIC_DEFINITIONS.heartRate;

  const fetchVitalsData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const response = await getVitals();
      if (!response?.success) {
        throw new Error(response?.message || "Failed to load vital readings.");
      }

      setVitalsData(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load vitals:", error);
      setLoadError(error.message || "Unable to load health data.");
      setVitalsData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadVitals = async () => {
      if (!active) return;
      await fetchVitalsData();
    };

    loadVitals();

    return () => {
      active = false;
    };
  }, [fetchVitalsData]);

  const groupedByType = useMemo(() => {
    const groups = {};
    vitalsData.forEach((vital) => {
      const type = normalizeVitalType(vital.type);
      if (!type) return;
      groups[type] = groups[type] || [];
      groups[type].push(vital);
    });
    Object.values(groups).forEach((items) => {
      items.sort((a, b) => new Date(a.loggedAt || a.createdAt).getTime() - new Date(b.loggedAt || b.createdAt).getTime());
    });
    return groups;
  }, [vitalsData]);

  const currentMetricHistory = useMemo(() => groupedByType[currentInfo.apiType] || [], [groupedByType, currentInfo.apiType]);
  const currentStats = useMemo(() => buildSummaryStats(currentMetricHistory, currentInfo.apiType), [currentMetricHistory, currentInfo.apiType]);
  const recentReadings = useMemo(
    () => [...vitalsData]
      .sort((a, b) => new Date(b.loggedAt || b.createdAt).getTime() - new Date(a.loggedAt || a.createdAt).getTime())
      .slice(0, 10),
    [vitalsData]
  );

  const handleAddMeasurement = async (event) => {
    event.preventDefault();

    const validation = validateVitalReading(currentInfo.apiType, newVal);
    if (!validation.isValid) {
      setToastMessage(validation.message);
      return;
    }

    setSubmitting(true);

    try {
      await createVital({
        type: currentInfo.apiType,
        value: validation.normalizedValue,
        unit: currentInfo.unit,
        loggedAt: new Date(`${newDate}T12:00:00`).toISOString(),
        notes: newNotes.trim(),
        status: validation.warning ? "Warning" : "Normal"
      });

      window.dispatchEvent(new CustomEvent("vitals:updated"));
      setAddModalOpen(false);
      setNewVal("");
      setNewDate(new Date().toISOString().split("T")[0]);
      setNewNotes("");
      setToastMessage(validation.warning ? validation.warning : `${currentInfo.name} reading saved successfully.`);
      await fetchVitalsData();
    } catch (error) {
      setToastMessage(error.message || "Unable to save the reading.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalNoData = !loading && !loadError && vitalsData.length === 0;

  return (
    <DashboardLayout>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} type="success" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)" }}>Health Monitoring</h1>
          <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.94rem" }}>
            Review your vital history, trends, and recent measurements.
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={() => setAddModalOpen(true)}>
          Add Reading
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {Object.values(METRIC_DEFINITIONS).map((info) => {
          const history = groupedByType[info.apiType] || [];
          const latestEntry = [...history].sort((a, b) => new Date(b.loggedAt || b.createdAt).getTime() - new Date(a.loggedAt || a.createdAt).getTime())[0];
          const latestValue = latestEntry ? formatMetricValue(info.apiType, latestEntry.value, info.unit) : "No readings yet";

          return (
            <Card key={info.apiType} title={info.name} subtitle={latestValue} icon={info.icon}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Latest</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: info.color }}>Updated {latestEntry ? getDisplayDate(latestEntry.loggedAt || latestEntry.createdAt) : "—"}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card
        title="Health Trends"
        subtitle="Use the period filters to review real stored readings."
        icon={TrendingUp}
        headerAction={
          <div style={{ display: "flex", gap: "0.35rem", backgroundColor: "var(--bg-main)", borderRadius: "0.6rem", padding: "0.25rem", flexWrap: "wrap" }}>
            {RANGE_OPTIONS.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setSelectedRange(range)}
                style={{
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.4rem 0.7rem",
                  backgroundColor: selectedRange === range ? "#16A34A" : "transparent",
                  color: selectedRange === range ? "#ffffff" : "var(--text-muted)",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {range}
              </button>
            ))}
          </div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          {Object.values(METRIC_DEFINITIONS).map((info) => {
            const history = groupedByType[info.apiType] || [];
            const rangeData = buildTrendSeries(history, selectedRange);

            return (
              <div key={`${info.apiType}-chart`} style={{ border: "1px solid var(--border-color)", borderRadius: "1rem", padding: "1rem", backgroundColor: "var(--bg-card)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{info.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{info.target}</div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: info.color, fontWeight: 700 }}>{rangeData.length} readings</div>
                </div>

                {loading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem 0" }}>
                    <LoadingSpinner size="sm" text="Loading health data..." />
                  </div>
                ) : loadError ? (
                  <div style={{ color: "#b91c1c", fontSize: "0.9rem", padding: "1rem 0" }}>Unable to load data for {info.name}.</div>
                ) : rangeData.length ? (
                  <>
                    <VitalTrendChart data={rangeData} color={info.color} />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.5rem", marginTop: "0.75rem" }}>
                      <div style={{ backgroundColor: "var(--bg-main)", borderRadius: "0.7rem", padding: "0.6rem" }}>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Latest</div>
                        <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-main)" }}>{formatMetricValue(info.apiType, rangeData[rangeData.length - 1]?.rawValue || history[history.length - 1]?.value, info.unit)}</div>
                      </div>
                      <div style={{ backgroundColor: "var(--bg-main)", borderRadius: "0.7rem", padding: "0.6rem" }}>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Average</div>
                        <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-main)" }}>{buildSummaryStats(history, info.apiType).average}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={TrendingUp}
                    title="No readings found for this period."
                    description="Add a reading to start tracking trends."
                    actionLabel="Add a reading"
                    onAction={() => setAddModalOpen(true)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Current Metric Summary" subtitle={`${currentInfo.name} details`} icon={currentInfo.icon}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.85rem", marginTop: "1rem" }}>
          <div style={{ backgroundColor: "var(--bg-main)", borderRadius: "0.85rem", padding: "0.8rem" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>Latest</div>
            <div style={{ color: "var(--text-main)", fontWeight: 800, fontSize: "1.05rem", marginTop: "0.2rem" }}>{currentStats.latest}</div>
          </div>
          <div style={{ backgroundColor: "var(--bg-main)", borderRadius: "0.85rem", padding: "0.8rem" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>Minimum</div>
            <div style={{ color: "var(--text-main)", fontWeight: 800, fontSize: "1.05rem", marginTop: "0.2rem" }}>{currentStats.minimum}</div>
          </div>
          <div style={{ backgroundColor: "var(--bg-main)", borderRadius: "0.85rem", padding: "0.8rem" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>Maximum</div>
            <div style={{ color: "var(--text-main)", fontWeight: 800, fontSize: "1.05rem", marginTop: "0.2rem" }}>{currentStats.maximum}</div>
          </div>
          <div style={{ backgroundColor: "var(--bg-main)", borderRadius: "0.85rem", padding: "0.8rem" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>Average</div>
            <div style={{ color: "var(--text-main)", fontWeight: 800, fontSize: "1.05rem", marginTop: "0.2rem" }}>{currentStats.average}</div>
          </div>
        </div>
      </Card>

      <Card title="Recent Readings" subtitle="Latest stored measurements for your account" icon={Activity}>
        {totalNoData ? (
          <EmptyState
            icon={Activity}
            title="No readings yet."
            description="Add your first health reading to start tracking trends."
            actionLabel="Add your first reading"
            onAction={() => setAddModalOpen(true)}
          />
        ) : (
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ textAlign: "left", padding: "0.7rem 0.5rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "0.7rem 0.5rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "0.7rem 0.5rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {recentReadings.map((entry) => (
                  <tr key={entry._id || `${entry.type}-${entry.loggedAt}`} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "0.7rem 0.5rem", color: "var(--text-main)", fontSize: "0.88rem" }}>{getDisplayDate(entry.loggedAt || entry.createdAt)}</td>
                    <td style={{ padding: "0.7rem 0.5rem", color: "var(--text-main)", fontSize: "0.88rem" }}>{normalizeVitalType(entry.type)}</td>
                    <td style={{ padding: "0.7rem 0.5rem", color: "var(--text-main)", fontSize: "0.88rem" }}>{formatMetricValue(normalizeVitalType(entry.type), entry.value, entry.unit || (entry.type === "Blood Pressure" ? "mmHg" : ""))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title={`Log ${currentInfo.name}`} subtitle={`Record a new reading in ${currentInfo.unit}`}>
        <form onSubmit={handleAddMeasurement} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            label={`Reading Value (${currentInfo.unit})`}
            type={currentInfo.apiType === "Blood Pressure" ? "text" : "number"}
            step="any"
            placeholder={currentInfo.apiType === "Blood Pressure" ? "e.g. 120/80" : `e.g. ${currentInfo.apiType === "Heart Rate" ? "72" : "98"}`}
            value={newVal}
            onChange={(event) => setNewVal(event.target.value)}
            required
          />

          <Input
            label="Measurement Date"
            type="date"
            value={newDate}
            onChange={(event) => setNewDate(event.target.value)}
            required
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>Notes / Context (Optional)</label>
            <textarea
              rows={2}
              value={newNotes}
              onChange={(event) => setNewNotes(event.target.value)}
              placeholder="Optional context..."
              style={{
                resize: "vertical",
                border: "1px solid var(--border-color)",
                borderRadius: "0.7rem",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-main)",
                padding: "0.7rem 0.85rem",
                fontSize: "0.9rem"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.7rem" }}>
            <Button variant="outline" size="md" onClick={() => setAddModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={submitting}>
              {submitting ? "Saving..." : "Save Measurement"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Monitoring;
