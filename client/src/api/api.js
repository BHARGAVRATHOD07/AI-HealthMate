// API Service for AI HealthMate Frontend Integration

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Register a new user with the backend API.
 * Endpoint: POST /api/users
 * Request body: { name, email, password }
 */
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Server error (${response.status})`);
    }

    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      throw new Error("Unable to connect to the backend server. Please check if backend is running at " + API_URL, { cause: error });
    }
    throw error;
  }
};

/**
 * Fetch all registered users (for demonstration/admin usage if needed)
 * Endpoint: GET /api/users
 */
export const fetchUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/api/users`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch users");
    }
    return data;
  } catch (error) {
    console.error("API Fetch Users Error:", error);
    throw error;
  }
};

export default {
  registerUser,
  fetchUsers,
  API_URL,
};
