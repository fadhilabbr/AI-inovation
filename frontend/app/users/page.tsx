"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext";
import { apiClient } from "../lib/api-client";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [wargaList, setWargaList] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : "http://127.0.0.1:8000");

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (currentUser.role === "admin") {
          // Admin: fetch all users
          const res = await apiClient.fetch(`/api/v1/users`);
          if (!res.ok) throw new Error("Gagal mengambil data warga");
          const data = await res.json();
          setWargaList(data);
        } else {
          // Warga: nothing specific to fetch anymore since we removed points/rewards
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, baseUrl]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <p className="text-gray-500 text-[1.1rem] m-0">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-md text-red-500 p-5 rounded-xl border border-red-100 shadow-sm m-4">
        <h3 className="m-0 mb-2">Error</h3>
        <p className="m-0">{error}</p>
      </div>
    );
  }

  if (!currentUser) return null;

  // Render Admin View
  if (currentUser.role === "admin") {
    return (
      <div className="animate-[fadeIn_0.5s_ease-out_forwards] pb-10">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-900 via-green-800 to-green-700 pt-8 px-5 pb-10 relative overflow-hidden shadow-[0_4px_15px_rgba(27,94,32,0.15)]">
          {/* decorative circles */}
          <div className="absolute -top-7 -right-7 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-white/5 rounded-full" />

          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-white/75 text-[0.85rem] m-0 mb-1 font-medium">
                Manajemen Pengguna
              </p>
              <h1 className="text-white text-[1.6rem] m-0 mb-1 font-[family-name:var(--font-heading)] font-extrabold">
                Daftar Warga 👥
              </h1>
              <p className="text-white/70 text-[0.85rem] m-0">
                Pantau daftar pengguna yang terdaftar di sistem SmartBin
              </p>
            </div>
          </div>
        </div>

        {/* Stats Header */}
        <div className="grid grid-cols-1 gap-3 px-4 -mt-6 relative z-10">
          {/* Total Users */}
          <div className="bg-white rounded-2xl p-4 flex flex-col gap-1 border border-black/5 shadow-sm">
            <div className="text-2xl">👥</div>
            <div className="text-[0.75rem] text-gray-500 font-semibold uppercase tracking-wider">Total Warga</div>
            <div className="text-2xl font-extrabold text-green-800 font-[family-name:var(--font-heading)]">
              {wargaList.length}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="p-4 mt-2">
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-slate-100 bg-black/2">
                    <th className="p-4 text-green-900 font-bold text-[0.9rem]">Nama</th>
                    <th className="p-4 text-green-900 font-bold text-[0.9rem]">Email</th>
                    <th className="p-4 text-green-900 font-bold text-[0.9rem]">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {wargaList.map((warga) => (
                    <tr key={warga.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                      <td className="p-4 font-semibold text-[0.95rem]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-900 to-green-700 text-white flex items-center justify-center text-[0.9rem] font-bold">
                            {warga.name.charAt(0).toUpperCase()}
                          </div>
                          {warga.name}
                        </div>
                      </td>
                      <td className="p-4 text-gray-500 text-[0.9rem]">{warga.email}</td>
                      <td className="p-4">
                        <span className={`py-1 px-2.5 rounded-md text-[0.8rem] font-bold ${
                          warga.role === "admin" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {warga.role === "admin" ? "🛡️ Admin" : "👤 Warga"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Warga View
  return (
    <div className="animate-[fadeIn_0.5s_ease-out_forwards] pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-900 via-green-800 to-green-700 pt-8 px-5 pb-10 relative overflow-hidden shadow-[0_4px_15px_rgba(27,94,32,0.15)]">
        <div className="absolute -top-7 -right-7 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-white/5 rounded-full" />

        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-white/75 text-[0.85rem] m-0 mb-1 font-medium">
              Selamat datang,
            </p>
            <h1 className="text-white text-[1.6rem] m-0 mb-1 font-[family-name:var(--font-heading)] font-extrabold">
              {currentUser.name} ♻️
            </h1>
            <p className="text-white/70 text-[0.85rem] m-0">
              Pantau Daur Ulang Anda — SmartBin
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl p-6 flex items-center gap-5 border border-black/5 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-900 to-green-700 text-white flex items-center justify-center text-3xl font-bold shadow-[0_4px_15px_rgba(27,94,32,0.3)]">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="m-0 mb-1 text-green-900 text-[1.2rem] font-bold">
              {currentUser.name}
            </h2>
            <p className="m-0 text-gray-500 text-[0.85rem]">
              {currentUser.email}
            </p>
            <div className="mt-2 text-[0.85rem] text-emerald-500 font-semibold">
              👤 Pengguna Terdaftar
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="px-4 mt-2">
        <h2 className="text-[1.05rem] font-bold m-0 my-4 flex items-center gap-1.5 text-gray-800">
          <span>💡</span> Tips Daur Ulang
        </h2>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-3 p-3 bg-amber-50 rounded-xl border-l-4 border-amber-500">
              <span className="text-[1.2rem]">♻️</span>
              <div>
                <div className="font-bold text-[0.85rem] text-gray-800">Pisahkan sampah sejak awal</div>
                <div className="text-[0.75rem] text-gray-500">Plastik, kertas, logam, dan kaca perlu dipisah untuk daur ulang optimal</div>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-blue-50 rounded-xl border-l-4 border-sky-500">
              <span className="text-[1.2rem]">🎯</span>
              <div>
                <div className="font-bold text-[0.85rem] text-gray-800">Bersihkan kemasan plastik</div>
                <div className="text-[0.75rem] text-gray-500">Kemasan kotor akan sulit diproses dalam daur ulang</div>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-green-50 rounded-xl border-l-4 border-emerald-500">
              <span className="text-[1.2rem]">📍</span>
              <div>
                <div className="font-bold text-[0.85rem] text-gray-800">Temukan TPS terdekat</div>
                <div className="text-[0.75rem] text-gray-500">Gunakan fitur peta untuk menemukan tempat pengumpulan sampah terdekat</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
