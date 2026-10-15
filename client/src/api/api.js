// API Service for AI HealthMate — all backend calls live here

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Auth Header Helper ────────────────────────────────────────────────────────
// Reads JWT from localStorage and returns the Authorization header object
const getAuthHeaders = () => {
  const token = localStorage.getItem("ai_healthmate_token");
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
};

// ─── AUTH ──────────────────────────────────────────────────────────────────────

/**
 * Register a new user.
 * Endpoint: POST /api/auth/register
 * Returns: { success, message, token, data: { id, name, email, role, createdAt } }
 */
export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Server error (${response.status})`);
  return data;
};

/**
 * Log in an existing user.
 * Endpoint: POST /api/auth/login
 * Returns: { success, message, token, data: { id, name, email, role, createdAt } }
 */
export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Server error (${response.status})`);
  return data;
};

/**
 * Get the currently authenticated user's profile.
 * Endpoint: GET /api/auth/me  (requires JWT)
 * Returns: { success, data: { id, name, email, role, createdAt } }
 */
export const getAuthenticatedUser = async () => {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to verify session.");
  return data;
};

export const updateAuthenticatedUser = async (userData) => {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update profile.");
  return data;
};

export const changeAuthenticatedPassword = async (currentPassword, newPassword) => {
  const response = await fetch(`${API_URL}/api/auth/password`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to change password.");
  return data;
};

export const requestPasswordResetOtp = async (email) => {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Could not send the verification code.");
    }
    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.toLowerCase().includes("fetch")) {
      throw new Error("Unable to reach the server. Please verify your connection or make sure the server is running.");
    }
    throw error;
  }
};

export const resetPasswordWithOtp = async (email, code, newPassword) => {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedCode = typeof code === "string" ? code.trim() : "";
  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, code: normalizedCode, newPassword }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Could not reset the password.");
    }
    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.toLowerCase().includes("fetch")) {
      throw new Error("Unable to reach the server. Please verify your connection or make sure the server is running.");
    }
    throw error;
  }
};

/**
 * Send a message to the AI Health Assistant (Gemini).
 * Endpoint: POST /api/ai/chat  (requires JWT)
 * Body: { message: string, history: Array<{sender, text}> }
 * Returns: { success, data: { reply, model, timestamp } }
 */
export const sendAIMessage = async (message, history = []) => {
  const response = await fetch(`${API_URL}/api/ai/chat`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, history }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "AI service error.");
  return data;
};

export const sendPersistentAIMessage = async (message, conversationId, requestId) => {
  if (!requestId) throw new Error("A request ID is required to send a persistent message.");
  const response = await fetch(`${API_URL}/api/ai/chat`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, conversationId, requestId }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "AI service error.");
    error.status = response.status;
    error.data = data.data;
    throw error;
  }
  return data;
};

export const createConversation = async () => {
  const response = await fetch(`${API_URL}/api/ai/conversations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Could not create a conversation.");
  return data;
};

export const listConversations = async ({ cursor, limit = 20 } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const response = await fetch(`${API_URL}/api/ai/conversations?${params}`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Could not load conversations.");
  return data;
};

export const getConversationMessages = async (conversationId, { cursor, limit = 50 } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const response = await fetch(
    `${API_URL}/api/ai/conversations/${encodeURIComponent(conversationId)}/messages?${params}`,
    { headers: getAuthHeaders() }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Could not load conversation messages.");
  return data;
};

export const renameConversation = async (conversationId, title) => {
  const response = await fetch(`${API_URL}/api/ai/conversations/${encodeURIComponent(conversationId)}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ title }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Could not rename the conversation.");
  return data;
};

export const deleteConversation = async (conversationId) => {
  const response = await fetch(`${API_URL}/api/ai/conversations/${encodeURIComponent(conversationId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Could not delete the conversation.");
  return data;
};

/**
 * Fetch a personalized AI Health Summary.
 * Endpoint: POST /api/ai/health-summary (requires JWT)
 */
export const getHealthSummary = async () => {
  const response = await fetch(`${API_URL}/api/ai/health-summary`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to generate health summary.");
  return data;
};


// ─── VITALS ──────────────────────────────────────────────────────────────────
export const getVitals = async (type) => {
  const url = type ? `${API_URL}/api/vitals?type=${encodeURIComponent(type)}` : `${API_URL}/api/vitals`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch vitals.");
  return data;
};

export const createVital = async (vitalData) => {
  const response = await fetch(`${API_URL}/api/vitals`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(vitalData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create vital reading.");
  return data;
};

export const deleteVital = async (id) => {
  const response = await fetch(`${API_URL}/api/vitals/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to delete vital reading.");
  return data;
};

// ─── MEDICATIONS ─────────────────────────────────────────────────────────────
export const getMedications = async () => {
  const response = await fetch(`${API_URL}/api/medications`, { headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch medications.");
  return data;
};

export const createMedication = async (medData) => {
  const response = await fetch(`${API_URL}/api/medications`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(medData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to add medication.");
  return data;
};

export const updateMedication = async (id, medData) => {
  const response = await fetch(`${API_URL}/api/medications/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(medData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update medication.");
  return data;
};

export const setMedicationTaken = async (id, taken) => {
  const response = await fetch(`${API_URL}/api/medications/${id}/taken`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ taken }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update medication status.");
  return data;
};

export const deleteMedication = async (id) => {
  const response = await fetch(`${API_URL}/api/medications/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to delete medication.");
  return data;
};

// ─── REMINDERS ───────────────────────────────────────────────────────────────
export const getReminders = async () => {
  const response = await fetch(`${API_URL}/api/reminders`, { headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch reminders.");
  return data;
};

export const createReminder = async (reminderData) => {
  const response = await fetch(`${API_URL}/api/reminders`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(reminderData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to add reminder.");
  return data;
};

export const updateReminder = async (id, reminderData) => {
  const response = await fetch(`${API_URL}/api/reminders/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(reminderData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update reminder.");
  return data;
};

export const toggleReminder = async (id, completed) => {
  const response = await fetch(`${API_URL}/api/reminders/${id}/toggle`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    ...(typeof completed === "boolean" ? { body: JSON.stringify({ completed }) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to toggle reminder.");
  return data;
};

export const deleteReminder = async (id) => {
  const response = await fetch(`${API_URL}/api/reminders/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to delete reminder.");
  return data;
};

// ─── HEALTH RECORDS ──────────────────────────────────────────────────────────
export const getRecords = async (category = "All", search = "", status = "All", sort = "newest") => {
  const params = new URLSearchParams();
  if (category && category !== "All") params.append("category", category);
  if (search) params.append("search", search);
  if (status && status !== "All") params.append("status", status);
  if (sort && sort !== "newest") params.append("sort", sort);

  const response = await fetch(`${API_URL}/api/records?${params.toString()}`, { headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch records.");
  return data;
};

export const getRecord = async (id) => {
  const response = await fetch(`${API_URL}/api/records/${encodeURIComponent(id)}`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch health record.");
  return data;
};

export const createRecord = async (recordData) => {
  const response = await fetch(`${API_URL}/api/records`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(recordData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to add record.");
  return data;
};

export const updateRecord = async (id, recordData) => {
  const response = await fetch(`${API_URL}/api/records/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(recordData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update record.");
  return data;
};

export const deleteRecord = async (id) => {
  const response = await fetch(`${API_URL}/api/records/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to delete record.");
  return data;
};

// ─── Default export ────────────────────────────────────────────────────────────
export default {
  registerUser,
  loginUser,
  getAuthenticatedUser,
  sendAIMessage,
  getHealthSummary,
  getVitals,
  createVital,
  deleteVital,
  getMedications,
  createMedication,
  updateMedication,
  setMedicationTaken,
  deleteMedication,
  getReminders,
  createReminder,
  toggleReminder,
  deleteReminder,
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  getAuthHeaders,
  API_URL,
};
