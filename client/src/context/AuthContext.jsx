import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  loginUser,
  registerUser,
  getAuthenticatedUser,
  updateAuthenticatedUser
} from "../api/api";

const AuthContext = createContext();

const TOKEN_KEY = "ai_healthmate_token";
const USER_KEY  = "ai_healthmate_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);   // true while we verify the stored token on mount
  const [error, setError]     = useState(null);

  // ─── Persist helpers ────────────────────────────────────────────────────────
  const persistSession = (token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY,  JSON.stringify(userData));
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  // ─── On app load: restore session & verify token with backend ───────────────
  useEffect(() => {
    const restoreSession = async () => {
      const token    = localStorage.getItem(TOKEN_KEY);
      const cached   = localStorage.getItem(USER_KEY);

      if (!token) {
        setLoading(false);
        return;
      }

      // Optimistically restore UI from cache while we verify
      if (cached) {
        try { setUser(JSON.parse(cached)); } catch { /* Ignore invalid cached user data. */ }
      }

      try {
        // Verify the token is still valid against the backend
        const response = await getAuthenticatedUser();
        if (response.success) {
          persistSession(token, response.data);
        } else {
          clearSession();
        }
      } catch {
        // Token expired or invalid — clear it silently
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ─── LOGIN ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser(email, password);
      if (response.success) {
        persistSession(response.token, response.data);
        setLoading(false);
        return { success: true, message: response.message };
      }
      throw new Error(response.message || "Login failed.");
    } catch (err) {
      const msg = err.message || "Login failed. Please try again.";
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  }, []);

  // ─── REGISTER ────────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await registerUser({ name, email, password });
      if (response.success) {
        // Auto-login: the register endpoint also returns a token
        persistSession(response.token, response.data);
        setLoading(false);
        return { success: true, message: response.message };
      }
      throw new Error(response.message || "Registration failed.");
    } catch (err) {
      const msg = err.message || "Registration failed. Please try again.";
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  }, []);

  // ─── LOGOUT ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession();
    setError(null);
  }, []);

  // ─── UPDATE LOCAL PROFILE ────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updatedFields) => {
    const response = await updateAuthenticatedUser(updatedFields);
    if (!response.success) {
      throw new Error(response.message || "Failed to update profile.");
    }
    persistSession(localStorage.getItem(TOKEN_KEY), response.data);
    return response.data;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
