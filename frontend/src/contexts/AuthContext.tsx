"use client";

import React, { createContext, useContext, useState } from "react";

// Feature: api-authentication-strategy
// Requirements: 7.3, 7.4, 8.2, 8.7

export interface AuthState {
  user: { email: string; role: "admin" | "editor" | "reader" } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (role: "admin" | "editor" | "reader", email: string) => void;
  logout: () => void;
  setUser: (user: { email: string; role: "admin" | "editor" | "reader" } | null) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthState["user"]>(null);
  const [isLoading] = useState(false);

  const isAuthenticated = user !== null;

  const login = (role: "admin" | "editor" | "reader", email: string) => {
    setUserState({ email, role });
  };

  const logout = () => {
    setUserState(null);
  };

  const setUser = (newUser: AuthState["user"]) => {
    setUserState(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
