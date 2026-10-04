import { useState, useRef, useEffect } from "react";
import { Bot, Send, Plus, Paperclip, MessageSquare, ShieldAlert } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import Button from "../components/common/Button";
import { initialAIChats, suggestedAIQuestions } from "../data/mockData";

const AIAssistant = () => {
  const [chats, setChats] = useState(initialAIChats);
  const [activeChatId, setActiveChatId] = useState(initialAIChats[0].id);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  const currentChat = chats.find((c) => c.id === activeChatId) || chats[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat.messages, isTyping]);

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = {
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    // Append User Message
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, messages: [...c.messages, userMsg], updatedAt: "Just now" }
          : c
      )
    );

    if (!textToSend) setInputText("");
    setIsTyping(true);

    // Simulate AI response engine
    setTimeout(() => {
      let aiText;

      const qLower = query.toLowerCase();
      if (qLower.includes("blood pressure")) {
        aiText = "A normal blood pressure reading is generally **below 120/80 mmHg**.\n\n- **Systolic (<120)**: Pressure when heart beats.\n- **Diastolic (<80)**: Pressure when heart rests.\n\nIf your readings consistently exceed 130/80 mmHg, keep a daily log and discuss with your physician.";
      } else if (qLower.includes("record") || qLower.includes("lab")) {
        aiText = "Based on your uploaded **Comprehensive Metabolic Panel (Aug 2026)**:\n\n- **Fasting Glucose**: 94 mg/dL *(Optimal)*\n- **Lipid Panel**: HDL & LDL ratios within recommended ranges.\n- **Kidney Function**: Normal Creatinine level.\n\nEverything appears stable based on your documented records!";
      } else if (qLower.includes("medication") || qLower.includes("schedule")) {
        aiText = "Here is your active medication schedule breakdown:\n\n1. **Vitamin D3 (2000 IU)**: Morning with breakfast.\n2. **Albuterol Inhaler**: As needed for exercise/asthma.\n3. **Omega-3 Fish Oil**: Morning & Evening with meals.\n\nAlways ensure consistent timing for maximum effectiveness!";
      } else if (qLower.includes("track")) {
        aiText = "Key daily metrics recommended for personal tracking:\n\n1. **Morning Blood Pressure** (rest 5 mins prior)\n2. **Fasting Glucose** (if monitoring metabolic health)\n3. **Hydration Goal** (2 - 2.5 Liters per day)\n4. **30-Minute Physical Activity**";
      } else {
        aiText = `I understand you are asking about: "${query}".\n\nAI HealthMate helps organize your profile, track vital readings, and organize prescriptions. For personalized medical decisions or symptoms, always consult your physician.`;
      }

      const aiMsg = {
        sender: "ai",
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [...c.messages, aiMsg] }
            : c
        )
      );
      setIsTyping(false);
    }, 1000);
  };

  const handleNewChat = () => {
    const newChatId = "chat_" + Date.now();
    const newChatObj = {
      id: newChatId,
      title: "New Conversation",
      updatedAt: "Just now",
      messages: [
        {
          sender: "ai",
          text: "Hello! I am your AI HealthMate Assistant. How can I help you understand your health information today?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]
    };
    setChats([newChatObj, ...chats]);
    setActiveChatId(newChatId);
  };

  return (
    <DashboardLayout>
      {/* Mandatory Medical Disclaimer Banner */}
      <div
        style={{
          backgroundColor: "rgba(245, 158, 11, 0.12)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          borderRadius: "0.875rem",
          padding: "0.75rem 1.1rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.8125rem",
          color: "var(--text-main)",
          fontWeight: "500",
          flexShrink: 0
        }}
      >
        <ShieldAlert size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
        <div>
          <strong>Medical Disclaimer:</strong> AI HealthMate provides informational assistance and personal data tracking only. It does NOT replace professional medical diagnosis or clinical advice.
        </div>
      </div>

      {/* Main Chat App Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "1rem",
          flex: 1,
          minHeight: 0,
          height: "calc(100vh - 64px - 2.5rem - 3rem - 1rem)"
        }}
        className="lg:grid-cols-assistant"
      >
        {/* Left Chat History Sidebar (1 Span) */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "1.125rem",
            border: "1px solid var(--border-color)",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            overflow: "hidden"
          }}
          className="hidden lg:flex"
        >
          <div>
            <Button
              variant="primary"
              size="md"
              fullWidth
              icon={Plus}
              onClick={handleNewChat}
              style={{ marginBottom: "1rem" }}
            >
              New Chat
            </Button>

            <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
              Recent Discussions
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {chats.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveChatId(c.id)}
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.75rem",
                    cursor: "pointer",
                    backgroundColor: c.id === activeChatId ? "rgba(2, 132, 199, 0.12)" : "transparent",
                    color: c.id === activeChatId ? "#0284c7" : "var(--text-main)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    fontSize: "0.85rem",
                    fontWeight: c.id === activeChatId ? "700" : "500",
                    transition: "all 0.15s ease"
                  }}
                >
                  <MessageSquare size={16} />
                  <div style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {c.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", textAlign: "center", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)" }}>
            Powered by AI HealthMate Assistant Engine
          </div>
        </div>

        {/* Right Main Conversation Box (3 Spans) */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "1.125rem",
            border: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0
          }}
          className="lg:col-span-assistant-main"
        >
          {/* Chat Header */}
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "0.65rem",
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Bot size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                  AI Health Assistant
                </h3>
                <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "600" }}>
                  ● Active & Ready to Assist
                </span>
              </div>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            style={{
              flex: 1,
              padding: "1.25rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1.1rem"
            }}
          >
            {currentChat.messages.map((msg, index) => {
              const isAI = msg.sender === "ai";
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: isAI ? "flex-start" : "flex-end",
                    gap: "0.75rem"
                  }}
                >
                  {isAI && (
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        backgroundColor: "#0284c7",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <Bot size={18} />
                    </div>
                  )}

                  <div
                    style={{
                      maxWidth: "80%",
                      backgroundColor: isAI ? "var(--bg-main)" : "#0284c7",
                      color: isAI ? "var(--text-main)" : "#ffffff",
                      padding: "0.9rem 1.1rem",
                      borderRadius: "1.1rem",
                      borderTopLeftRadius: isAI ? "0.2rem" : "1.1rem",
                      borderTopRightRadius: isAI ? "1.1rem" : "0.2rem",
                      border: isAI ? "1px solid var(--border-color)" : "none",
                      fontSize: "0.9rem",
                      lineHeight: 1.55,
                      boxShadow: "var(--shadow-sm)"
                    }}
                  >
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        marginTop: "0.4rem",
                        textAlign: "right",
                        opacity: 0.75
                      }}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {!isAI && (
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        backgroundColor: "#0d9488",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontWeight: "700",
                        fontSize: "0.85rem"
                      }}
                    >
                      A
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                <Bot size={18} color="#0284c7" />
                <span>AI HealthMate Assistant is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions Chips */}
          <div
            style={{
              padding: "0.65rem 1.25rem",
              borderTop: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-main)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              overflowX: "auto"
            }}
          >
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", flexShrink: 0 }}>
              Suggested:
            </span>
            {suggestedAIQuestions.slice(0, 4).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  color: "#0284c7",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box Bar */}
          <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border-color)" }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-subtle)",
                  cursor: "pointer",
                  padding: "0.35rem"
                }}
                title="Attach medical document (UI mock)"
              >
                <Paperclip size={20} />
              </button>

              <input
                type="text"
                placeholder="Ask a question about your vitals, medications, or health records..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  fontSize: "0.9rem",
                  borderRadius: "0.85rem",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-main)",
                  color: "var(--text-main)",
                  outline: "none"
                }}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={Send}
                disabled={!inputText.trim()}
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg\\:grid-cols-assistant { grid-template-columns: 240px 1fr !important; }
          .lg\\:col-span-assistant-main { grid-column: 2 / 3 !important; }
          .hidden.lg\\:flex { display: flex !important; }
        }
        @media (min-width: 1280px) {
          .lg\\:grid-cols-assistant { grid-template-columns: 260px 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default AIAssistant;
