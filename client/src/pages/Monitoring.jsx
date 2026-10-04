import { useState, useEffect } from "react";
import { Activity, Heart, Scale, Droplet, Plus, TrendingUp } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Modal from "../components/common/Modal";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";

import { getVitals, createVital } from "../api/api";
import { chartTrendsData } from "../data/mockData";

// Interactive Custom SVG Chart Component
const VitalTrendChart = ({ data = [], metricKey = "value", color = "#0284c7" }) => {
  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 220;
  const padding = 35;

  const values = data.map((d) => (typeof d[metricKey] === "number" ? d[metricKey] : parseFloat(d.value) || 70));
  const minVal = Math.min(...values) - 5;
  const maxVal = Math.max(...values) + 5;

  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
    const val = typeof d[metricKey] === "number" ? d[metricKey] : parseFloat(d.value) || 70;
    const y = height - padding - ((val - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);
    return { x, y, label: d.time || d.loggedAt ? new Date(d.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Log", value: val };
  });

  const pathD = points.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ""
  );

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", minWidth: "450px" }}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = padding + ratio * (height - 2 * padding);
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="var(--border-color)"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Area Gradient */}
        <path d={areaD} fill={`url(#gradient-${color})`} />

        {/* Trend Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data Dots & Text Labels */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke={color} strokeWidth="3" />
            <text
              x={p.x}
              y={p.y - 12}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="var(--text-main)"
            >
              {p.value}
            </text>
            <text
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text-muted)"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const Monitoring = () => {
  const [selectedMetric, setSelectedMetric] = useState("heartRate");
  const [timeframe, setTimeframe] = useState("weekly");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Measurement form state
  const [newVal, setNewVal] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newNotes, setNewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [trends, setTrends] = useState(chartTrendsData);
  const [loading, setLoading] = useState(true);

  const metricsInfo = {
    heartRate: { name: "Heart Rate", apiType: "Heart Rate", unit: "bpm", target: "60-100 bpm", icon: Heart, color: "#ef4444" },
    bloodPressure: { name: "Blood Pressure", apiType: "Blood Pressure", unit: "mmHg", target: "< 120/80 mmHg", icon: Activity, color: "#0284c7" },
    bloodGlucose: { name: "Blood Glucose", apiType: "Blood Sugar", unit: "mg/dL", target: "70-99 mg/dL", icon: Droplet, color: "#10b981" },
    weight: { name: "Weight Log", apiType: "Weight", unit: "kg", target: "70-74 kg", icon: Scale, color: "#0d9488" }
  };

  const currentInfo = metricsInfo[selectedMetric] || metricsInfo.heartRate;

  useEffect(() => {
    const fetchVitalsData = async () => {
      try {
        setLoading(true);
        const response = await getVitals();
        if (response.success && response.data.length > 0) {
          // Group vitals by type for our chart trends
          const fetchedTrends = { ...chartTrendsData };
          
          response.data.forEach(vital => {
            let key = "heartRate";
            if (vital.type === "Blood Pressure") key = "bloodPressure";
            if (vital.type === "Blood Sugar") key = "bloodGlucose";
            if (vital.type === "Weight") key = "weight";

            const numVal = parseFloat(vital.value) || 70;
            const timeLabel = new Date(vital.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (fetchedTrends[key]) {
              fetchedTrends[key].weekly.push({ time: timeLabel, value: numVal });
            }
          });

          setTrends(fetchedTrends);
        }
      } catch (err) {
        console.error("Failed to load vitals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVitalsData();
  }, []);

  const currentChartData = trends[selectedMetric]?.[timeframe] || [];

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    if (!newVal) return;

    setSubmitting(true);
    try {
      await createVital({
        type: currentInfo.apiType,
        value: newVal,
        unit: currentInfo.unit,
        notes: newNotes,
        status: "Normal"
      });

      const newPoint = {
        time: "Just now",
        value: parseFloat(newVal) || 70
      };

      setTrends((prev) => ({
        ...prev,
        [selectedMetric]: {
          ...prev[selectedMetric],
          [timeframe]: [...(prev[selectedMetric]?.[timeframe] || []), newPoint]
        }
      }));

      setAddModalOpen(false);
      setNewVal("");
      setNewNotes("");
      setToastMessage(`${currentInfo.name} reading (${newVal} ${currentInfo.unit}) saved to MongoDB!`);
    } catch (err) {
      setToastMessage(`Error logging vital: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} type="success" />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
            Health Vitals Monitoring
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Track continuous biometric trends, heart rate logs, blood glucose, and body weight
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={() => setAddModalOpen(true)}>
          Add Measurement
        </Button>
      </div>

      {/* Vitals Metric Selector Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {Object.keys(metricsInfo).map((key) => {
          const info = metricsInfo[key];
          const Icon = info.icon;
          const isSelected = selectedMetric === key;

          return (
            <div
              key={key}
              onClick={() => setSelectedMetric(key)}
              style={{
                backgroundColor: "var(--bg-card)",
                border: isSelected ? `2px solid ${info.color}` : "1px solid var(--border-color)",
                borderRadius: "1rem",
                padding: "1.1rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isSelected ? "var(--shadow-md)" : "var(--shadow-sm)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "0.5rem",
                    backgroundColor: `rgba(${key === "heartRate" ? "239, 68, 68" : "2, 132, 199"}, 0.12)`,
                    color: info.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Icon size={18} />
                </div>
                {isSelected && (
                  <span style={{ fontSize: "0.72rem", fontWeight: "800", color: info.color }}>Active</span>
                )}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-main)" }}>{info.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>Target: {info.target}</div>
            </div>
          );
        })}
      </div>

      {/* Main Interactive Chart Card */}
      <Card
        title={`${currentInfo.name} Trend Analytics`}
        subtitle={`Historical readings in ${currentInfo.unit}`}
        icon={TrendingUp}
        headerAction={
          <div style={{ display: "flex", gap: "0.35rem", backgroundColor: "var(--bg-main)", padding: "0.25rem", borderRadius: "0.6rem" }}>
            {["daily", "weekly", "monthly"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "0.45rem",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  border: "none",
                  backgroundColor: timeframe === tf ? "#0284c7" : "transparent",
                  color: timeframe === tf ? "#ffffff" : "var(--text-muted)",
                  cursor: "pointer",
                  textTransform: "capitalize"
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        }
      >
        <div style={{ marginTop: "1rem" }}>
          {loading ? (
            <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
              <LoadingSpinner size="md" text="Loading vital analytics..." />
            </div>
          ) : (
            <VitalTrendChart
              data={currentChartData}
              metricKey="value"
              color={currentInfo.color}
            />
          )}
        </div>
      </Card>

      {/* Add Measurement Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={`Log ${currentInfo.name}`}
        subtitle={`Record a new vital reading in ${currentInfo.unit}`}
      >
        <form onSubmit={handleAddMeasurement} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <Input
            label={`Reading Value (${currentInfo.unit})`}
            type="number"
            step="any"
            placeholder={`e.g. ${selectedMetric === "heartRate" ? "72" : "118"}`}
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            required
          />

          <Input
            label="Measurement Date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>Notes / Context (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Measured after morning walk..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
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
              {submitting ? "Saving..." : "Save Measurement"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Monitoring;
