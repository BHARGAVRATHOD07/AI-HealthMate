import { useState } from "react";
import {
  Bot,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Activity,
  Pill,
  FileText,
  CheckCircle2,
  Info,
  Plus,
  Bell,
  UserRound
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "./common/Card";
import Button from "./common/Button";
import { getHealthSummary } from "../api/api";

const AIHealthSummaryCard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getHealthSummary();
      if (response && response.success && response.data) {
        setSummary(response.data);
      } else {
        throw new Error((response && response.message) || "Failed to generate health summary.");
      }
    } catch (err) {
      setError(err.message || "Could not generate AI summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <Card
      title="AI Health Summary"
      subtitle="A personalized overview based on your recorded health information"
      icon={Bot}
      headerAction={
        summary ? (
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={handleGenerateSummary}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh Summary"}
          </Button>
        ) : null
      }
      style={{
        border: "1px solid rgba(22, 163, 74, 0.25)",
        background: "var(--bg-card)",
        marginBottom: "1.5rem"
      }}
    >
      {/* 1. Initial State: No summary generated yet */}
      {!summary && !isLoading && !error && (
        <div
          style={{
            padding: "1.25rem",
            borderRadius: "0.875rem",
            background: "radial-gradient(circle at top left, rgba(22, 163, 74, 0.08), transparent 50%), var(--bg-card-alt)",
            border: "1px solid var(--border-color)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.85rem"
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "rgba(22, 163, 74, 0.12)",
              color: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem", fontWeight: "750", color: "var(--text-main)" }}>
              Personalized AI Health Overview
            </h3>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "540px" }}>
              Generate a structured analysis of your recorded vitals, medications, health records, and profile details powered by AI HealthMate.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={Sparkles}
            onClick={handleGenerateSummary}
            style={{ marginTop: "0.35rem" }}
          >
            Generate AI Health Summary
          </Button>
        </div>
      )}

      {/* 2. Loading State (When no previous summary exists) */}
      {isLoading && !summary && (
        <div
          style={{
            padding: "2rem 1.25rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.85rem"
          }}
        >
          <RefreshCw size={28} color="#16A34A" style={{ animation: "spin 1.2s linear infinite" }} />
          <div>
            <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.95rem" }}>
              Generating your AI Health Summary...
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Analyzing your recorded vitals, medications, health records, and profile history.
            </div>
          </div>
        </div>
      )}

      {/* 3. Error State (When no previous summary exists) */}
      {error && !isLoading && !summary && (
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "0.85rem",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            color: "#ef4444",
            fontSize: "0.875rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleGenerateSummary}>
            Try Again
          </Button>
        </div>
      )}

      {/* 4. Loaded Summary Content */}
      {summary && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Refreshing In-Flight Banner (Preserving existing summary view) */}
          {isLoading && (
            <div
              style={{
                padding: "0.6rem 0.9rem",
                borderRadius: "0.6rem",
                background: "rgba(22, 163, 74, 0.1)",
                border: "1px solid rgba(22, 163, 74, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "0.55rem",
                fontSize: "0.82rem",
                color: "#15803D"
              }}
            >
              <RefreshCw size={15} style={{ animation: "spin 1.2s linear infinite", flexShrink: 0 }} />
              <span><strong>Refreshing summary...</strong> Updating with latest health database entries while keeping previous summary visible.</span>
            </div>
          )}

          {/* Refresh Error Banner (Preserving existing summary view) */}
          {error && !isLoading && (
            <div
              style={{
                padding: "0.65rem 0.9rem",
                borderRadius: "0.6rem",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.6rem",
                fontSize: "0.82rem",
                color: "#ef4444"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleGenerateSummary}>
                Retry Refresh
              </Button>
            </div>
          )}

          {/* Header Metadata timestamp */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              paddingBottom: "0.5rem",
              borderBottom: "1px solid var(--border-color)"
            }}
          >
            <span style={{ fontWeight: "600", color: "#16A34A", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <CheckCircle2 size={15} /> Generated from your recorded database context
            </span>
            <span>Last updated: {formatTimestamp(summary.generatedAt)}</span>
          </div>

          {/* Empty Data Banner (if user has not recorded enough health data) */}
          {!summary.hasData && (
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "0.85rem",
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                fontSize: "0.875rem",
                color: "var(--text-main)"
              }}
            >
              <div style={{ fontWeight: "750", color: "#d97706", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <Info size={18} /> Insufficient Health Data
              </div>
              <p style={{ margin: "0 0 0.85rem", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                {summary.message || "Your health summary is not available yet because you have not recorded enough health information."} You can add relevant measurements and history through the sections below:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem" }}>
                <Button variant="outline" size="sm" icon={UserRound} onClick={() => navigate("/profile")}>Health Profile</Button>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => navigate("/monitoring")}>Log Vitals</Button>
                <Button variant="outline" size="sm" icon={FileText} onClick={() => navigate("/records")}>Add Records</Button>
                <Button variant="outline" size="sm" icon={Pill} onClick={() => navigate("/medications")}>Add Medications</Button>
                <Button variant="outline" size="sm" icon={Bell} onClick={() => navigate("/reminders")}>Set Reminders</Button>
              </div>
            </div>
          )}

          {summary.hasData && (
            <>
              {/* SECTION A: RECORDED HEALTH INFORMATION (FACTS) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Section A: Recorded Health Information
                </div>

                {/* Profile Overview Grid */}
                {summary.profileOverview && (
                  <div style={{ padding: "0.85rem 1rem", borderRadius: "0.75rem", background: "var(--bg-card-alt)", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "750", color: "var(--text-main)", marginBottom: "0.6rem" }}>
                      Your Health Profile
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.65rem", fontSize: "0.82rem" }}>
                      <div><span style={{ color: "var(--text-muted)" }}>Name:</span> <strong style={{ color: "var(--text-main)" }}>{summary.profileOverview.name}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Age:</span> <strong style={{ color: "var(--text-main)" }}>{summary.profileOverview.age}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Gender:</span> <strong style={{ color: "var(--text-main)" }}>{summary.profileOverview.gender}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Height:</span> <strong style={{ color: "var(--text-main)" }}>{summary.profileOverview.height}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Weight:</span> <strong style={{ color: "var(--text-main)" }}>{summary.profileOverview.weight}</strong></div>
                      <div><span style={{ color: "var(--text-muted)" }}>Blood Group:</span> <strong style={{ color: "var(--text-main)" }}>{summary.profileOverview.bloodGroup}</strong></div>
                    </div>
                  </div>
                )}

                {/* Latest Vitals Summary */}
                {summary.latestVitals && summary.latestVitals.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: "750", color: "var(--text-main)", marginBottom: "0.5rem" }}>
                      Latest Health Measurements
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.65rem" }}>
                      {summary.latestVitals.map((v, i) => (
                        <div key={i} style={{ padding: "0.7rem 0.85rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
                          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{v.type}</div>
                          <div style={{ fontSize: "1rem", fontWeight: "800", color: "#16A34A", marginTop: "0.15rem" }}>{v.value}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-subtle)", marginTop: "0.1rem" }}>Status: {v.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historical Trends */}
                {summary.trends && summary.trends.length > 0 && (
                  <div style={{ padding: "0.85rem 1rem", borderRadius: "0.75rem", background: "var(--bg-card-alt)", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "750", color: "var(--text-main)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Activity size={16} color="#16A34A" /> Recent Trends
                    </div>
                    {summary.trends.map((t, idx) => (
                      <div key={idx} style={{ fontSize: "0.85rem", color: "var(--text-main)", lineHeight: "1.45" }}>
                        • <strong>{t.metric}:</strong> {t.description}
                      </div>
                    ))}
                  </div>
                )}

                {/* Active Medications, Records, and Upcoming Reminders Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
                  {/* Medications */}
                  <div style={{ padding: "0.85rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "750", color: "var(--text-main)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Pill size={16} color="#16A34A" /> Active Medications
                    </div>
                    {summary.activeMedications && summary.activeMedications.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem", color: "var(--text-main)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {summary.activeMedications.map((m, idx) => (
                          <li key={idx}><strong>{m.name}</strong> ({m.dosage}, {m.frequency})</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No active medications recorded.</div>
                    )}
                  </div>

                  {/* Recent Records */}
                  <div style={{ padding: "0.85rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "750", color: "var(--text-main)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <FileText size={16} color="#16A34A" /> Health Records
                    </div>
                    {summary.recentRecords && summary.recentRecords.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem", color: "var(--text-main)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {summary.recentRecords.map((r, idx) => (
                          <li key={idx}><strong>{r.title}</strong> ({r.category})</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No recent health records recorded.</div>
                    )}
                  </div>

                  {/* Upcoming Reminders */}
                  <div style={{ padding: "0.85rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "750", color: "var(--text-main)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Bell size={16} color="#16A34A" /> Upcoming Reminders
                    </div>
                    {summary.upcomingReminders && summary.upcomingReminders.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem", color: "var(--text-main)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {summary.upcomingReminders.map((rem, idx) => (
                          <li key={idx}><strong>{rem.title}</strong> ({rem.category}) — {rem.date} at {rem.time} {rem.completed ? "(Completed)" : ""}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>No upcoming health reminders scheduled.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION B: AI OBSERVATIONS & WELLNESS INSIGHTS */}
              {summary.observations && summary.observations.length > 0 && (
                <div
                  style={{
                    padding: "1.1rem",
                    borderRadius: "0.875rem",
                    background: "rgba(22, 163, 74, 0.07)",
                    border: "1px solid rgba(22, 163, 74, 0.25)"
                  }}
                >
                  <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#15803D", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                    Section B: AI Observations & Wellness Insights
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.875rem", color: "var(--text-main)", lineHeight: "1.5" }}>
                    {summary.observations.map((obs, idx) => (
                      <li key={idx}>{obs}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SECTION C: MISSING INFORMATION */}
              {summary.missingInformation && summary.missingInformation.length > 0 && (
                <div
                  style={{
                    padding: "1rem 1.1rem",
                    borderRadius: "0.875rem",
                    background: "var(--bg-card-alt)",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Info size={15} color="#f59e0b" /> Section C: Missing Information
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {summary.missingInformation.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* MANDATORY MEDICAL DISCLAIMER */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  fontSize: "0.78rem",
                  color: "var(--text-subtle)",
                  paddingTop: "0.5rem",
                  borderTop: "1px solid var(--border-color)"
                }}
              >
                <ShieldAlert size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Medical Disclaimer:</strong> {summary.disclaimer || "AI HealthMate provides informational summaries based solely on user-entered data and does not replace professional medical diagnosis or clinical advice."}
                </span>
              </div>

              {/* Bottom Refresh Action */}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.25rem" }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  onClick={handleGenerateSummary}
                  disabled={isLoading}
                >
                  {isLoading ? "Refreshing..." : "Refresh Summary"}
                </Button>
              </div>
            </>
          )}

        </div>
      )}
    </Card>
  );
};

export default AIHealthSummaryCard;
