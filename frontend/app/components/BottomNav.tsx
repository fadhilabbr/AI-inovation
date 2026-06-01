"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

/* ─────────────────────────────────────────────────────
   Nav items config
───────────────────────────────────────────────────── */
const ADMIN_ITEMS = [
  { href: "/adminpage",  icon: "📊", label: "Dasbor" },
  { href: "/bins",       icon: "🗑️", label: "TPS" },
  { href: "/users",      icon: "👥", label: "Warga" },
  { href: "#profile",    icon: "🛡️", label: "Profil" }, // special — opens modal
];

const USER_ITEMS = [
  { href: "/",                 icon: "🏠", label: "Dashboard" },
  { href: "/isi-tong",         icon: "🗑️", label: "Isi Tong" },
  { href: "/rekomendasi-diy",  icon: "✨", label: "Rekomendasi" },
  { href: "#profile",          icon: "👤", label: "Profil" },
];

/* ─────────────────────────────────────────────────────
   Profile Sheet — slides up from bottom
───────────────────────────────────────────────────── */
function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    onClose();
    router.push("/login");
  };

  const isAdmin = user.role === "admin";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/35 z-[100] animate-[fadeIn_0.2s_ease]"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-3xl pb-8 animate-[slideUp_0.25s_ease] max-w-[600px] mx-auto">
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Avatar & Info */}
        <div
          className={`mx-5 mt-4 rounded-[18px] p-5 flex items-center gap-4 ${
            isAdmin ? "bg-gradient-to-br from-green-900 to-green-800" : "bg-gradient-to-br from-[#338a3e] to-[#558b2f]"
          }`}
        >
          {/* Avatar circle */}
          <div className="w-14 h-14 rounded-full bg-white/25 border-2 border-white/40 flex items-center justify-center text-xl font-extrabold text-white shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-white font-extrabold text-[1.05rem] font-[family-name:var(--font-heading)]">
              {user.name}
            </div>
            <div className="text-white/75 text-[0.82rem] mt-0.5">
              {user.email}
            </div>
            <div className="inline-block mt-1.5 bg-white/20 text-white text-[0.72rem] font-bold py-0.5 px-2.5 rounded-full">
              {isAdmin ? "🛡️ Admin DLHK" : "🌱 Warga"}
            </div>
          </div>
        </div>



        {/* Menu items */}
        <div className="mx-5 flex flex-col gap-2">
          {isAdmin ? (
            <>
              <SheetMenuItem href="/adminpage" icon="📊" label="Dasbor Admin" onClick={onClose} />
              <SheetMenuItem href="/bins" icon="🗑️" label="Manajemen TPS" onClick={onClose} />
              <SheetMenuItem href="/users" icon="👥" label="Data Warga" onClick={onClose} />
            </>
          ) : (
            <>
              <SheetMenuItem href="/" icon="🏠" label="Dashboard" onClick={onClose} />
              <SheetMenuItem href="/isi-tong" icon="🗑️" label="Isi Tong" onClick={onClose} />
              <SheetMenuItem href="/rekomendasi-diy" icon="✨" label="Rekomendasi DIY" onClick={onClose} />
            </>
          )}
        </div>

        {/* Logout */}
        <div className="mx-5 mt-4">
          <button
            onClick={handleLogout}
            className="w-full p-3.5 rounded-2xl border-none bg-red-50 hover:bg-red-100 text-red-500 font-bold text-[0.95rem] font-[family-name:var(--font-heading)] cursor-pointer flex items-center justify-center gap-2 transition-colors duration-200"
          >
            🚪 Keluar dari Akun
          </button>
        </div>
      </div>
    </>
  );
}

function SheetMenuItem({ href, icon, label, onClick }: { href: string; icon: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3.5 py-3.5 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl no-underline text-gray-800 font-semibold text-sm transition-colors duration-150"
    >
      <span className="text-[1.2rem]">{icon}</span>
      {label}
      <span className="ml-auto text-gray-400 text-xs">›</span>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────
   Main Bottom Nav Bar
───────────────────────────────────────────────────── */
export default function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const items = user?.role === "admin" ? ADMIN_ITEMS : USER_ITEMS;

  return (
    <>
      {/* Inject keyframe animations once */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white/95 backdrop-blur-xl border-t border-gray-100 flex items-center justify-around z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] max-w-[600px] mx-auto">
        {items.map((item) => {
          const isProfile = item.href === "#profile";
          const isActive = !isProfile && (
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          );

          if (isProfile) {
            return (
              <button
                key="profile"
                onClick={() => setProfileOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 h-full bg-transparent border-none cursor-pointer p-0 hover:scale-105 transition-transform"
              >
                <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#338a3e] to-[#558b2f] flex items-center justify-center text-[1.1rem] shadow-[0_2px_10px_rgba(51,138,62,0.35)] transition-transform duration-200">
                  {item.icon}
                </div>
                <span className="text-[0.65rem] font-semibold text-[#338a3e]">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 h-full no-underline relative group"
            >
              {/* Active indicator line top */}
              {isActive && (
                <div className="absolute top-0 w-7 h-[3px] rounded-b bg-gradient-to-r from-[#338a3e] to-green-500" />
              )}

              <div className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center text-[1.2rem] transition-colors duration-200 group-hover:scale-105 ${isActive ? 'bg-green-50' : 'bg-transparent'}`}>
                {item.icon}
              </div>
              <span className={`text-[0.65rem] transition-colors duration-200 ${isActive ? 'font-bold text-[#338a3e]' : 'font-medium text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Profile Sheet */}
      {profileOpen && <ProfileSheet onClose={() => setProfileOpen(false)} />}

      {/* Spacer so content is not hidden behind nav */}
      <div style={{ height: "72px" }} />
    </>
  );
}
