/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext";

interface SensorLog {
  id: number;
  bin_id: string;
  timestamp: string;
  trash_type: string;
  weight_kg: number;
  volume_percent: number;
}

interface BinComposition {
  bin_id: string;
  total_weight_kg: number;
  total_items: number;
  materials: {
    type: string;
    weight_kg: number;
    count: number;
    percentage: number;
  }[];
}

interface SmartBin {
  bin_id: string;
  location_name: string;
  capacity_percent: number;
  total_volume_liters: number;
  filled_volume_liters: number;
  gps_lat: number;
  gps_long: number;
  status?: string;
  region_id?: number | null;
  owner_id?: number | null;
}

interface Region {
  id: number;
  name: string;
  description: string;
}

const MATERIAL_CONFIG: Record<
  string,
  {
    icon: string;
    textClass: string;
    bgClass: string;
    barClass: string;
    label: string;
  }
> = {
  Plastic: {
    icon: "🧴",
    textClass: "text-sky-500",
    bgClass: "bg-sky-100",
    barClass: "bg-sky-500",
    label: "Plastik",
  },
  Paper: {
    icon: "📄",
    textClass: "text-amber-500",
    bgClass: "bg-amber-100",
    barClass: "bg-amber-500",
    label: "Kertas",
  },
  Metal: {
    icon: "🔩",
    textClass: "text-gray-500",
    bgClass: "bg-gray-100",
    barClass: "bg-gray-500",
    label: "Logam",
  },
  Glass: {
    icon: "🍾",
    textClass: "text-purple-500",
    bgClass: "bg-purple-100",
    barClass: "bg-purple-500",
    label: "Kaca",
  },
  Organic: {
    icon: "🥬",
    textClass: "text-green-500",
    bgClass: "bg-green-100",
    barClass: "bg-green-500",
    label: "Organik",
  },
  Other: {
    icon: "📦",
    textClass: "text-green-700",
    bgClass: "bg-green-50",
    barClass: "bg-green-700",
    label: "Lainnya",
  },
};

export default function IsiTongPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SensorLog[]>([]);
  const [compositions, setCompositions] = useState<BinComposition[]>([]);
  const [bins, setBins] = useState<SmartBin[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    bin_id: "",
    location_name: "",
    gps_lat: -6.2000,
    gps_long: 106.8166,
    total_volume_liters: 100,
    region_id: "" as string | number,
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined"
      ? `http://${window.location.hostname}:8000`
      : "http://127.0.0.1:8000");

  const loadData = async (isBackground = false) => {
    // If we have a logged in user and they are a "warga", filter bins by their ID. 
    // If admin, they see all bins.
    const queryParams = user && user.role === "warga" ? `?owner_id=${user.id}` : "";
    
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);
    try {
      const [resCompositions, resLogs, resBins, resRegions] = await Promise.all([
        fetch(`${baseUrl}/api/v1/analytics/composition-by-bin`, {
          cache: "no-store",
        }),
        fetch(`${baseUrl}/api/v1/analytics/recent-logs?limit=20`, {
          cache: "no-store",
        }),
        fetch(`${baseUrl}/api/v1/bins${queryParams}`, { cache: "no-store" }),
        fetch(`${baseUrl}/api/v1/regions`, { cache: "no-store" }),
      ]);
      if (resCompositions.ok) setCompositions(await resCompositions.json());
      if (resLogs.ok) setLogs(await resLogs.json());
      if (resBins.ok) setBins(await resBins.json());
      if (resRegions.ok) setRegions(await resRegions.json());
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      if (!isBackground) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Membungkus loadData dengan setTimeout untuk menghindari pemanggilan setState
    // secara sinkron yang menyebabkan error cascading renders di Next.js/React.
    const timeoutId = setTimeout(() => {
      loadData();
    }, 0);

    const intervalId = setInterval(() => loadData(true), 10000); // 10 seconds interval
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [baseUrl]);

  const handleAddBin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        bin_id: formData.bin_id,
        location_name: formData.location_name,
        gps_lat: formData.gps_lat,
        gps_long: formData.gps_long,
        total_volume_liters: formData.total_volume_liters,
        region_id: formData.region_id ? Number(formData.region_id) : null,
        owner_id: user ? user.id : null,
      };

      const res = await fetch(`${baseUrl}/api/v1/bins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        loadData(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitSuccess(false);
          setFormData({
            bin_id: "",
            location_name: "",
            gps_lat: -6.2000,
            gps_long: 106.8166,
            total_volume_liters: 100,
            region_id: "",
          });
        }, 1500);
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Gagal menambahkan tempat sampah.");
      }
    } catch (err) {
      console.error("Gagal menambahkan tempat sampah:", err);
      alert("Gagal menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalGlobalKg = compositions.reduce(
    (acc, bin) => acc + bin.total_weight_kg,
    0,
  );
  const volumeAvg =
    bins.length > 0
      ? Math.round(
          bins.reduce((a, b) => a + b.capacity_percent, 0) / bins.length,
        )
      : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="text-5xl animate-[spin_1.5s_linear_infinite]">🗑️</div>
        <p className="text-green-900 font-semibold">Memuat data tong...</p>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease-out_forwards] pb-6">
      {/* Header */}
      <div className="mx-4 mt-4 rounded-2xl bg-linear-to-br from-green-700 to-green-900 text-white p-5 shadow-lg shadow-green-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-4 w-16 h-16 rounded-full bg-white/5 translate-y-8" />

        <div className="flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-white text-[1.6rem] font-extrabold m-0 mb-1 font-(family-name:--font-heading)">
              🗑️ Isi Tong
            </h1>
            <p className="text-white/75 text-[0.85rem] m-0">
              Komposisi & berat sampah
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-green-800 border-none py-2.5 px-5 rounded-full font-bold cursor-pointer transition-colors hover:bg-green-50 shadow-sm text-[0.85rem]"
          >
            + Tambah Tempat Sampah
          </button>
        </div>
        {isRefreshing && (
          <div className="absolute top-2 right-2 text-[0.65rem] text-white bg-white/15 py-1 px-2 rounded-full font-bold z-10">
            🔄 Sync...
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.07)]">
          <div className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-wide mb-1">
            Total Dikumpulkan
          </div>
          <div className="text-[1.8rem] font-extrabold text-green-700 font-(family-name:--font-heading)">
            {totalGlobalKg.toFixed(1)}
            <span className="text-[0.9rem] font-medium text-gray-500"> kg</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Semua jenis sampah</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.07)]">
          <div className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-wide mb-1">
            Vol. Rata-rata Tong
          </div>
          <div
            className={`text-[1.8rem] font-extrabold font-(family-name:--font-heading) ${volumeAvg >= 85 ? "text-red-500" : volumeAvg >= 60 ? "text-amber-500" : "text-green-700"}`}
          >
            {volumeAvg}
            <span className="text-[0.9rem] font-medium text-gray-500">%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${volumeAvg >= 85 ? "bg-red-500" : volumeAvg >= 60 ? "bg-amber-500" : "bg-green-500"}`}
              style={{ width: `${volumeAvg}%` }}
            />
          </div>
        </div>
      </div>

      {/* Komposisi Sampah per Bin */}
      <div className="mt-5 mx-4 mb-3">
        <h2 className="text-base font-bold text-gray-800 m-0">
          📊 Komposisi per TPS
        </h2>
        <p className="text-[0.78rem] text-gray-500 mt-1 mb-0">
          Rincian sampah di setiap tong
        </p>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {bins.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm italic bg-white rounded-2xl shadow-sm">
            {'Belum ada tempat sampah terdaftar. Klik "+ Tambah Tempat Sampah" di atas untuk menambahkan.'}
          </div>
        ) : (
          bins.map((bin) => {
            const comp = compositions.find((c) => c.bin_id === bin.bin_id) || {
              bin_id: bin.bin_id,
              total_weight_kg: 0.0,
              total_items: 0,
              materials: [],
            };
            const isFull = bin.capacity_percent >= 85 || bin.status === "full";
            
            return (
              <div
                key={bin.bin_id}
                className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col gap-4"
              >
                {/* Bin Info Header */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="m-0 font-bold text-green-800 text-[1.1rem]">
                        📍 {bin.location_name}
                      </h3>
                      <span className={`text-[0.65rem] font-bold py-0.5 px-2 rounded-full ${isFull ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {isFull ? "PENUH" : "AKTIF"}
                      </span>
                    </div>
                    <p className="m-0 mt-1 text-xs text-gray-400 font-semibold flex items-center gap-1.5">
                      <span>🆔 {bin.bin_id}</span>
                      <span>•</span>
                      <span>🌐 Lat: {bin.gps_lat.toFixed(4)}, Long: {bin.gps_long.toFixed(4)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block font-extrabold text-green-700 text-lg">
                      {comp.total_weight_kg.toFixed(1)} <span className="text-xs font-semibold text-gray-400">kg</span>
                    </span>
                    <span className="block text-[0.7rem] text-gray-400 uppercase tracking-wide font-bold">
                      {comp.total_items} Item Terdeteksi
                    </span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5 border border-gray-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-500 flex items-center gap-1.5 flex-wrap">
                      <span>Kapasitas Terisi:</span>
                      <span className="font-bold text-gray-700">{(bin.filled_volume_liters || 0).toFixed(1)}L / {(bin.total_volume_liters || 100).toFixed(0)}L</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-medium text-green-700">Tersisa: {Math.max(0, (bin.total_volume_liters || 100) - (bin.filled_volume_liters || 0)).toFixed(1)}L</span>
                    </span>
                    <span className={`font-bold ${isFull ? "text-red-500" : "text-green-700"}`}>
                      {bin.capacity_percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${isFull ? "bg-red-500" : bin.capacity_percent >= 60 ? "bg-amber-500" : "bg-green-500"}`}
                      style={{ width: `${bin.capacity_percent}%` }}
                    />
                  </div>
                </div>

                {/* Materials Breakdown */}
                <div className="flex flex-col gap-3 mt-1">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Komposisi Material
                  </div>
                  {comp.materials.length === 0 ? (
                    <p className="text-xs text-gray-400 italic m-0 bg-gray-50/55 p-3 rounded-xl border border-dashed border-gray-200 text-center">
                      Belum ada sampah yang masuk ke tong ini.
                    </p>
                  ) : (
                    comp.materials.map((m) => {
                      const cfg =
                        MATERIAL_CONFIG[m.type] || MATERIAL_CONFIG.Other;
                      return (
                        <div key={m.type} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-gray-700 flex items-center gap-2">
                              <span className="text-base">{cfg.icon}</span> {cfg.label || m.type}
                            </span>
                            <div className="text-right">
                              <span className={`font-bold ${cfg.textClass} mr-2`}>
                                {m.percentage}%
                              </span>
                              <span className="text-gray-500 text-xs font-medium">
                                {m.weight_kg.toFixed(2)} kg
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${cfg.barClass}`}
                              style={{ width: `${m.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Log Terbaru */}
      <div className="mt-6 mx-4 mb-3">
        <h2 className="text-base font-bold text-gray-800 m-0 mb-0.5">
          📷 Deteksi Terbaru
        </h2>
        <p className="text-[0.78rem] text-gray-500 m-0">Live dari ESP32-CAM</p>
      </div>

      <div className="flex flex-col gap-2 px-4">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">⌛</div>
            <p className="m-0 text-sm">Belum ada deteksi sampah.</p>
          </div>
        ) : (
          logs.slice(0, 10).map((log, idx) => {
            const cfg =
              MATERIAL_CONFIG[log.trash_type] || MATERIAL_CONFIG.Other;
            const time = new Date(log.timestamp).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div
                key={log.id}
                className={`rounded-xl p-3 flex items-center gap-3 ${idx === 0 ? "bg-linear-to-br from-green-50 to-white border-[1.5px] border-green-200" : "bg-white border border-gray-100"}`}
              >
                <div
                  className={`w-9 h-9 rounded-lg ${cfg.bgClass} flex items-center justify-center text-lg shrink-0`}
                >
                  {cfg.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-gray-800">
                      {log.trash_type === "None" ? "Bukan Sampah" : cfg.label}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold">
                      {time}
                    </span>
                  </div>
                  <div className="flex gap-2.5 mt-1 text-[0.75rem] text-gray-500">
                    <span>⚖️ {log.weight_kg} kg</span>
                    <span>•</span>
                    <span>📦 {log.volume_percent}%</span>
                    <span>•</span>
                    <span>Tong {log.bin_id}</span>
                  </div>
                </div>
                {idx === 0 && (
                  <span className="text-[0.6rem] font-extrabold text-green-700 bg-green-100 py-0.5 px-2 rounded-full shrink-0">
                    BARU
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tambah Tempat Sampah Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-[420px] shadow-2xl p-6 sm:p-8 animate-[fadeIn_0.3s_ease-out_forwards]">
            {submitSuccess ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <h2 className="text-green-700 text-xl font-bold m-0 mb-2">
                  Berhasil Ditambahkan!
                </h2>
                <p className="text-gray-500 text-sm m-0">
                  Tempat sampah baru telah berhasil didaftarkan.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-green-800 text-xl font-bold m-0 font-(family-name:--font-heading)">
                    ➕ Tambah Tempat Sampah
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 bg-gray-100 border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-200 text-lg"
                  >
                    ×
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  Daftarkan unit SmartBin baru untuk ditempatkan di lokasi TPS tertentu.
                </p>

                <form onSubmit={handleAddBin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-xs text-gray-500 uppercase tracking-wider">
                      ID Tempat Sampah (Bin ID)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: SB-003"
                      value={formData.bin_id}
                      onChange={(e) =>
                        setFormData({ ...formData, bin_id: e.target.value.toUpperCase() })
                      }
                      className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm focus:border-green-500 focus:bg-white transition-all font-mono font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-xs text-gray-500 uppercase tracking-wider">
                      Nama Lokasi TPS
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: TPS Dago Barat"
                      value={formData.location_name}
                      onChange={(e) =>
                        setFormData({ ...formData, location_name: e.target.value })
                      }
                      className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm focus:border-green-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-xs text-gray-500 uppercase tracking-wider">
                      Volume Tempat Sampah (Liter)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 100"
                      min="1"
                      value={formData.total_volume_liters}
                      onChange={(e) =>
                        setFormData({ ...formData, total_volume_liters: parseFloat(e.target.value) })
                      }
                      className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm focus:border-green-500 focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-xs text-gray-500 uppercase tracking-wider">
                      Wilayah (Region)
                    </label>
                    {regions.length === 0 ? (
                      <div className="p-3.5 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400 text-center">
                        Belum ada wilayah. Admin dapat menambahkan melalui menu Manajemen TPS.
                      </div>
                    ) : (
                      <select
                        value={formData.region_id}
                        onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                        className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm focus:border-green-500 focus:bg-white transition-all"
                      >
                        <option value="">Pilih Wilayah (opsional)...</option>
                        {regions.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} — ID: {r.id}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="font-semibold text-xs text-gray-500 uppercase tracking-wider">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        required
                        value={formData.gps_lat}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gps_lat: parseFloat(e.target.value),
                          })
                        }
                        className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm focus:border-green-500 focus:bg-white transition-all font-semibold"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="font-semibold text-xs text-gray-500 uppercase tracking-wider">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        required
                        value={formData.gps_long}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gps_long: parseFloat(e.target.value),
                          })
                        }
                        className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm focus:border-green-500 focus:bg-white transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 w-full py-3.5 rounded-full border-none bg-green-600 hover:bg-green-700 text-white font-bold cursor-pointer shadow-md transition-all disabled:opacity-60 text-sm tracking-wide"
                  >
                    {submitting ? "Mendaftarkan..." : "Daftarkan SmartBin 🗑️"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
