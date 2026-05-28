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

export default function BinsPage() {
  const { user } = useAuth();
  const role = user?.role;
  const [bins, setBins] = useState<SmartBin[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [formData, setFormData] = useState({
    bin_id: "",
    location_name: "",
    gps_lat: -6.2,
    gps_long: 106.8
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const fetchBins = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/v1/bins`, { cache: "no-store" });
      if (res.ok) setBins(await res.json());
    } catch (err) {
      console.error("Failed to fetch bins", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wrap in setTimeout to satisfy strict ESLint rules about synchronous setState
    const timer = setTimeout(() => fetchBins(), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === "add") {
        await fetch(`${baseUrl}/api/v1/bins`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${baseUrl}/api/v1/bins/${formData.bin_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location_name: formData.location_name,
            gps_lat: formData.gps_lat,
            gps_long: formData.gps_long
          })
        });
      }
      setIsModalOpen(false);
      fetchBins();
    } catch (error) {
      console.error("Failed to save bin", error);
    }
  };

  const handleDelete = async (bin_id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus tempat sampah ini?")) {
      try {
        await fetch(`${baseUrl}/api/v1/bins/${bin_id}`, { method: "DELETE" });
        fetchBins();
      } catch (error) {
        console.error("Failed to delete bin", error);
      }
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ bin_id: "", location_name: "", gps_lat: -6.2, gps_long: 106.8 });
    setIsModalOpen(true);
  };

  const openEditModal = (bin: SmartBin) => {
    setModalMode("edit");
    setFormData({ 
      bin_id: bin.bin_id, 
      location_name: bin.location_name, 
      gps_lat: bin.gps_lat || -6.2, 
      gps_long: bin.gps_long || 106.8 
    });
    setIsModalOpen(true);
  };

  if (role !== "admin") {
    return (
      <div className="glass-panel" style={{ padding: "32px", textAlign: "center", animation: "fadeIn 0.5s ease" }}>
        <h2 style={{ color: "var(--color-danger)" }}>Akses Ditolak: Khusus Admin DLHK</h2>
        <p style={{ color: "var(--text-muted)" }}>Halaman ini hanya dapat diakses oleh Admin. Silakan ubah role Anda di pengaturan.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", color: "var(--color-primary-dark)", margin: "0 0 8px 0" }}>Manajemen Tempat Sampah</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", margin: 0 }}>Kelola seluruh armada SmartBin di kota Anda.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <span>➕ Tambah Baru</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Memuat data...</div>
      ) : (
        <div className="bins-grid">
          {bins.map((bin) => (
            <div key={bin.bin_id} className="glass-panel" style={{ padding: "24px" }}>
              <div className="bin-header">
                <h3 style={{ margin: 0, color: "var(--color-primary-dark)", fontSize: "1.25rem" }}>{bin.location_name}</h3>
                <span className={`status-badge ${bin.capacity_percent >= 85 ? 'status-full' : 'status-active'}`}>
                  {bin.capacity_percent >= 85 ? "Penuh" : "Aktif"}
                </span>
              </div>
              <p style={{ margin: "0 0 16px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                ID: <strong>{bin.bin_id}</strong><br/>
                Kapasitas: {bin.capacity_percent}%
              </p>
              <div className="progress-container" style={{ marginBottom: "24px" }}>
                <div 
                  className={`progress-fill ${bin.capacity_percent >= 85 ? 'danger' : bin.capacity_percent >= 50 ? 'warning' : 'safe'}`} 
                  style={{ width: `${bin.capacity_percent}%` }}
                ></div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => openEditModal(bin)}
                  style={{ flex: 1, padding: "8px", background: "rgba(14, 165, 233, 0.1)", color: "var(--color-secondary)", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "all 0.2s" }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(bin.bin_id)}
                  style={{ flex: 1, padding: "8px", background: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger)", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "all 0.2s" }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "16px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", animation: "fadeIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards", background: "rgba(255,255,255,0.9)" }}>
            <h2 style={{ color: "var(--color-primary-dark)", marginBottom: "24px" }}>
              {modalMode === "add" ? "Tambah Tempat Sampah" : "Edit Tempat Sampah"}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {modalMode === "add" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--text-main)" }}>Bin ID</label>
                  <input 
                    type="text" 
                    value={formData.bin_id} 
                    onChange={e => setFormData({...formData, bin_id: e.target.value})} 
                    required 
                    style={{ padding: "12px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", outline: "none" }}
                    placeholder="Contoh: SB-005"
                  />
                </div>
              )}
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--text-main)" }}>Nama Lokasi</label>
                <input 
                  type="text" 
                  value={formData.location_name} 
                  onChange={e => setFormData({...formData, location_name: e.target.value})} 
                  required 
                  style={{ padding: "12px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", outline: "none" }}
                  placeholder="Contoh: Taman Suropati"
                />
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <label style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--text-main)" }}>Latitude (GPS)</label>
                  <input 
                    type="number" step="any"
                    value={formData.gps_lat} 
                    onChange={e => setFormData({...formData, gps_lat: parseFloat(e.target.value)})} 
                    required 
                    style={{ padding: "12px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", outline: "none" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <label style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--text-main)" }}>Longitude (GPS)</label>
                  <input 
                    type="number" step="any"
                    value={formData.gps_long} 
                    onChange={e => setFormData({...formData, gps_long: parseFloat(e.target.value)})} 
                    required 
                    style={{ padding: "12px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "12px 24px", borderRadius: "99px", border: "none", background: "rgba(0,0,0,0.05)", fontWeight: "600", cursor: "pointer" }}>Batal</button>
                <button type="submit" className="btn-primary" style={{ padding: "12px 24px" }}>Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
