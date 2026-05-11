import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "staff" | "captain" | "customer";
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isCaptain: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function resolveApiBase(): string {
  try {
    const override = typeof window !== "undefined" ? window.localStorage.getItem("api_base_url") : null;
    if (override) return override.replace(/\/$/, "");
  } catch { /* ignore */ }
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env) return String(env).replace(/\/$/, "");
  // Same-origin: dev uses Vite proxy, prod uses Vercel rewrite to Railway.
  return "";
}
const API_BASE_URL = resolveApiBase();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch user profile");
    return response.json();
  };

  // On mount: check if token exists and rehydrate user
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchUserProfile(token)
        .then(setUser)
        .catch(() => {
          // Token is invalid, clear it
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name: email.split("@")[0], role: "customer" }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Login failed");
    }

    const { access_token, refresh_token } = await response.json();
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);

    const userProfile = await fetchUserProfile(access_token);
    setUser(userProfile);
  };

  const logout = (): void => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isAdmin: user?.role === "admin",
    isStaff: user?.role === "staff" || user?.role === "admin",
    isCaptain: user?.role === "captain",
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
