import React from "react";

interface SmartBin {
  bin_id: string;
  location_name: string;
  gps_lat: number;
  gps_long: number;
  status: string;
  capacity_percent: number;
  last_updated?: string;
}

async function getBins(): Promise<SmartBin[]> {
  const res = await fetch("http://127.0.0.1:8000/api/v1/bins", {
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error("Failed to fetch bins");
  }
  return res.json();
}

export default async function BinsPage() {
  let bins: SmartBin[] = [];
  try {
    bins = await getBins();
  } catch (error) {
    return (
      <div className="glass-panel">
        <h2>Error Loading Bins</h2>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", color: "var(--color-primary-dark)", marginBottom: "8px" }}>
            Bins Management
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
            Monitor the status and capacity of all SmartBins in real-time.
          </p>
        </div>
        <button className="btn-primary">
          ➕ Add New Bin
        </button>
      </div>

      <div className="bins-grid">
        {bins.map((bin) => (
          <div key={bin.bin_id} className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
            <div className="bin-header">
              <span style={{ fontWeight: "bold", fontFamily: "var(--font-heading)", fontSize: "1.2rem", color: "var(--color-primary-dark)" }}>
                {bin.bin_id}
              </span>
              <span className={`status-badge status-${bin.status}`}>
                {bin.status}
              </span>
            </div>
            
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div>📍 {bin.location_name}</div>
              <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>GPS: {bin.gps_lat}, {bin.gps_long}</div>
            </div>

            <div style={{ marginTop: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.9rem", fontWeight: "600" }}>
                <span>Capacity</span>
                <span style={{ color: bin.capacity_percent > 85 ? "var(--color-danger)" : "inherit" }}>
                  {bin.capacity_percent}%
                </span>
              </div>
              <div className="progress-container">
                <div 
                  className={`progress-fill ${bin.capacity_percent > 85 ? 'danger' : bin.capacity_percent > 50 ? 'warning' : 'safe'}`}
                  style={{ width: `${bin.capacity_percent}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
