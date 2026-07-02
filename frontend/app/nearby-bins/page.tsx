"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext";

interface SmartBin {
  bin_id: string;
  location_name: string;
  status: string;
  capacity_percent: number;
  gps_lat: number;
  gps_long: number;
}

interface Region {
  id: number;
  name: string;
  description: string;
}

const CAPACITY_COLOR = (pct: number) =>
  pct >= 85 ? "bg-red-500" : pct >= 50 ? "bg-amber-400" : "bg-green-500";

const CAPACITY_LABEL = (pct: number) =>
  pct >= 85 ? "Penuh" : pct >= 50 ? "Hampir Penuh" : "Tersedia";

const CAPACITY_BADGE = (pct: number) =>
  pct >= 85
    ? "bg-red-100 text-red-600"
    : pct >= 50
    ? "bg-amber-100 text-amber-600"
    : "bg-green-100 text-green-700";

export default function NearbyBins() {
  useAuth();
  const [bins, setBins] = useState<SmartBin[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add TPS modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    bin_id: "",
    location_name: "",
    gps_lat: -6.2,
    gps_long: 106.8,
    region_id: "" as string | number,
  });
  const [formError, setFormError] = useState("");

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined"
      ? `http://${window.location.hostname}:8000`
      : "http://127.0.0.1:8000");

  useEffect(() => {
    async function fetchData() {
      try {
        const [binsRes, regionsRes] = await Promise.all([
          fetch(`${baseUrl}/api/v1/bins`, { cache: "no-store" }),
          fetch(`${baseUrl}/api/v1/regions`, { cache: "no-store" }),
        ]);
        if (binsRes.ok) setBins(await binsRes.json());
        if (regionsRes.ok) setRegions(await regionsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [baseUrl]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.bin_id.trim()) {
      setFormError("Bin ID tidak boleh kosong.");
      return;
    }
    if (!formData.location_name.trim()) {
      setFormError("Nama lokasi tidak boleh kosong.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/api/v1/bins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          region_id: formData.region_id ? Number(formData.region_id) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setFormError(err.detail || "Gagal menambahkan TPS.");
        return;
      }

      const newBin = await res.json();
      setBins((prev) => [...prev, newBin]);
      setSubmitSuccess(true);
      setFormData({ bin_id: "", location_name: "", gps_lat: -6.2, gps_long: 106.8, region_id: "" });
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
      }, 2000);
    } catch {
      setFormError("Tidak dapat terhubung ke server.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBins = bins.filter(
    (b) =>
      b.location_name.toLowerCase().includes(search.toLowerCase()) ||
      b.bin_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-[fadeIn_0.5s_ease-out_forwards] pb-10">
      {/* Header */}
      <div className="mx-4 mt-4 mb-5 rounded-2xl bg-linear-to-br from-green-700 to-green-900 text-white p-5 shadow-lg shadow-green-900/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-4 w-16 h-16 rounded-full bg-white/5 translate-y-8" />

        <div className="relative z-10">
          <h1 className="text-[1.6rem] m-0 mb-1 font-(family-name:--font-heading) font-extrabold text-white">
            📍 Temukan TPS Terdekat
          </h1>
          <p className="text-white/70 text-[0.85rem] m-0">
            {bins.length} titik SmartBin tersedia di seluruh jaringan.
          </p>
        </div>
        <button
          className="relative z-10 bg-white text-green-800 border-none py-2.5 px-5 rounded-full font-(family-name:--font-heading) font-bold cursor-pointer transition-colors hover:bg-green-50 shadow-sm w-full md:w-auto text-[0.9rem] flex items-center justify-center gap-2"
          onClick={() => { setIsModalOpen(true); setFormError(""); setSubmitSuccess(false); }}
        >
          ➕ Tambah TPS Baru
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari lokasi atau ID tong..."
            className="w-full py-3 pl-11 pr-4 rounded-2xl border border-gray-200 bg-white text-[0.95rem] outline-none transition-colors focus:border-green-500 shadow-sm"
          />
        </div>
      </div>

      {/* Bins Grid */}
      {loading ? (
        <div className="text-center p-10 text-gray-400">
          <div className="text-4xl mb-3 animate-bounce">📍</div>
          <p className="m-0 text-sm">Memuat lokasi TPS...</p>
        </div>
      ) : filteredBins.length === 0 ? (
        <div className="text-center p-10 text-gray-400">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="m-0 text-sm">Tidak ada TPS yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
          {filteredBins.map((bin) => (
            <div
              key={bin.bin_id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="m-0 text-green-800 text-[1.05rem] font-bold leading-tight">
                    {bin.location_name}
                  </h3>
                  <p className="m-0 mt-0.5 text-gray-400 text-xs font-semibold">ID: {bin.bin_id}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide shrink-0 ${CAPACITY_BADGE(bin.capacity_percent)}`}>
                  {CAPACITY_LABEL(bin.capacity_percent)}
                </span>
              </div>

              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${CAPACITY_COLOR(bin.capacity_percent)}`}
                  style={{ width: `${bin.capacity_percent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 font-semibold mb-4">
                <span>Kapasitas</span>
                <span>{bin.capacity_percent}%</span>
              </div>

              <a
                href={`https://www.google.com/maps?q=${bin.gps_lat},${bin.gps_long}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2.5 px-4 rounded-xl bg-green-600 text-white font-semibold text-sm no-underline transition-colors hover:bg-green-700"
              >
                🗺️ Buka di Google Maps
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Add TPS Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-[500px] shadow-2xl p-6 sm:p-8 animate-[fadeIn_0.3s_ease-out_forwards]">
            {submitSuccess ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <h2 className="text-green-700 text-xl font-bold m-0 mb-2">Berhasil Ditambahkan!</h2>
                <p className="text-gray-500 text-sm m-0">TPS baru sudah masuk ke jaringan SmartBin.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-green-800 text-xl font-bold m-0 font-(family-name:--font-heading)">
                    ➕ Tambah TPS Baru
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 bg-gray-100 border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-200 text-lg"
                  >
                    ×
                  </button>
                </div>

                {formError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    ⚠️ {formError}
                  </div>
                )}

                <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-sm text-gray-700">Bin ID <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={formData.bin_id}
                      onChange={(e) => setFormData({ ...formData, bin_id: e.target.value })}
                      placeholder="Contoh: SB-010"
                      required
                      className="p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm transition-colors focus:border-green-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-sm text-gray-700">Nama Lokasi <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={formData.location_name}
                      onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                      placeholder="Contoh: Depan Masjid Al-Hidayah"
                      required
                      className="p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm transition-colors focus:border-green-500 focus:bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-sm text-gray-700">Wilayah</label>
                    <select
                      value={formData.region_id}
                      onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                      className="p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm transition-colors focus:border-green-500 focus:bg-white"
                    >
                      <option value="">Pilih Wilayah (opsional)...</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
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
                        className="p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none text-sm transition-colors focus:border-green-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 rounded-full border-none bg-gray-100 text-gray-600 font-semibold cursor-pointer transition-colors hover:bg-gray-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 rounded-full border-none bg-green-600 text-white font-semibold cursor-pointer shadow-md transition-colors hover:bg-green-700 disabled:opacity-60"
                    >
                      {submitting ? "Menyimpan..." : "Simpan TPS"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
