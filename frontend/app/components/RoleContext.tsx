"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type Role = "admin" | "warga";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("warga");

  useEffect(() => {
    const savedRole = localStorage.getItem("smartbin_role") as Role;
    if (savedRole && savedRole !== "warga") {
      // Async update to avoid synchronous setState ESLint error and hydration mismatch
      const timer = setTimeout(() => setRole(savedRole), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSetRole = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem("smartbin_role", newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole: handleSetRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
