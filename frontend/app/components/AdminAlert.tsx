"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface SmartBin {
  bin_id: string;
  location_name: string;
  status: string;
  capacity_percent: number;
}

export default function AdminAlert() {
  const { user } = useAuth();
  const role = user?.role;
  const [alerts, setAlerts] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (role !== "admin" || !user) return;

    const checkFullBins = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${baseUrl}/api/v1/bins`, { cache: 'no-store' });
        if (!res.ok) return;
        const bins: SmartBin[] = await res.json();
        
        const fullBins = bins.filter((b: SmartBin) => b.capacity_percent >= 85 || b.status === "full");
        
        if (fullBins.length > 0) {
          setAlerts(fullBins.map((b: SmartBin) => `${b.location_name} (Kapasitas: ${b.capacity_percent}%) perlu segera diangkut!`));
          setShow(true);
        } else {
          setAlerts([]);
          setShow(false);
        }
      } catch (err) {
        console.error("Failed to check bin status:", err);
      }
    };

    checkFullBins();
    
    // Check every 5 seconds for real-time demonstration
    const interval = setInterval(checkFullBins, 5000);
    return () => clearInterval(interval);
  }, [role]);

  if (!show || alerts.length === 0 || role !== "admin" || !user) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      pointerEvents: "none"
    }}>
      {alerts.map((alert, idx) => (
        <div key={idx} className="glass-panel" style={{
          borderLeft: "4px solid var(--color-danger)",
          boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          animation: "slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
          pointerEvents: "auto",
          maxWidth: "350px",
          background: "rgba(255, 255, 255, 0.9)"
        }}>
          <span style={{ fontSize: "2rem" }}>🚨</span>
          <div>
            <h4 style={{ margin: "0 0 6px 0", color: "var(--color-danger)", fontSize: "1rem" }}>Tong Sampah Penuh!</h4>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.4" }}>{alert}</p>
          </div>
          <button 
            onClick={() => {
              const newAlerts = [...alerts];
              newAlerts.splice(idx, 1);
              setAlerts(newAlerts);
              if (newAlerts.length === 0) setShow(false);
            }}
            style={{
              background: "rgba(0,0,0,0.05)", border: "none", cursor: "pointer", 
              fontSize: "1.2rem", width: "30px", height: "30px", borderRadius: "50%",
              color: "var(--text-muted)", marginLeft: "auto",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
