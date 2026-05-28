"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  points: number;
  role: "admin" | "warga";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on mount
    const timer = setTimeout(() => {
      try {
        const savedToken = localStorage.getItem("smartbin_token");
        const savedUser = localStorage.getItem("smartbin_user");
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {
        // corrupted data, clear it
        localStorage.removeItem("smartbin_token");
        localStorage.removeItem("smartbin_user");
      } finally {
        setIsLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("smartbin_token", newToken);
    localStorage.setItem("smartbin_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("smartbin_token");
    localStorage.removeItem("smartbin_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
