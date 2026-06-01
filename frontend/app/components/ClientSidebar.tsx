"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";

const NavItems = ({ role, onLogout }: { role: string, onLogout: () => void }) => {
  const itemClass = "flex items-center gap-3 py-3 px-4 rounded-xl text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors no-underline font-semibold text-[0.95rem] w-full text-left";
  const iconClass = "text-[1.2rem]";

  if (role === "admin") {
    return (
      <>
        <Link href="/adminpage" className={itemClass}>
          <span className={iconClass}>📊</span>
          <span>Dasbor</span>
        </Link>
        <Link href="/bins" className={itemClass}>
          <span className={iconClass}>🗑️</span>
          <span>Manajemen</span>
        </Link>
        <Link href="/users" className={itemClass}>
          <span className={iconClass}>👥</span>
          <span>Warga</span>
        </Link>
        <button onClick={onLogout} className={`${itemClass} md:hidden bg-transparent border-none cursor-pointer`}>
          <span className={iconClass}>🚪</span>
          <span className="text-red-500">Keluar</span>
        </button>
      </>
    );
  }
  return (
    <>
      <Link href="/" className={itemClass}>
        <span className={iconClass}>🌍</span>
        <span>Beranda</span>
      </Link>
      <Link href="/nearby-bins" className={itemClass}>
        <span className={iconClass}>📍</span>
        <span>Cari Tong</span>
      </Link>
      <Link href="/users" className={itemClass}>
        <span className={iconClass}>🎁</span>
        <span>Profil</span>
      </Link>
      <button onClick={onLogout} className={`${itemClass} md:hidden bg-transparent border-none cursor-pointer`}>
        <span className={iconClass}>🚪</span>
        <span className="text-red-500">Keluar</span>
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
    <div className="flex flex-col gap-3">
      {/* User profile card */}
      <div className="p-3.5 bg-white/70 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-extrabold text-[0.9rem] ${user.role === "admin" ? "bg-gradient-to-br from-indigo-500 to-purple-500" : "bg-gradient-to-br from-green-700 to-sky-500"}`}>
            {initials}
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-[0.9rem] text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
              {user.name}
            </div>
            <div className="text-[0.75rem] text-gray-500">
              {user.role === "admin" ? "🛡️ Admin DLHK" : "👤 Warga"}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2 px-3 rounded-xl border-none bg-red-50 text-red-500 font-semibold text-[0.85rem] cursor-pointer transition-colors hover:bg-red-100"
        >
          Keluar →
        </button>
      </div>

      <div className="p-2.5 bg-white/50 rounded-xl text-center">
        <p className="text-[0.75rem] text-gray-500 m-0">Sistem: 🟢 Online</p>
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
      <aside className="hidden md:flex flex-col w-[260px] h-screen fixed left-0 top-0 bg-white border-r border-gray-200 p-5 z-40">
        <div className="flex items-center gap-2 font-[family-name:var(--font-heading)] font-extrabold text-2xl text-green-800 mb-8 px-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          SmartBin
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
          <NavItems role={user?.role || "warga"} onLogout={handleLogout} />
        </nav>

        <div className="hidden md:block mt-auto">
          <UserBadge />
        </div>
      </aside>
    </>
  );
}
