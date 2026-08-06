// ============================================================
// AuthContext - Global Authentication State
// ============================================================
// Manages the logged-in user and token across the entire app.
// Provides: login, signup, logout, and user data via context.
// ============================================================

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  getMe,
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
  setToken,
  removeToken,
  getToken,
  User,
} from "@/lib/api";

// Shape of the context value
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // true while checking token on startup

  // On app load: check if there's a saved token and fetch the user
  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  // Fetch the current user from the server
  async function refreshUser() {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const response = await getMe();
      setUser(response.data.user);
    } catch {
      // Token is invalid/expired - clear it
      removeToken();
      setUser(null);
    }
  }

  // Login: save token + set user, returns the logged-in user
  async function login(email: string, password: string): Promise<User> {
    const response = await apiLogin(email, password);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }

  // Signup: save token + set user
  async function signup(data: Record<string, unknown>) {
    const response = await apiSignup(data);
    setToken(response.data.token);
    setUser(response.data.user);
  }

  // Logout: remove token + clear user
  async function logout() {
    try {
      await apiLogout();
    } catch {
      // Ignore errors - we still clear local state
    }
    removeToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth anywhere in the app
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}