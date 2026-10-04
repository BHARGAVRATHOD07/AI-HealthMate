import { createContext, useContext, useState, useEffect } from "react";
import { registerUser } from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("ai_healthmate_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem("ai_healthmate_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("ai_healthmate_user");
    }
  }, [user]);

  // Demo Login functionality (Frontend Auth State for evaluation/development)
  const login = (email, password) => {
    setError(null);
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return false;
    }
    
    // Create demo user session
    const nameFromEmail = email.split("@")[0];
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    
    const loggedInUser = {
      id: "usr_" + Date.now(),
      name: formattedName || "Alex Johnson",
      email: email,
      role: "patient",
      avatar: null,
      createdAt: new Date().toISOString()
    };
    
    setUser(loggedInUser);
    return true;
  };

  // Real registration connected to POST /api/users
  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await registerUser({ name, email, password });
      
      // Auto login user after successful backend registration
      const newUser = {
        id: response.data?.id || "usr_" + Date.now(),
        name: response.data?.name || name,
        email: response.data?.email || email,
        role: "patient",
        avatar: null,
        createdAt: new Date().toISOString()
      };
      
      setUser(newUser);
      setLoading(false);
      return { success: true, message: response.message || "Registration successful!" };
    } catch (err) {
      setLoading(false);
      const errMsg = err.message || "Registration failed. Please try again.";
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ai_healthmate_user");
  };

  const updateProfile = (updatedFields) => {
    setUser((prevUser) => {
      const updated = { ...prevUser, ...updatedFields };
      localStorage.setItem("ai_healthmate_user", JSON.stringify(updated));
      return updated;
    });
  };

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
        updateProfile
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
