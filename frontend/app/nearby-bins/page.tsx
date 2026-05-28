"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext";

interface SmartBin {
  bin_id: string;
  location_name: string;
  status: string;
  capacity_percent: number;
}

export default function NearbyBins() {
  const { user } = useAuth();
  const role = user?.role;
  const [bins, setBins] = useState<SmartBin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBins() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${baseUrl}/api/v1/bins`);
        if (res.ok) {
          const data = await res.json();
          setBins(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBins();
  }, []);

  if (role === "admin") {
    return (
      <div className="glass-panel" style={{ padding: "32px", textAlign: "center", animation: "fadeIn 0.5s ease" }}>
        <h2 style={{ color: "var(--color-danger)" }}>Akses Ditolak</h2>
        <p style={{ color: "var(--text-muted)" }}>Halaman ini khusus untuk simulasi role Warga. Silakan ubah role Anda menjadi Warga di sidebar navigasi.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2.5rem", color: "var(--color-primary-dark)", marginBottom: "8px" }}>
          Temukan Tempat Sampah Terdekat
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          Pastikan Anda membuang sampah pada tempatnya untuk lingkungan yang lebih bersih.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Memuat lokasi terdekat...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
          {bins.map((bin) => (
            <div key={bin.bin_id} className="glass-panel hover-lift" style={{ padding: "24px", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, color: "var(--color-primary-dark)" }}>{bin.location_name}</h3>
                <span style={{ fontSize: "1.5rem" }}>📍</span>
              </div>
              <p style={{ margin: "0 0 12px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                ID: {bin.bin_id}<br/>
                Kapasitas Saat Ini: <strong style={{ color: bin.capacity_percent >= 85 ? "var(--color-danger)" : "var(--color-primary)" }}>{bin.capacity_percent}%</strong>
              </p>
              
              <div className="progress-container" style={{ height: "8px", marginBottom: "20px" }}>
                <div 
                  className={`progress-fill ${bin.capacity_percent >= 85 ? 'danger' : bin.capacity_percent >= 50 ? 'warning' : 'safe'}`} 
                  style={{ width: `${bin.capacity_percent}%` }}
                ></div>
              </div>

              <button className="btn-primary" style={{ width: "100%", padding: "12px" }}>
                Arahkan ke Lokasi
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
