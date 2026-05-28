"use client";
import { useAuth } from "./AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import ClientSidebar from "./ClientSidebar";
import AdminAlert from "./AdminAlert";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (!isLoading) {
      if (!user && !isAuthPage) {
        router.replace("/login");
      } else if (user && isAuthPage) {
        router.replace("/");
      }
    }
  }, [user, isLoading, isAuthPage, router]);

  // Show blank screen while checking auth
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-gradient)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🗑️</div>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-heading)", fontSize: "1.2rem" }}>Memuat SmartBin...</p>
        </div>
      </div>
    );
  }

  // Auth pages: no sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected pages: show sidebar + content
  if (!user) return null;

  return (
    <>
      {user.role === "admin" && <AdminAlert />}
      <div className="layout-container">
        <ClientSidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  );
}
