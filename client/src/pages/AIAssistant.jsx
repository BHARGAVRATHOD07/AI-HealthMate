import { useState, useRef, useEffect } from "react";
import { Bot, Send, Plus, MessageSquare, ShieldAlert, AlertCircle, RefreshCw, Paperclip } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import Button from "../components/common/Button";
import { initialAIChats, suggestedAIQuestions } from "../data/mockData";
import { sendAIMessage } from "../api/api";

const AIAssistant = () => {
  const [chats, setChats] = useState(initialAIChats);
  const [activeChatId, setActiveChatId] = useState(initialAIChats[0].id);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [aiError, setAiError] = useState(null);

  const messagesEndRef = useRef(null);

  const currentChat = chats.find((c) => c.id === activeChatId) || chats[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat.messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    setAiError(null);

    const userMsg = {
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    // Get current history BEFORE adding the new user message (for context)
    const currentHistory = chats.find(c => c.id === activeChatId)?.messages || [];

    // Append user message immediately to UI
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              messages: [...c.messages, userMsg],
              updatedAt: "Just now",
              // Auto-generate chat title from first user message
              title: c.messages.filter(m => m.sender === "user").length === 0
                ? query.length > 40 ? query.slice(0, 40) + "..." : query
                : c.title
            }
          : c
      )
    );

    if (!textToSend) setInputText("");
    setIsTyping(true);

    try {
      // Send to real Gemini backend — pass history for multi-turn context
      const response = await sendAIMessage(query, currentHistory);

      const aiMsg = {
        sender: "ai",
        text: response.data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [...c.messages, aiMsg] }
            : c
        )
      );
    } catch (err) {
      setAiError(err.message || "Failed to get a response. Please try again.");
    } finally {
      setIsTyping(false);
    }
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
            Powered by Google Gemini AI
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
                <span style={{ fontSize: "0.75rem", color: isTyping ? "#f59e0b" : "#10b981", fontWeight: "600" }}>
                  {isTyping ? "⟳ Thinking..." : "● Powered by Gemini"}
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
                  <div
                    style={{
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: isAI
                        ? msg.text
                            // Bold
                            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                            // Italic
                            .replace(/\*(.+?)\*/g, "<em>$1</em>")
                            // Numbered list items
                            .replace(/^(\d+)\. (.+)$/gm, "<li style='margin-left:1.1rem;margin-bottom:0.2rem'>$2</li>")
                            // Bullet list items
                            .replace(/^[-•] (.+)$/gm, "<li style='margin-left:1.1rem;margin-bottom:0.2rem'>$1</li>")
                            // Wrap consecutive <li> in <ul>
                            .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style='margin:0.4rem 0;padding:0'>${m}</ul>`)
                            // Line breaks
                            .replace(/\n\n/g, "<br/><br/>")
                            .replace(/\n/g, "<br/>")
                        : msg.text
                    }}
                  />
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)", fontSize: "0.875rem", padding: "0.5rem 0" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={18} color="#fff" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span>AI HealthMate is thinking</span>
                  <span style={{ display: "flex", gap: "3px" }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#0284c7", display: "inline-block", animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}

            {aiError && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.875rem", padding: "0.85rem 1rem", fontSize: "0.875rem", color: "#ef4444" }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
                <div style={{ flex: 1 }}>
                  <strong>Error:</strong> {aiError}
                </div>
                <button onClick={() => setAiError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 0, display: "flex", alignItems: "center" }}>
                  <RefreshCw size={15} />
                </button>
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
