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

export const toggleReminder = async (id) => {
  const response = await fetch(`${API_URL}/api/reminders/${id}/toggle`, {
    method: "PATCH",
    headers: getAuthHeaders(),
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
export const getRecords = async (category = "All", search = "") => {
  const params = new URLSearchParams();
  if (category && category !== "All") params.append("category", category);
  if (search) params.append("search", search);

  const response = await fetch(`${API_URL}/api/records?${params.toString()}`, { headers: getAuthHeaders() });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch records.");
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
  fetchUsers,
  getVitals,
  createVital,
  deleteVital,
  getMedications,
  createMedication,
  updateMedication,
  deleteMedication,
  getReminders,
  createReminder,
  toggleReminder,
  deleteReminder,
  getRecords,
  createRecord,
  deleteRecord,
  getAuthHeaders,
  API_URL,
};

