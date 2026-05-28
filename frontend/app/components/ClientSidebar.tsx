"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";

const NavItems = ({ role, onLogout }: { role: string, onLogout: () => void }) => {
  if (role === "admin") {
    return (
      <>
        <Link href="/" className="nav-item">
          <span className="nav-icon">📊</span>
          <span className="nav-label">Dasbor</span>
        </Link>
        <Link href="/bins" className="nav-item">
          <span className="nav-icon">🗑️</span>
          <span className="nav-label">Manajemen</span>
        </Link>
        <Link href="/users" className="nav-item">
          <span className="nav-icon">👥</span>
          <span className="nav-label">Warga</span>
        </Link>
        <button onClick={onLogout} className="nav-item mobile-only" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
          <span className="nav-icon">🚪</span>
          <span className="nav-label" style={{ color: "var(--color-danger)" }}>Keluar</span>
        </button>
      </>
    );
  }
  return (
    <>
      <Link href="/" className="nav-item">
        <span className="nav-icon">🌍</span>
        <span className="nav-label">Beranda</span>
      </Link>
      <Link href="/nearby-bins" className="nav-item">
        <span className="nav-icon">📍</span>
        <span className="nav-label">Cari Tong</span>
      </Link>
      <Link href="/users" className="nav-item">
        <span className="nav-icon">🎁</span>
        <span className="nav-label">Profil</span>
      </Link>
      <button onClick={onLogout} className="nav-item mobile-only" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
        <span className="nav-icon">🚪</span>
        <span className="nav-label" style={{ color: "var(--color-danger)" }}>Keluar</span>
      </button>
    </>
  );
};

const UserBadge = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* User profile card */}
      <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.7)", borderRadius: "14px", border: "1px solid var(--glass-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
            background: user.role === "admin"
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: "800", fontSize: "0.9rem"
          }}>
            {initials}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {user.role === "admin" ? "🛡️ Admin DLHK" : "👤 Warga"}
            </div>
          </div>
        </div>

        {user.role === "warga" && (
          <div style={{ padding: "8px 12px", background: "rgba(16,185,129,0.08)", borderRadius: "8px", textAlign: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--color-primary-dark)", fontWeight: "700" }}>
              🏆 {user.points.toLocaleString()} Poin
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "8px 12px", borderRadius: "10px", border: "none",
            background: "rgba(239,68,68,0.08)", color: "var(--color-danger)", fontWeight: "600",
            fontSize: "0.85rem", cursor: "pointer", transition: "background 0.2s"
          }}
        >
          Keluar →
        </button>
      </div>

      <div style={{ padding: "10px", background: "rgba(255,255,255,0.5)", borderRadius: "12px", textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>Sistem: 🟢 Online</p>
      </div>
    </div>
  );
};

export default function ClientSidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          SmartBin
        </div>

        <nav className="sidebar-nav">
          <NavItems role={user?.role || "warga"} onLogout={handleLogout} />
        </nav>

        <div className="desktop-only" style={{ marginTop: "auto" }}>
          <UserBadge />
        </div>
      </aside>
    </>
  );
}
