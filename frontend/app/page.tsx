"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "./components/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  trash_type: string;
  weight_kg: number;
  volume_percent: number;
}

const MATERIAL_ICONS: Record<string, string> = {
  Plastic: "🧴", Paper: "📄", Metal: "🔩",
  Glass: "🍾", Organic: "🥬", Other: "📦",
};

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [recentLogs, setRecentLogs] = useState<SensorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const baseUrl = "https://ai-inovation-production-7362.up.railway.app";

  useEffect(() => {
    if (user?.role === "admin") { router.push("/adminpage"); return; }

    let isMounted = true;

    async function loadData() {
      try {
        const [resSummary, resLogs] = await Promise.all([
          fetch(`/api/v1/dashboard/summary`, { cache: "no-store" }),
          fetch(`/api/v1/dashboard/recent-logs?limit=5`, { cache: "no-store" }),
        ]);
        if (!isMounted) return;
        if (resSummary.ok) setData(await resSummary.json());
        if (resLogs.ok) setRecentLogs(await resLogs.json());
      } catch (err) {
        console.error("Gagal memuat data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    const interval = setInterval(async () => {
      if (!isMounted) return;
      setIsRefreshing(true);
      try {
        const [resSummary, resLogs] = await Promise.all([
          fetch(`${baseUrl}/api/v1/analytics/summary`, { cache: "no-store" }),
          fetch(`${baseUrl}/api/v1/analytics/recent-logs?limit=5`, { cache: "no-store" }),
        ]);
        if (!isMounted) return;
        if (resSummary.ok) setData(await resSummary.json());
        if (resLogs.ok) setRecentLogs(await resLogs.json());
      } catch {}
      finally { if (isMounted) setIsRefreshing(false); }
    }, 4000);

    return () => { isMounted = false; clearInterval(interval); };
  }, [baseUrl, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-br from-green-50 to-gray-100">
        <div className="text-5xl animate-spin">
          
        </div>
        <p className="text-green-800 text-lg font-semibold">Memuat EcoCraft...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="animate-fade-in pb-10">

      {/* Hero Banner */}
      <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-green-700 to-green-900 text-white p-5 shadow-lg shadow-green-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-4 w-16 h-16 rounded-full bg-white/5 translate-y-8" />
        <h3 className="text-xs text-white/70 mb-1 font-bold uppercase tracking-widest">Target Dampak Minggu Ini</h3>
        <div className="flex justify-between items-center mb-3">
          <div className="text-3xl font-extrabold text-yellow-300">85% <span className="text-lg font-semibold text-white/80">Tercapai</span></div>
          <div className="text-3xl animate-bounce">🍃</div>
        </div>
        <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden mb-3">
          <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-yellow-300 to-lime-300" />
        </div>
        <p className="text-sm italic text-white/90 font-medium m-0">
          Luar biasa! Daur ulang Anda menyelamatkan 12 pohon bulan ini. 🌲
        </p>
        {isRefreshing && (
          <span className="absolute top-3 right-3 text-xs bg-white/15 text-white px-2.5 py-0.5 rounded-full">
            🔄 Syncing...
          </span>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 px-4 mt-4">
        {[
          { label: "Total Tong", value: data?.total_bins ?? 0, icon: "🗑️", color: "text-green-700" },
          { label: "Aktif", value: data?.active_bins ?? 0, icon: "✅", color: "text-emerald-600" },
          { label: "Penuh", value: data?.full_bins ?? 0, icon: "⚠️", color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3.5 shadow-sm text-center border border-gray-50">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-[0.68rem] text-gray-400 font-semibold mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ESP32-CAM Section */}
      <div className="flex justify-between items-center mx-4 mt-5 mb-3">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          📷 Deteksi ESP32-CAM
        </h2>
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          LIVE
        </span>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 p-4">
          {recentLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">⌛</div>
              <p className="text-sm font-medium">Belum ada foto sampah terdeteksi.</p>
              <p className="text-xs mt-1 text-gray-400">Nyalakan ESP32-CAM untuk mulai deteksi otomatis.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentLogs.map((log, idx) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                const icon = MATERIAL_ICONS[log.trash_type] || "📦";
                return (
                  <div key={log.id} className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all ${idx === 0 ? "bg-gradient-to-r from-green-50 to-white border-green-200 shadow-sm" : "bg-gray-50 border-gray-100"}`}>
                    <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-xl flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-gray-800 truncate">
                          {log.trash_type === "None" ? "Bukan Sampah" : log.trash_type}
                        </span>
                        <span className="text-[0.7rem] text-gray-400 font-semibold ml-2 flex-shrink-0">{timeStr}</span>
                      </div>
                      <div className="flex gap-2.5 mt-1 text-xs text-gray-400">
                        <span>⚖️ {log.weight_kg} kg</span>
                        <span>•</span>
                        <span>📦 Vol: {log.volume_percent}%</span>
                      </div>
                    </div>
                    {idx === 0 && (
                      <span className="text-[0.6rem] font-extrabold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        BARU
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Komposisi Ringkasan */}
      <div className="flex justify-between items-center mx-4 mt-5 mb-3">
        <h2 className="text-sm font-bold text-gray-800">📊 Komposisi Sampah</h2>
        <Link href="/isi-tong" className="text-xs font-bold text-green-600 hover:text-green-800 transition-colors">
          Lihat Detail →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4">
        <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-4 shadow-sm border border-gray-50">
          <div className="text-2xl mb-2">🧴</div>
          <div className="font-bold text-sm text-gray-800">Plastik</div>
          <div className="text-xs text-gray-400 mt-0.5 mb-3">
            {data?.total_trash_collected_kg ? (data.total_trash_collected_kg * 0.5).toFixed(2) : "0.00"} kg • Terbanyak
          </div>
          <div className="text-[0.6rem] font-bold uppercase text-gray-400 tracking-wider mb-1">Rekomendasi</div>
          <div className="text-xs font-bold text-green-800 bg-green-100 px-2 py-1 rounded-lg">Pot Tanaman / Ecobrick</div>
        </div>
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-4 shadow-sm border border-gray-50">
          <div className="text-2xl mb-2">📄</div>
          <div className="font-bold text-sm text-gray-800">Kertas & Karton</div>
          <div className="text-xs text-gray-400 mt-0.5 mb-3">
            {data?.total_trash_collected_kg ? (data.total_trash_collected_kg * 0.3).toFixed(2) : "0.00"} kg • Kering
          </div>
          <div className="text-[0.6rem] font-bold uppercase text-gray-400 tracking-wider mb-1">Rekomendasi</div>
          <div className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-1 rounded-lg">Kotak Hadiah Eco</div>
        </div>
      </div>

      {/* CTA Rekomendasi */}
      <div className="px-4 mt-4">
        <Link href="/rekomendasi-diy" className="flex items-center gap-4 bg-gradient-to-r from-indigo-700 to-blue-700 text-white rounded-2xl p-4 shadow-lg shadow-indigo-900/20 no-underline hover:from-indigo-800 hover:to-blue-800 transition-all">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-2xl flex-shrink-0">✨</div>
          <div>
            <div className="font-bold text-sm">Rekomendasi DIY dari AI</div>
            <div className="text-xs text-white/70 mt-0.5">Dapatkan ide kreatif dari Gemini berdasarkan isi tong Anda</div>
          </div>
          <span className="ml-auto text-white/60 text-lg">›</span>
        </Link>
      </div>

    </div>
  );
}
