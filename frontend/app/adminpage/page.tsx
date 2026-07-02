"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext";

interface AnalyticsSummary {
  total_bins: number;
  active_bins: number;
  full_bins: number;
  total_trash_collected_kg: number;
  top_materials: { type: string; percentage: number }[];
}

interface SensorLog {
  id: number;
  bin_id: string;
  timestamp: string;
  gps_lat: number;
  gps_long: number;
  trash_type: string;
  weight_kg: number;
  volume_percent: number;
}

const MATERIAL_ICONS: Record<string, string> = {
  Plastic: "🧴",
  Paper: "📄",
  Metal: "🔩",
  Glass: "🍾",
  Organic: "🥬",
  Other: "📦",
};

const MATERIAL_COLORS: string[] = [
  "#338a3e",
  "#0ea5e9",
  "#facc15",
  "#ef4444",
  "#a855f7",
  "#6b7280",
];

export default function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [recentLogs, setRecentLogs] = useState<SensorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined"
      ? `http://${window.location.hostname}:8000`
      : "http://127.0.0.1:8000");

  const fetchData = async () => {
    try {
      const [resSummary, resLogs] = await Promise.all([
        fetch(`${baseUrl}/api/v1/analytics/summary`, { cache: "no-store" }),
        fetch(`${baseUrl}/api/v1/analytics/recent-logs?limit=5`, { cache: "no-store" }),
      ]);

      if (!resSummary.ok) throw new Error("Gagal memuat analitik");

      setData(await resSummary.json());

      if (resLogs.ok) {
        setRecentLogs(await resLogs.json());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Gagal menghubungi backend";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Defer initial fetch to avoid calling setState synchronously inside the effect
    const init = () => setTimeout(() => void fetchData(), 0);
    init();

    // Auto-refresh admin statistics and logs every 4 seconds
    const timer = setInterval(() => {
      setIsRefreshing(true);
      fetchData().then(() => setIsRefreshing(false));
    }, 4000);

    return () => {
      clearInterval(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh] flex-col gap-3">
        <div className="text-[2.5rem] animate-[spin_1.5s_linear_infinite]">♻️</div>
        <p className="text-gray-500 text-base font-(family-name:--font-heading) m-0">Memuat dasbor admin...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 m-6 text-center p-10">
        <div className="text-[3rem] mb-4">⚠️</div>
        <h2 className="text-gray-800 mb-2">Backend Offline</h2>
        <p className="text-gray-500 m-0">Pastikan backend FastAPI Anda berjalan di port 8000.</p>
        {error && (
          <p className="text-red-500 text-[0.85rem] bg-red-50 py-2 px-4 rounded-lg mt-4 mb-0">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 m-6 text-center p-10">
        <div className="text-[3rem] mb-4">🔒</div>
        <h2 className="text-red-500 m-0">Akses Ditolak</h2>
        <p className="text-gray-500 mt-2 mb-0">Halaman ini hanya dapat diakses oleh Admin DLHK.</p>
      </div>
    );
  }

  const fillPercent = data.total_bins > 0 ? Math.round((data.full_bins / data.total_bins) * 100) : 0;

  return (
    <div className="animate-[fadeIn_0.5s_ease-out_forwards] pb-10">

      {/* Header */}
      <div className="mx-4 mt-4 rounded-2xl bg-linear-to-br from-green-700 to-green-900 text-white p-5 shadow-lg shadow-green-900/20 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-4 w-16 h-16 rounded-full bg-white/5 translate-y-8" />

        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-white/75 text-[0.85rem] m-0 mb-1 font-medium">
              Selamat datang,
            </p>
            <h1 className="text-white text-[1.6rem] m-0 mb-1 font-(family-name:--font-heading) font-extrabold">
              {user.name} 🛡️
            </h1>
            <p className="text-white/70 text-[0.85rem] m-0">
              Dasbor Admin DLHK — Sistem SmartBin
            </p>
          </div>
          {isRefreshing && (
            <span className="text-[0.65rem] text-white bg-white/15 py-1 px-2 rounded-full font-bold">
              🔄 Sync...
            </span>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-4">
        {/* Total Bins */}
        <div className="bg-white rounded-2xl p-4 flex flex-col gap-1 border border-black/5 shadow-sm">
          <div className="text-2xl">🗑️</div>
          <div className="text-[0.75rem] text-gray-500 font-semibold uppercase tracking-wider">Total TPS</div>
          <div className="text-2xl font-extrabold text-green-800 font-(family-name:--font-heading)">
            {data.total_bins}
          </div>
        </div>

        {/* Active Bins */}
        <div className="bg-white rounded-2xl p-4 flex flex-col gap-1 border border-black/5 shadow-sm">
          <div className="text-2xl">✅</div>
          <div className="text-[0.75rem] text-gray-500 font-semibold uppercase tracking-wider">Aktif</div>
          <div className="text-2xl font-extrabold text-sky-500 font-(family-name:--font-heading)">
            {data.active_bins}
          </div>
        </div>

        {/* Full Bins */}
        <div className="bg-white rounded-2xl p-4 flex flex-col gap-1 border border-black/5 shadow-sm">
          <div className="text-2xl">⚠️</div>
          <div className="text-[0.75rem] text-gray-500 font-semibold uppercase tracking-wider">Penuh</div>
          <div className="text-2xl font-extrabold text-red-500 font-(family-name:--font-heading)">
            {data.full_bins}
          </div>
        </div>

        {/* Total Trash */}
        <div className="bg-white rounded-2xl p-4 flex flex-col gap-1 border border-black/5 shadow-sm">
          <div className="text-2xl">⚖️</div>
          <div className="text-[0.75rem] text-gray-500 font-semibold uppercase tracking-wider">Terkumpul</div>
          <div className="text-2xl font-extrabold text-amber-500 font-(family-name:--font-heading)">
            {data.total_trash_collected_kg.toLocaleString()}<span className="text-sm font-medium"> kg</span>
          </div>
        </div>
      </div>

      {/* Capacity Status Card */}
      <div className="p-4">
        <div className="bg-linear-to-br from-green-50 to-white border border-green-100 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-[0.8rem] text-gray-500 m-0 font-semibold">Kapasitas Jaringan</p>
              <p className={`text-[1.4rem] font-extrabold m-0 font-(family-name:--font-heading) ${fillPercent > 70 ? "text-red-500" : "text-green-700"}`}>
                {fillPercent}% Terisi
              </p>
            </div>
            <div className="text-3xl">{fillPercent > 70 ? "🔴" : "🟢"}</div>
          </div>
          <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${fillPercent > 70 ? "bg-linear-to-r from-amber-500 to-red-500" : "bg-linear-to-r from-green-700 to-lime-500"}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <p className="text-[0.8rem] text-gray-500 mt-2 mb-0 italic">
            {data.full_bins} dari {data.total_bins} tempat sampah sudah penuh dan butuh dikosongkan.
          </p>
        </div>
      </div>

      {/* Live ESP32-CAM Log Feed for Admins */}
      <div className="px-4 pb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[1.05rem] font-bold m-0 flex items-center gap-1.5 text-gray-800">
            <span>📹</span> Aktivitas Kamera ESP32-CAM
          </h2>
          <span className="text-[0.65rem] text-emerald-500 bg-emerald-50 py-0.5 px-2 rounded-full font-bold">LIVE</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          {(() => {
            const validLogs = recentLogs.filter(log => log.trash_type !== "None" && log.trash_type !== null);
            return validLogs.length === 0 ? (
              <p className="text-gray-500 italic text-center text-[0.85rem] my-4">
                Belum ada log aktivitas dari ESP32-CAM.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {validLogs.map((log, idx) => {
                  const icon = MATERIAL_ICONS[log.trash_type] || "📦";
                  const date = new Date(log.timestamp);
                  const timeStr = date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  
                  return (
                    <div key={log.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${idx === 0 ? "bg-linear-to-br from-green-50 to-emerald-50 border-green-300 shadow-[0_2px_8px_rgba(16,185,129,0.1)]" : "bg-slate-50 border-slate-100"}`}>
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1">
                          <div className="font-bold text-[0.9rem] text-gray-800 mb-1">
                            {log.trash_type} • {log.bin_id}
                          </div>
                          <div className="flex gap-4 text-[0.75rem] text-gray-500 font-semibold">
                            <span>⚖️ {log.weight_kg}kg</span>
                            <span>📏 {log.volume_percent}%</span>
                            {log.gps_lat !== 0 && log.gps_long !== 0 && (
                              <span>📍 {log.gps_lat.toFixed(4)}, {log.gps_long.toFixed(4)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[0.75rem] text-gray-400 font-semibold whitespace-nowrap ml-3">
                        {timeStr}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Material Breakdown */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[1.05rem] font-bold m-0 text-gray-800">📊 Komposisi Material</h2>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
          <div className="flex flex-col gap-4">
            {data.top_materials.length === 0 && (
              <p className="text-gray-500 italic text-center m-0">Belum ada data material.</p>
            )}
            {data.top_materials.map((material, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[1.1rem]">
                      {MATERIAL_ICONS[material.type] || "📦"}
                    </span>
                    <span className="font-semibold text-[0.9rem] capitalize text-gray-800">
                      {material.type}
                    </span>
                  </div>
                  <span
                    className="text-[0.85rem] font-bold py-0.5 px-2.5 rounded-full"
                    style={{
                      color: MATERIAL_COLORS[index % MATERIAL_COLORS.length],
                      backgroundColor: `${MATERIAL_COLORS[index % MATERIAL_COLORS.length]}18`
                    }}
                  >
                    {material.percentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${material.percentage}%`,
                      backgroundColor: MATERIAL_COLORS[index % MATERIAL_COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
