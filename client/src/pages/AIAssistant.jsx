import { useState, useRef, useEffect } from "react";
import { Bot, Send, Plus, MessageSquare, ShieldAlert, AlertCircle, X, Paperclip, History, Pencil, Trash2, LoaderCircle } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import Button from "../components/common/Button";
import { suggestedAIQuestions } from "../data/mockData";
import { createChatSubmission } from "../api/chatRequest";
import {
  createConversation,
  deleteConversation,
  getConversationMessages,
  listConversations,
  renameConversation,
  sendPersistentAIMessage
} from "../api/api";

const formatTimestamp = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
};

const toChatMessage = (message) => ({
  id: String(message._id),
  sender: message.role === "assistant" ? "ai" : "user",
  text: message.content,
  timestamp: formatTimestamp(message.createdAt),
  status: message.status,
  failureCode: message.failureCode,
  requestId: message.requestId,
  conversationId: String(message.conversation)
});

const loadAllConversationMessages = async (conversationId) => {
  const messages = [];
  let cursor;

  do {
    const result = await getConversationMessages(conversationId, { cursor, limit: 50 });
    messages.push(...(Array.isArray(result.data) ? result.data : []));
    cursor = result.pagination?.hasMore ? result.pagination.nextCursor : null;
  } while (cursor);

  return messages.map(toChatMessage);
};

const AIAssistant = () => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sendingConversationId, setSendingConversationId] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPageLoading, setHistoryPageLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesReloadKey, setMessagesReloadKey] = useState(0);
  const [pendingSubmissionByConversation, setPendingSubmissionByConversation] = useState({});
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [conversationActionId, setConversationActionId] = useState(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const activeConversationRef = useRef(null);
  const messageLoadRequestRef = useRef(0);
  const sendingRef = useRef(false);
  const pendingSubmissionsRef = useRef(new Map());
  const creatingRef = useRef(false);
  const historyRequestRef = useRef(0);

  const currentChat = chats.find((chat) => chat.id === activeChatId);
  const isTyping = Boolean(activeChatId && sendingConversationId === activeChatId);
  const hasUnresolvedSubmission = Boolean(pendingSubmissionByConversation[activeChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const refreshConversationList = async () => {
    const result = await listConversations();
    const items = Array.isArray(result.data) ? result.data : [];
    const conversations = items.map((item) => ({
      id: String(item._id),
      title: item.title,
      lastMessageAt: item.lastMessageAt,
      createdAt: item.createdAt
    }));
    setChats((previous) => {
      const refreshedIds = new Set(conversations.map((chat) => chat.id));
      const olderPages = previous.filter((chat) => !refreshedIds.has(chat.id));
      return [...conversations, ...olderPages];
    });
    setHistoryPagination(result.pagination || null);
    if (!activeConversationRef.current && conversations.length > 0) {
      activeConversationRef.current = conversations[0].id;
      setMessagesLoading(true);
      setActiveChatId(conversations[0].id);
    }
  };

  useEffect(() => {
    let active = true;
    const requestId = ++historyRequestRef.current;

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const result = await listConversations();
        if (!active || requestId !== historyRequestRef.current) return;
        const items = Array.isArray(result.data) ? result.data : [];
        const conversations = items.map((item) => ({
            id: String(item._id),
            title: item.title,
            lastMessageAt: item.lastMessageAt,
            createdAt: item.createdAt
        }));
        setChats(conversations);
        setHistoryPagination(result.pagination || null);
        if (conversations.length > 0) {
          activeConversationRef.current = conversations[0].id;
          setMessagesLoading(true);
          setActiveChatId(conversations[0].id);
        }
      } catch (error) {
        if (active && requestId === historyRequestRef.current) {
            setHistoryError(error.message || "Could not load conversation history.");
        }
      } finally {
        if (active && requestId === historyRequestRef.current) setHistoryLoading(false);
      }
    };

    loadHistory();
    return () => {
      active = false;
      messageLoadRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    activeConversationRef.current = activeChatId;
    if (!activeChatId) return undefined;

    let active = true;
    const requestId = ++messageLoadRequestRef.current;
    loadAllConversationMessages(activeChatId)
      .then((messages) => {
        if (active && requestId === messageLoadRequestRef.current &&
              activeConversationRef.current === activeChatId) {
            setActiveMessages(messages);
            const recoverableMessage = messages.find((item) =>
              item.sender === "user" &&
              item.requestId &&
              (item.status === "pending" ||
                (item.status === "failed" && item.failureCode === "not_processed"))
            );
            if (recoverableMessage && !pendingSubmissionsRef.current.has(activeChatId)) {
              const submission = {
                message: recoverableMessage.text,
                conversationId: activeChatId,
                requestId: recoverableMessage.requestId
              };
              pendingSubmissionsRef.current.set(activeChatId, submission);
              setPendingSubmissionByConversation((previous) => ({
                ...previous,
                [activeChatId]: submission
              }));
            }
        }
      })
      .catch((error) => {
        if (active && requestId === messageLoadRequestRef.current &&
              activeConversationRef.current === activeChatId) {
            setAiError(error.message || "Could not load this conversation.");
        }
      })
      .finally(() => {
        if (active && requestId === messageLoadRequestRef.current &&
              activeConversationRef.current === activeChatId) {
            setMessagesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeChatId, messagesReloadKey]);

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, isTyping, messagesLoading]);

  const submitPersistentMessage = async (submission) => {
    if (sendingRef.current) return;
    const { conversationId, message } = submission;
    const firstUserMessage = activeConversationRef.current === conversationId &&
      activeMessages.every((item) => item.sender !== "user");
    sendingRef.current = true;
    setAiError(null);
    setSendingConversationId(conversationId);

    try {
      let response;
      for (let attempt = 0; attempt < 10; attempt += 1) {
        response = await sendPersistentAIMessage(
          message,
          conversationId,
          submission.requestId
        );
        if (response.data?.status !== "pending") break;
        if (attempt < 9) {
          await new Promise((resolve) => window.setTimeout(resolve, 2500));
        }
      }
      if (response?.data?.status === "pending") {
        throw new Error("The message is still processing. Check its status before sending another message in this conversation.");
      }

      const now = response.data.timestamp || new Date().toISOString();
      const persistedMessages = [
        {
          id: String(response.data.userMessageId),
          sender: "user",
          text: message,
          timestamp: formatTimestamp(now),
          status: "complete"
        },
        {
          id: String(response.data.assistantMessageId),
          sender: "ai",
          text: response.data.reply,
          timestamp: formatTimestamp(now),
          status: "complete"
        }
      ];

      if (activeConversationRef.current === conversationId) {
        setActiveMessages((messages) => {
          const ids = new Set(messages.map((item) => item.id));
          return [...messages, ...persistedMessages.filter((item) => !ids.has(item.id))];
        });
      }
      pendingSubmissionsRef.current.delete(conversationId);
      setPendingSubmissionByConversation((previous) => {
        const next = { ...previous };
        delete next[conversationId];
        return next;
      });

      const chat = chats.find((item) => item.id === conversationId);
      if (firstUserMessage && chat?.title === "New Chat") {
        const suggestedTitle = message.length > 100 ? `${message.slice(0, 97)}...` : message;
        try {
          const renamed = await renameConversation(conversationId, suggestedTitle);
          const title = renamed.data?.title || suggestedTitle;
          setChats((previous) => previous.map((item) =>
            item.id === conversationId ? { ...item, title } : item
          ));
        } catch (error) {
          setHistoryError(error.message || "The message was saved, but the conversation title could not be updated.");
        }
      }
      try {
        await refreshConversationList();
      } catch (error) {
        setHistoryError(error.message || "Conversation history could not be refreshed.");
      }
    } catch (error) {
      const outcomeUnknown = error.data?.status === "failed";
      if (outcomeUnknown) {
        pendingSubmissionsRef.current.delete(conversationId);
        setPendingSubmissionByConversation((previous) => {
          const next = { ...previous };
          delete next[conversationId];
          return next;
        });
      }
      setAiError(outcomeUnknown
        ? `${error.message} The request will not be generated again with this request ID.`
        : `${error.message || "Could not confirm the message was sent."} Its request ID is retained; check status before retrying.`);
      try {
        const messages = await loadAllConversationMessages(conversationId);
        if (activeConversationRef.current === conversationId) setActiveMessages(messages);
      } catch {
        // Keep the original send failure visible; saved state can be checked by reopening the conversation.
      }
    } finally {
      sendingRef.current = false;
      setSendingConversationId(null);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || !activeChatId || sendingRef.current || messagesLoading ||
        pendingSubmissionsRef.current.has(activeChatId)) return;
    if (query.length > 4000) {
      setAiError("Messages must contain 4000 characters or fewer.");
      return;
    }

    let submission;
    try {
      submission = createChatSubmission(query, activeChatId);
    } catch (error) {
      setAiError(error.message || "Could not create a secure request ID.");
      return;
    }
    pendingSubmissionsRef.current.set(activeChatId, submission);
    setPendingSubmissionByConversation((previous) => ({
      ...previous,
      [activeChatId]: submission
    }));
    if (!textToSend) setInputText("");
    await submitPersistentMessage(submission);
  };

  const handleCheckMessageStatus = async () => {
    const submission = pendingSubmissionsRef.current.get(activeChatId);
    if (submission) await submitPersistentMessage(submission);
  };

  const handleNewChat = async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreatingConversation(true);
    setHistoryError(null);
    try {
      const result = await createConversation();
      const item = result.data;
      const conversation = {
        id: String(item._id),
        title: item.title,
        lastMessageAt: item.lastMessageAt,
        createdAt: item.createdAt
      };
      setChats((previous) => [conversation, ...previous.filter((chat) => chat.id !== conversation.id)]);
      setActiveMessages([]);
      setMessagesLoading(true);
      activeConversationRef.current = conversation.id;
      setActiveChatId(conversation.id);
      setMobileHistoryOpen(false);
      try {
        await refreshConversationList();
      } catch (error) {
        setHistoryError(error.message || "The chat was created, but history could not be refreshed.");
      }
    } catch (error) {
      setHistoryError(error.message || "Could not create a new chat.");
    } finally {
      creatingRef.current = false;
      setCreatingConversation(false);
    }
  };

  const handleOpenConversation = (conversationId) => {
    if (conversationId === activeChatId) {
      setMobileHistoryOpen(false);
      return;
    }
    activeConversationRef.current = conversationId;
    setActiveMessages([]);
    setMessagesLoading(true);
    setActiveChatId(conversationId);
    setMobileHistoryOpen(false);
  };

  const handleReloadMessages = () => {
    if (!activeChatId || sendingRef.current) return;
    setActiveMessages([]);
    setMessagesLoading(true);
    setAiError(null);
    setMessagesReloadKey((key) => key + 1);
  };

  const handleLoadMoreHistory = async () => {
    const cursor = historyPagination?.nextCursor;
    if (!cursor || historyPageLoading) return;
    setHistoryPageLoading(true);
    setHistoryError(null);
    try {
      const result = await listConversations({ cursor, limit: historyPagination.limit || 20 });
      const items = Array.isArray(result.data) ? result.data : [];
      const nextConversations = items.map((item) => ({
        id: String(item._id),
        title: item.title,
        lastMessageAt: item.lastMessageAt,
        createdAt: item.createdAt
      }));
      setChats((previous) => {
        const knownIds = new Set(previous.map((chat) => chat.id));
        return [...previous, ...nextConversations.filter((chat) => !knownIds.has(chat.id))];
      });
      setHistoryPagination(result.pagination || null);
    } catch (error) {
      setHistoryError(error.message || "Could not load more conversations.");
    } finally {
      setHistoryPageLoading(false);
    }
  };

  const handleRenameConversation = async (conversation) => {
    const proposedTitle = window.prompt("Rename conversation", conversation.title);
    if (proposedTitle === null) return;
    const title = proposedTitle.trim();
    if (!title || title.length > 100) {
      setHistoryError("Conversation titles must contain 1 to 100 characters.");
      return;
    }
    setConversationActionId(conversation.id);
    setHistoryError(null);
    try {
      const result = await renameConversation(conversation.id, title);
      setChats((previous) => previous.map((chat) =>
        chat.id === conversation.id ? { ...chat, title: result.data.title } : chat
      ));
    } catch (error) {
      setHistoryError(error.message || "Could not rename the conversation.");
    } finally {
      setConversationActionId(null);
    }
  };

  const handleDeleteConversation = async (conversation) => {
    if (!window.confirm(`Delete "${conversation.title}" and its messages? This cannot be undone.`)) return;
    setConversationActionId(conversation.id);
    setHistoryError(null);
    try {
      await deleteConversation(conversation.id);
      setChats((previous) => previous.filter((chat) => chat.id !== conversation.id));
      if (activeConversationRef.current === conversation.id) {
        activeConversationRef.current = null;
        setActiveChatId(null);
        setActiveMessages([]);
        setMessagesLoading(false);
      }
    } catch (error) {
      setHistoryError(error.message || "Could not delete the conversation.");
    } finally {
      setConversationActionId(null);
    }
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
          gap: "1rem",
          flex: 1,
          minHeight: 0
        }}
        className="assistant-chat-grid"
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
          className={`assistant-chat-history${mobileHistoryOpen ? " assistant-chat-history-open" : ""}`}
        >
          <div>
            <Button
              variant="primary"
              size="md"
              fullWidth
              icon={Plus}
              onClick={handleNewChat}
              isLoading={creatingConversation}
              style={{ marginBottom: "1rem" }}
            >
              New Chat
            </Button>

            <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
              Recent Discussions
            </div>

            {historyError && (
              <div role="alert" style={{ color: "var(--danger)", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                {historyError}
                <button
                  type="button"
                  onClick={() => {
                    setHistoryError(null);
                    setHistoryLoading(true);
                    refreshConversationList()
                      .catch((error) => setHistoryError(error.message || "Could not load conversation history."))
                      .finally(() => setHistoryLoading(false));
                  }}
                  style={{ display: "block", marginTop: "0.4rem", color: "#16A34A", background: "none", border: 0, padding: 0, cursor: "pointer" }}
                >
                  Retry loading history
                </button>
              </div>
            )}

            <div className="assistant-conversation-list">
              {historyLoading ? (
                <div className="assistant-history-state"><LoaderCircle size={16} className="assistant-spin" /> Loading conversations…</div>
              ) : chats.length === 0 ? (
                <div className="assistant-history-state">No saved conversations yet. Start a new chat to begin.</div>
              ) : chats.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`assistant-conversation-item${conversation.id === activeChatId ? " assistant-conversation-item-active" : ""}`}
                >
                  <button
                    type="button"
                    className="assistant-conversation-select"
                    onClick={() => handleOpenConversation(conversation.id)}
                    aria-current={conversation.id === activeChatId ? "page" : undefined}
                  >
                    <MessageSquare size={16} />
                    <span className="assistant-conversation-copy">
                      <span className="assistant-conversation-title">{conversation.title}</span>
                      <span className="assistant-conversation-date">
                        {formatTimestamp(conversation.lastMessageAt || conversation.createdAt)}
                      </span>
                    </span>
                  </button>
                  <div className="assistant-conversation-actions">
                    <button
                      type="button"
                      aria-label={`Rename ${conversation.title}`}
                      title="Rename conversation"
                      disabled={conversationActionId === conversation.id}
                      onClick={() => handleRenameConversation(conversation)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${conversation.title}`}
                      title="Delete conversation"
                      disabled={conversationActionId === conversation.id || sendingConversationId === conversation.id}
                      onClick={() => handleDeleteConversation(conversation)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {historyPagination?.hasMore && (
                <button
                  type="button"
                  onClick={handleLoadMoreHistory}
                  disabled={historyPageLoading}
                  className="assistant-load-more"
                >
                  {historyPageLoading ? "Loading…" : "Load older conversations"}
                </button>
              )}
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
          className="assistant-chat-main"
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
            className="assistant-chat-header"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "0.65rem",
                  backgroundColor: "#16A34A",
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
            <div className="assistant-header-actions">
              <Button
                variant="outline"
                size="sm"
                icon={History}
                className="assistant-mobile-history"
                aria-expanded={mobileHistoryOpen}
                onClick={() => setMobileHistoryOpen((open) => !open)}
              >
                History
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                className="assistant-mobile-new-chat"
                aria-label="New Chat"
                title="New Chat"
                onClick={handleNewChat}
                isLoading={creatingConversation}
              >
                New Chat
              </Button>
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
            className="assistant-chat-messages"
          >
            {messagesLoading ? (
              <div className="assistant-message-state" role="status">
                <LoaderCircle size={20} className="assistant-spin" /> Loading conversation…
              </div>
            ) : !currentChat ? (
              <div className="assistant-message-state">
                Choose a saved conversation or create a new chat to get started.
              </div>
            ) : activeMessages.length === 0 ? (
              <div className="assistant-message-state">
                This chat is ready. Ask your first question about your health information.
              </div>
            ) : activeMessages.map((msg) => {
              const isAI = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
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
                        backgroundColor: "#16A34A",
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
                      backgroundColor: isAI ? "var(--bg-main)" : "#16A34A",
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
                    className="assistant-chat-message"
                  >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere"
                    }}
                  >
                    {msg.text}
                  </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        marginTop: "0.4rem",
                        textAlign: "right",
                        opacity: 0.75
                      }}
                    >
                      {msg.timestamp}
                      {msg.status === "pending" && <span> · Processing</span>}
                      {msg.status === "failed" && (
                        <span className="assistant-failed-label">
                          {msg.failureCode === "outcome_unknown"
                            ? " · Outcome unknown; not retried"
                            : " · Not sent"}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isAI && (
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        backgroundColor: "#059669",
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
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={18} color="#fff" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span>AI HealthMate is thinking</span>
                  <span style={{ display: "flex", gap: "3px" }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16A34A", display: "inline-block", animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out` }} />
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
                  {currentChat && !isTyping && (
                    <button
                      type="button"
                      onClick={handleReloadMessages}
                      style={{ display: "block", marginTop: "0.4rem", color: "#16a34a", background: "none", border: 0, padding: 0, cursor: "pointer" }}
                    >
                      Reload saved messages
                    </button>
                  )}
                  {hasUnresolvedSubmission && !isTyping && (
                    <button
                      type="button"
                      onClick={handleCheckMessageStatus}
                      style={{ display: "block", marginTop: "0.4rem", color: "#16a34a", background: "none", border: 0, padding: 0, cursor: "pointer" }}
                    >
                      Check status using the same request ID
                    </button>
                  )}
                </div>
                <button aria-label="Dismiss error" onClick={() => setAiError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 0, display: "flex", alignItems: "center" }}>
                <X size={15} />
                </button>
              </div>
            )}
            {hasUnresolvedSubmission && !aiError && !isTyping && (
              <div className="assistant-message-state" role="status">
                This message may still be processing. Check its status using the same request ID before continuing.
                <button
                  type="button"
                  onClick={handleCheckMessageStatus}
                  style={{ marginLeft: "0.5rem", color: "#16a34a", background: "none", border: 0, padding: 0, cursor: "pointer" }}
                >
                  Check status
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
            className="assistant-suggestions"
          >
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", flexShrink: 0 }}>
              Suggested:
            </span>
            {suggestedAIQuestions.slice(0, 4).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={!activeChatId || isTyping || messagesLoading || hasUnresolvedSubmission}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  color: "#16A34A",
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
          <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border-color)" }} className="assistant-input-bar">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
              className="assistant-input-row"
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
                className="assistant-attach-button"
              >
                <Paperclip size={20} />
              </button>

              <input
                type="text"
                placeholder="Ask a question about your vitals, medications, or health records..."
                maxLength={4000}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                aria-label="Ask the AI Health Assistant"
                disabled={!activeChatId || isTyping || messagesLoading || hasUnresolvedSubmission}
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
                disabled={!inputText.trim() || !activeChatId || isTyping || messagesLoading || hasUnresolvedSubmission}
                isLoading={isTyping}
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
};

export default AIAssistant;
