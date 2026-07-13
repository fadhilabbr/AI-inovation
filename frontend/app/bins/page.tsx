/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext";

interface Region {
  id: number;
  name: string;
  description: string;
}

interface SmartBin {
  bin_id: string;
  location_name: string;
  status: string;
  capacity_percent: number;
  gps_lat: number;
  gps_long: number;
  region_id?: number | null;
}

interface BinSummary {
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

export default function BinsPage() {
  const { user } = useAuth();
  const role = user?.role;
  const [bins, setBins] = useState<SmartBin[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bins" | "regions">("bins");

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : "http://127.0.0.1:8000");

  // Flip State
  const [flippedBins, setFlippedBins] = useState<Record<string, boolean>>({});
  const [binStats, setBinStats] = useState<Record<string, BinSummary>>({});
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});

  const toggleFlip = async (bin_id: string) => {
    setFlippedBins((prev) => ({ ...prev, [bin_id]: !prev[bin_id] }));

    if (!binStats[bin_id] && !flippedBins[bin_id]) {
      setLoadingStats((prev) => ({ ...prev, [bin_id]: true }));
      try {
        const res = await fetch(`${baseUrl}/api/v1/bins/${bin_id}/summary`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setBinStats((prev) => ({ ...prev, [bin_id]: data }));
        }
      } catch (err) {
        console.error("Failed to fetch bin stats", err);
      } finally {
        setLoadingStats((prev) => ({ ...prev, [bin_id]: false }));
      }
    }
  };

  // ─── TPS / Bin Modal ───────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState({
    bin_id: "",
    location_name: "",
    gps_lat: -6.2,
    gps_long: 106.8,
    region_id: "" as string | number,
  });

  // ─── Region Modal ──────────────────────────────────────────────────
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [regionFormData, setRegionFormData] = useState({
    id: "",
    name: "",
    description: "",
  });
  const [regionFormError, setRegionFormError] = useState("");
  const [regionSubmitting, setRegionSubmitting] = useState(false);

  // ─── Fetch ─────────────────────────────────────────────────────────
  const fetchBinsAndRegions = async () => {
    try {
      const [binsRes, regionsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/bins`, { cache: "no-store" }),
        fetch(`${baseUrl}/api/v1/regions`, { cache: "no-store" }),
      ]);

      if (binsRes.ok) setBins(await binsRes.json());
      if (regionsRes.ok) setRegions(await regionsRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchBinsAndRegions(), 0);
    return () => clearTimeout(timer);
  }, []);

  // ─── TPS Handlers ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        region_id: formData.region_id ? Number(formData.region_id) : null,
      };

      if (modalMode === "add") {
        await fetch(`${baseUrl}/api/v1/bins`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${baseUrl}/api/v1/bins/${formData.bin_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location_name: payload.location_name,
            gps_lat: payload.gps_lat,
            gps_long: payload.gps_long,
            region_id: payload.region_id,
          }),
        });
      }
      setIsModalOpen(false);
      fetchBinsAndRegions();
    } catch (error) {
      console.error("Failed to save bin", error);
    }
  };

  const handleDelete = async (bin_id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Apakah Anda yakin ingin menghapus tempat sampah ini?")) {
      try {
        await fetch(`${baseUrl}/api/v1/bins/${bin_id}`, { method: "DELETE" });
        fetchBinsAndRegions();
      } catch (error) {
        console.error("Failed to delete bin", error);
      }
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ bin_id: "", location_name: "", gps_lat: -6.2, gps_long: 106.8, region_id: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (bin: SmartBin, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalMode("edit");
    setFormData({
      bin_id: bin.bin_id,
      location_name: bin.location_name,
      gps_lat: bin.gps_lat || -6.2,
      gps_long: bin.gps_long || 106.8,
      region_id: bin.region_id || "",
    });
    setIsModalOpen(true);
  };

  // ─── Region Handlers ───────────────────────────────────────────────
  const handleRegionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegionFormError("");

    if (!regionFormData.id.trim()) {
      setRegionFormError("ID Region tidak boleh kosong.");
      return;
    }
    if (isNaN(Number(regionFormData.id))) {
      setRegionFormError("ID Region harus berupa angka.");
      return;
    }
    if (!regionFormData.name.trim()) {
      setRegionFormError("Nama Region tidak boleh kosong.");
      return;
    }

    setRegionSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/api/v1/regions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(regionFormData.id),
          name: regionFormData.name,
          description: regionFormData.description || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setRegionFormError(err.detail || "Gagal menambahkan wilayah.");
        return;
      }

      setRegionFormData({ id: "", name: "", description: "" });
      setIsRegionModalOpen(false);
      fetchBinsAndRegions();
    } catch {
      setRegionFormError("Tidak dapat terhubung ke server.");
    } finally {
      setRegionSubmitting(false);
    }
  };

  const handleDeleteRegion = async (region_id: number) => {
    if (confirm("Hapus wilayah ini? TPS yang terhubung akan kehilangan data wilayah.")) {
      try {
        await fetch(`${baseUrl}/api/v1/regions/${region_id}`, { method: "DELETE" });
        fetchBinsAndRegions();
      } catch (error) {
        console.error("Failed to delete region", error);
      }
    }
  };

  const openRegionModal = () => {
    setRegionFormData({ id: "", name: "", description: "" });
    setRegionFormError("");
    setIsRegionModalOpen(true);
  };

  // ─── Guards ────────────────────────────────────────────────────────
  if (role !== "admin") {
    return (
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 p-8 text-center animate-[fadeIn_0.5s_ease] m-4">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-red-500 m-0 text-xl font-bold">Akses Ditolak: Khusus Admin DLHK</h2>
        <p className="text-gray-500 mt-2">Halaman ini hanya dapat diakses oleh Admin.</p>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease-out_forwards] pb-10">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mx-4 mt-4 mb-0 rounded-2xl bg-linear-to-br from-green-700 to-green-900 text-white p-5 shadow-lg shadow-green-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-4 w-16 h-16 rounded-full bg-white/5 translate-y-8" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[1.6rem] m-0 mb-1 font-(family-name:--font-heading) font-extrabold text-white">
              Manajemen TPS 🗑️
            </h1>
            <p className="text-white/70 text-[0.85rem] m-0">
              {bins.length} TPS &nbsp;·&nbsp; {regions.length} Wilayah
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              className="bg-white text-green-800 border-none py-2 px-4 rounded-full font-(family-name:--font-heading) font-bold cursor-pointer transition-colors hover:bg-green-50 shadow-sm text-sm"
              onClick={openAddModal}
            >
              ➕ Tambah TPS
            </button>
            <button
              className="bg-white/15 hover:bg-white/25 text-white border border-white/30 py-2 px-4 rounded-full font-(family-name:--font-heading) font-bold cursor-pointer transition-colors shadow-sm text-sm"
              onClick={openRegionModal}
            >
              🗺️ Tambah Wilayah
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="relative z-10 flex gap-1 mt-5 bg-black/20 rounded-full p-1 w-fit">
          <button
            onClick={() => setActiveTab("bins")}
            className={`py-1.5 px-5 rounded-full text-sm font-bold transition-all border-none cursor-pointer ${
              activeTab === "bins"
                ? "bg-white text-green-800 shadow"
                : "bg-transparent text-white/80 hover:text-white"
            }`}
          >
            🗑️ TPS ({bins.length})
          </button>
          <button
            onClick={() => setActiveTab("regions")}
            className={`py-1.5 px-5 rounded-full text-sm font-bold transition-all border-none cursor-pointer ${
              activeTab === "regions"
                ? "bg-white text-green-800 shadow"
                : "bg-transparent text-white/80 hover:text-white"
            }`}
          >
            🗺️ Wilayah ({regions.length})
          </button>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center p-10 text-gray-400">
          <div className="text-4xl mb-3 animate-spin inline-block">♻️</div>
          <p className="m-0 text-sm">Memuat data...</p>
        </div>
      ) : activeTab === "bins" ? (

        /* ── TPS Grid ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mt-5">
          {bins.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🗑️</div>
              <p className="m-0 text-sm">Belum ada TPS. Klik &quot;Tambah TPS&quot; untuk menambahkan.</p>
            </div>
          ) : (
            bins.map((bin) => {
              const regionName = regions.find((r) => r.id === bin.region_id)?.name || null;
              const isFull = bin.capacity_percent >= 85;
              const isFlipped = flippedBins[bin.bin_id] || false;
              const stats = binStats[bin.bin_id];
              const isLoadingStat = loadingStats[bin.bin_id];

              return (
                <div
                  key={bin.bin_id}
                  className="relative w-full min-h-[260px] perspective-[1000px] cursor-pointer group"
                  onClick={() => toggleFlip(bin.bin_id)}
                >
                  <div
                    className={`w-full h-full absolute inset-0 transition-transform duration-500 transform-3d ${
                      isFlipped ? "transform-[rotateY(180deg)]" : ""
                    }`}
                  >
                    {/* Front */}
                    <div className="absolute inset-0 bg-white rounded-2xl shadow-sm p-5 border border-gray-100 backface-hidden flex flex-col transition-shadow group-hover:shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0 mr-3">
                          <h3 className="m-0 text-green-800 text-lg font-bold leading-tight truncate">
                            {bin.location_name}
                          </h3>
                          <p className="m-0 mt-0.5 text-gray-400 text-xs font-semibold">
                            ID: {bin.bin_id}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isFull ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isFull ? "Penuh" : "Aktif"}
                        </span>
                      </div>

                      {regionName && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-2.5 py-0.5 font-semibold">
                            📍 {regionName}
                          </span>
                        </div>
                      )}

                      <div className="mt-auto">
                        <div className="flex justify-between text-xs text-gray-400 font-semibold mb-1.5">
                          <span>Kapasitas</span>
                          <span className={isFull ? "text-red-500 font-bold" : bin.capacity_percent >= 50 ? "text-amber-500 font-bold" : ""}>{bin.capacity_percent}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isFull ? "bg-red-500" : bin.capacity_percent >= 50 ? "bg-amber-400" : "bg-green-500"
                            }`}
                            style={{ width: `${bin.capacity_percent}%` }}
                          />
                        </div>

                        <div className="flex gap-2 relative z-20">
                          <button
                            onClick={(e) => openEditModal(bin, e)}
                            className="flex-1 py-2 px-3 bg-sky-50 text-sky-600 border-none rounded-xl cursor-pointer font-semibold text-sm transition-colors hover:bg-sky-100"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={(e) => handleDelete(bin.bin_id, e)}
                            className="flex-1 py-2 px-3 bg-red-50 text-red-500 border-none rounded-xl cursor-pointer font-semibold text-sm transition-colors hover:bg-red-100"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 bg-linear-to-br from-green-50 to-white rounded-2xl shadow-sm p-5 border border-green-200 backface-hidden transform-[rotateY(180deg)] flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="m-0 text-green-800 text-base font-bold">
                          Detail Isi: {bin.bin_id}
                        </h3>
                        <span className="text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded-md border border-gray-100">
                          Tap to close
                        </span>
                      </div>

                      {isLoadingStat ? (
                        <div className="flex-1 flex justify-center items-center text-gray-400 animate-pulse text-sm">
                          Memuat data komposisi...
                        </div>
                      ) : stats ? (
                        <div className="flex-1 overflow-y-auto pr-1">
                          <div className="flex justify-between text-xs mb-3 border-b border-gray-100 pb-2 text-gray-500 font-semibold">
                            <span>Total Berat: <strong className="text-gray-800">{stats.total_weight_kg}kg</strong></span>
                            <span>Total Item: <strong className="text-gray-800">{stats.total_items}</strong></span>
                          </div>
                          {stats.materials.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm mt-4 italic">
                              Tong sampah masih kosong.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {stats.materials.map((mat, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="font-semibold text-gray-700 capitalize">{mat.type}</span>
                                    <span className="font-bold text-green-700">{mat.percentage}% ({mat.weight_kg}kg)</span>
                                  </div>
                                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-green-500 rounded-full"
                                      style={{ width: `${mat.percentage}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 flex justify-center items-center text-red-400 text-sm">
                          Gagal memuat data.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      ) : (

        /* ── Regions Panel ─── */
        <div className="px-4 mt-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="m-0 text-gray-800 text-base font-bold">Daftar Wilayah</h2>
            <button
              onClick={openRegionModal}
              className="bg-green-600 text-white border-none py-2 px-4 rounded-full font-semibold cursor-pointer transition-colors hover:bg-green-700 shadow-sm text-sm"
            >
              ➕ Tambah Wilayah
            </button>
          </div>

          {regions.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-5xl mb-3">🗺️</div>
              <p className="m-0 text-sm">Belum ada wilayah. Klik &quot;Tambah Wilayah&quot; untuk menambahkan.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {regions.map((region) => {
                const binCount = bins.filter((b) => b.region_id === region.id).length;
                return (
                  <div
                    key={region.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 transition-shadow hover:shadow-md"
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl shrink-0">
                      🗺️
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="m-0 text-green-800 font-bold text-base leading-tight">
                          {region.name}
                        </h3>
                        <span className="text-[0.7rem] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          ID: {region.id}
                        </span>
                      </div>
                      {region.description && (
                        <p className="m-0 mt-0.5 text-gray-500 text-xs truncate">
                          {region.description}
                        </p>
                      )}
                      <p className="m-0 mt-1.5 text-xs font-semibold text-green-600">
                        🗑️ {binCount} TPS terhubung
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteRegion(region.id)}
                      className="shrink-0 py-2 px-3 bg-red-50 text-red-500 border-none rounded-xl cursor-pointer font-semibold text-sm transition-colors hover:bg-red-100"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TPS Modal ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-[500px] shadow-2xl p-6 sm:p-8 animate-[fadeIn_0.3s_ease-out_forwards] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-green-800 text-xl font-bold m-0 font-(family-name:--font-heading)">
                {modalMode === "add" ? "➕ Tambah TPS Baru" : "✏️ Edit TPS"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 bg-gray-100 border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-200 text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {modalMode === "add" && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-sm text-gray-700">
                    Bin ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bin_id}
                    onChange={(e) => setFormData({ ...formData, bin_id: e.target.value })}
                    required
                    className="p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm transition-colors focus:border-green-500 focus:bg-white"
                    placeholder="Contoh: SB-005"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-sm text-gray-700">
                  Nama Lokasi <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location_name}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  required
                  className="p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm transition-colors focus:border-green-500 focus:bg-white"
                  placeholder="Contoh: Taman Suropati"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-sm text-gray-700">Wilayah (Region)</label>
                <select
                  value={formData.region_id}
                  onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                  className="p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm transition-colors focus:border-green-500 focus:bg-white"
                >
                  <option value="">Pilih Wilayah (opsional)...</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (ID: {r.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="font-semibold text-sm text-gray-700">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.gps_lat}
                    onChange={(e) => setFormData({ ...formData, gps_lat: parseFloat(e.target.value) })}
                    required
                    className="p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm transition-colors focus:border-green-500 focus:bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="font-semibold text-sm text-gray-700">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.gps_long}
                    onChange={(e) => setFormData({ ...formData, gps_long: parseFloat(e.target.value) })}
                    required
                    className="p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm transition-colors focus:border-green-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-5 rounded-full border-none bg-gray-100 text-gray-600 font-semibold cursor-pointer transition-colors hover:bg-gray-200 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-full border-none bg-green-600 text-white font-semibold cursor-pointer shadow-md transition-colors hover:bg-green-700 text-sm"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Region Modal ───────────────────────────────────────────── */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-[480px] shadow-2xl animate-[fadeIn_0.3s_ease-out_forwards]">
            {/* Modal Header */}
            <div className="p-6 pb-0 flex justify-between items-center">
              <div>
                <h2 className="text-green-800 text-xl font-bold m-0 font-(family-name:--font-heading)">
                  🗺️ Tambah Wilayah
                </h2>
                <p className="text-gray-400 text-xs m-0 mt-0.5">ID Wilayah harus unik dan berupa angka</p>
              </div>
              <button
                onClick={() => setIsRegionModalOpen(false)}
                className="text-gray-400 bg-gray-100 border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-200 text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRegionSubmit} className="p-6 flex flex-col gap-4">
              {regionFormError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
                  <span className="shrink-0">⚠️</span>
                  <span>{regionFormError}</span>
                </div>
              )}

              {/* ID + Name side by side */}
              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 w-[120px] shrink-0">
                  <label className="font-semibold text-sm text-gray-700">
                    ID Wilayah <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={regionFormData.id}
                    onChange={(e) => setRegionFormData({ ...regionFormData, id: e.target.value })}
                    required
                    className="p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm transition-colors focus:border-green-500 focus:bg-white text-center font-bold"
                    placeholder="12"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="font-semibold text-sm text-gray-700">
                    Nama Wilayah <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={regionFormData.name}
                    onChange={(e) => setRegionFormData({ ...regionFormData, name: e.target.value })}
                    required
                    className="p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm transition-colors focus:border-green-500 focus:bg-white"
                    placeholder="Contoh: Jakarta Barat"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-sm text-gray-700">
                  Deskripsi <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  value={regionFormData.description}
                  onChange={(e) => setRegionFormData({ ...regionFormData, description: e.target.value })}
                  className="p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm transition-colors focus:border-green-500 focus:bg-white min-h-[72px] resize-none"
                  placeholder="Contoh: Area perkantoran dan perumahan di pusat kota"
                />
              </div>

              {/* Preview badge */}
              {(regionFormData.id || regionFormData.name) && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-lg shrink-0">🗺️</div>
                  <div>
                    <p className="m-0 font-bold text-green-800 text-sm">
                      {regionFormData.name || "Nama Wilayah"}
                    </p>
                    <p className="m-0 text-xs text-gray-400">
                      ID: {regionFormData.id || "—"}
                    </p>
                  </div>
                  <span className="ml-auto text-[0.7rem] bg-green-200 text-green-800 rounded-full px-2 py-0.5 font-bold">
                    Preview
                  </span>
                </div>
              )}

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setIsRegionModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border-none bg-gray-100 text-gray-600 font-semibold cursor-pointer transition-colors hover:bg-gray-200 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={regionSubmitting}
                  className="flex-1 py-2.5 rounded-full border-none bg-green-600 text-white font-semibold cursor-pointer shadow-md transition-colors hover:bg-green-700 disabled:opacity-60 text-sm"
                >
                  {regionSubmitting ? "Menyimpan..." : "Simpan Wilayah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
