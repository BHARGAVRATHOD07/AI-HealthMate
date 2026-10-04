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

// ─── USERS (legacy admin endpoint) ────────────────────────────────────────────


/**
 * Fetch all registered users (admin/debug use only).
 * Endpoint: GET /api/users
 */
export const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/api/users`, {
    headers: getAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch users.");
  return data;
};

// ─── Default export ────────────────────────────────────────────────────────────
export default {
  registerUser,
  loginUser,
  getAuthenticatedUser,
  fetchUsers,
  getAuthHeaders,
  API_URL,
};

