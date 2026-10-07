import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Heart,
  FileText,
  Pill,
  Bot,
  Bell,
  Sparkles,
  CheckCircle2,
  Lock,
  UserCheck
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Button from "../components/common/Button";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: UserCheck,
      title: "Personal Health Profile",
      desc: "Centralize your medical history, blood group, allergies, emergency contacts, and vital measurements."
    },
    {
      icon: FileText,
      title: "Secure Health Records",
      desc: "Store and categorize lab reports, prescriptions, medical test summaries, and vaccination certificates."
    },
    {
      icon: Pill,
      title: "Medication Management",
      desc: "Track daily prescription schedules, dosage timings, frequency guidelines, and refill reminders."
    },
    {
      icon: Activity,
      title: "Health Monitoring",
      desc: "Visualize blood pressure trends, heart rate patterns, blood glucose, and body weight over time."
    },
    {
      icon: Bot,
      title: "AI Health Assistant",
      desc: "Get intelligent, conversational answers explaining medical terminology, record metrics, and general wellness."
    },
    {
      icon: Sparkles,
      title: "Personalized Insights",
      desc: "Receive actionable health overviews and daily wellness targets tailored to your personal measurements."
    },
    {
      icon: Bell,
      title: "Smart Health Reminders",
      desc: "Never miss a medication dose, hydration target, exercise session, or doctor appointment."
    },
    {
      icon: Lock,
      title: "Patient-Focused Data",
      desc: "Built exclusively for patient privacy, ease of access, and complete peace of mind."
    }
  ];

  const steps = [
    { step: "01", title: "Create Your Profile", desc: "Set up your free account with your basic contact and emergency information." },
    { step: "02", title: "Add Health Data", desc: "Input your medications, upload health records, and log daily vital readings." },
    { step: "03", title: "Track & Manage", desc: "Stay on top of daily schedules with interactive timelines and reminder alerts." },
    { step: "04", title: "Get AI Assistance", desc: "Ask the AI assistant for instant, clear breakdowns of health metrics and records." }
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-main)" }}>
      <Navbar />

      {/* Hero Section */}
      <section
        id="home"
        style={{
          padding: "5rem 1.5rem 4rem",
          background: "radial-gradient(circle at top center, rgba(22, 163, 74, 0.12), transparent 45%)"
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr", gap: "3rem", alignItems: "center" }} className="lg:grid-cols-2">
          {/* Hero Text */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.45rem 0.9rem",
                borderRadius: "9999px",
                backgroundColor: "rgba(22, 163, 74, 0.1)",
                color: "#16A34A",
                fontSize: "0.82rem",
                fontWeight: "700",
                marginBottom: "1.25rem",
                border: "1px solid rgba(22, 163, 74, 0.12)"
              }}
            >
              <Sparkles size={16} /> Intelligent Personal Healthcare Companion
            </div>

            <h1
              style={{
                fontSize: "clamp(2.6rem, 5vw, 4rem)",
                fontWeight: "800",
                color: "var(--text-main)",
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
                marginBottom: "1.25rem"
              }}
            >
              Your Health. <br />
              <span style={{ color: "#16A34A" }}>Smarter. Simpler.</span>
            </h1>

            <p
              style={{
                fontSize: "1.12rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                marginBottom: "2rem",
                maxWidth: "560px"
              }}
            >
              AI HealthMate is your patient-focused healthcare management platform. Effortlessly organize medical records, monitor vitals, manage prescriptions, and access instant AI-powered health insights.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => navigate("/register")}
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const el = document.getElementById("features");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Explore Features
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
                marginTop: "2.5rem",
                paddingTop: "2.5rem",
                borderTop: "1px solid var(--border-color)",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                flexWrap: "wrap"
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontWeight: "600" }}>
                <CheckCircle2 size={18} color="#10b981" /> 100% Patient Focused
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontWeight: "600" }}>
                <CheckCircle2 size={18} color="#10b981" /> Confidential & Private
              </span>
            </div>
          </div>

          {/* Hero Visual Card (Professional UI Showcase) */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                top: "-0.7rem",
                right: "1.25rem",
                zIndex: 3,
                padding: "0.35rem 0.7rem",
                borderRadius: "9999px",
                background: "var(--bg-card)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-sm)",
                fontSize: "0.7rem",
                fontWeight: "700"
              }}
            >
              Sample dashboard preview
            </div>
            <div
              style={{
                background: "linear-gradient(180deg, rgba(22, 163, 74, 0.08), rgba(5, 150, 105, 0.04))",
                borderRadius: "1.75rem",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-glow)",
                padding: "1.75rem",
                position: "relative",
                zIndex: 2,
                backdropFilter: "blur(10px)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "#16A34A",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "800",
                      fontSize: "1.1rem"
                    }}
                  >
                    A
                  </div>
                  <div>
                    <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "1.05rem" }}>Alex Johnson</div>
                    <div style={{ fontSize: "0.8125rem", color: "#10b981", fontWeight: "600" }}>● Health Status: Optimal</div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    color: "#10b981",
                    padding: "0.4rem 0.85rem",
                    borderRadius: "9999px",
                    fontWeight: "800",
                    fontSize: "0.85rem"
                  }}
                >
                  Score: 92/100
                </div>
              </div>

              {/* Sample Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ backgroundColor: "var(--bg-main)", padding: "1rem", borderRadius: "1rem", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    <Heart size={16} color="#ef4444" /> Heart Rate
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-main)", margin: "0.2rem 0" }}>
                    72 <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted)" }}>bpm</span>
                  </div>
                  <span style={{ fontSize: "0.725rem", color: "#10b981", fontWeight: "600" }}>Normal Range</span>
                </div>

                <div style={{ backgroundColor: "var(--bg-main)", padding: "1rem", borderRadius: "1rem", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    <Activity size={16} color="#16A34A" /> Blood Pressure
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-main)", margin: "0.2rem 0" }}>
                    118/78
                  </div>
                  <span style={{ fontSize: "0.725rem", color: "#10b981", fontWeight: "600" }}>Ideal mmHg</span>
                </div>
              </div>

              {/* AI Insight Callout */}
              <div
                style={{
                  backgroundColor: "rgba(22, 163, 74, 0.08)",
                  border: "1px solid rgba(22, 163, 74, 0.2)",
                  borderRadius: "1rem",
                  padding: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem"
                }}
              >
                <Bot size={28} color="#16A34A" />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#16A34A" }}>AI Healthmate Insight</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-main)", marginTop: "0.15rem" }}>
                    "Your blood pressure and fasting glucose readings are optimal today. Medication schedule is on track!"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: "5rem 1.5rem", backgroundColor: "var(--bg-card)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 3.5rem" }}>
            <h2 style={{ fontSize: "2.25rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.85rem" }}>
              Complete Personal Healthcare Management
            </h2>
            <p style={{ fontSize: "1.05rem", color: "var(--text-muted)" }}>
              Designed with clarity and modern tools to empower you to take full control of your personal health data.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "var(--bg-main)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "1.25rem",
                    padding: "1.5rem",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease"
                  }}
                  className="hover:-translate-y-1 hover:shadow-md"
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "0.85rem",
                      backgroundColor: "rgba(22, 163, 74, 0.12)",
                      color: "#16A34A",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.25rem"
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.5rem" }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: "5rem 1.5rem", backgroundColor: "var(--bg-main)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 3.5rem" }}>
            <h2 style={{ fontSize: "2.25rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.85rem" }}>
              How AI HealthMate Works
            </h2>
            <p style={{ fontSize: "1.05rem", color: "var(--text-muted)" }}>
              Get started in four easy steps to simplify your personal health tracking.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
            {steps.map((st, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "1.25rem",
                  padding: "1.75rem",
                  position: "relative"
                }}
              >
                <div style={{ fontSize: "2.25rem", fontWeight: "900", color: "#16A34A", opacity: 0.8, marginBottom: "0.85rem" }}>
                  {st.step}
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.4rem" }}>
                  {st.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why AI HealthMate */}
      <section id="why-us" style={{ padding: "5rem 1.5rem", backgroundColor: "var(--bg-card)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{
              backgroundColor: "linear-gradient(135deg, #16A34A 0%, #059669 100%)",
              background: "linear-gradient(135deg, #16A34A 0%, #059669 100%)",
              borderRadius: "2rem",
              padding: "3.5rem 2.5rem",
              color: "#ffffff",
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "2.5rem",
              alignItems: "center"
            }}
            className="lg:grid-cols-2"
          >
            <div>
              <h2 style={{ fontSize: "2.25rem", fontWeight: "800", color: "#ffffff", marginBottom: "1rem" }}>
                Why Choose AI HealthMate?
              </h2>
              <p style={{ fontSize: "1.05rem", opacity: 0.9, lineHeight: 1.6, marginBottom: "1.75rem" }}>
                Having your personal healthcare information organized in one place reduces stress, prevents medication mix-ups, and gives you instant clarity over your vitals.
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/register")}
                style={{ backgroundColor: "#ffffff", color: "#16A34A" }}
              >
                Create Free Account
              </Button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(8px)", padding: "1.25rem", borderRadius: "1rem" }}>
                <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#ffffff", marginBottom: "0.3rem" }}>All-in-One Hub</h4>
                <p style={{ fontSize: "0.8125rem", opacity: 0.85 }}>No more scattered PDFs, lost prescriptions, or forgotten dates.</p>
              </div>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(8px)", padding: "1.25rem", borderRadius: "1rem" }}>
                <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#ffffff", marginBottom: "0.3rem" }}>AI Explanations</h4>
                <p style={{ fontSize: "0.8125rem", opacity: 0.85 }}>Clear non-jargon insights explaining your vital readings.</p>
              </div>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(8px)", padding: "1.25rem", borderRadius: "1rem" }}>
                <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#ffffff", marginBottom: "0.3rem" }}>Medication Safety</h4>
                <p style={{ fontSize: "0.8125rem", opacity: 0.85 }}>Daily schedule alerts so you take every dose on time.</p>
              </div>
              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(8px)", padding: "1.25rem", borderRadius: "1rem" }}>
                <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#ffffff", marginBottom: "0.3rem" }}>Patient Control</h4>
                <p style={{ fontSize: "0.8125rem", opacity: 0.85 }}>You own your data completely with zero doctor clutter.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @media (min-width: 1024px) {
          .lg\\:grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Landing;
