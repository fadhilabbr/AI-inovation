"use client";
import { useAuth } from "./AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import BottomNav from "./BottomNav";
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

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="text-[3rem] animate-[pulse_1.5s_ease-in-out_infinite]">♻️</div>
        <p className="text-gray-500 font-[family-name:var(--font-heading)] text-base font-semibold m-0">
          Memuat EcoCraft...
        </p>
      </div>
    );
  }

  // Auth pages — no nav
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Protected pages
  if (!user) return null;

  return (
    <>
      {user.role === "admin" && <AdminAlert />}
      <main className="max-w-[600px] mx-auto min-h-screen bg-gray-50 pb-[80px]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
