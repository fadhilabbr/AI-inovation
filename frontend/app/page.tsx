import OptimizeRouteButton from "./components/OptimizeRouteButton";

interface AnalyticsSummary {
  total_bins: number;
  active_bins: number;
  full_bins: number;
  total_trash_collected_kg: number;
  top_materials: { type: string; percentage: number }[];
}

async function getData(): Promise<AnalyticsSummary> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const res = await fetch(`${baseUrl}/api/v1/analytics/summary`, {
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error("Failed to fetch analytics");
  }
  return res.json();
}

export default async function Home() {
  let data: AnalyticsSummary;
  try {
    data = await getData();
  } catch (error) {
    return (
      <div className="glass-panel">
        <h2>Backend Offline</h2>
        <p>Please ensure the FastAPI backend is running on port 8000.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2.5rem", color: "var(--color-primary-dark)", marginBottom: "8px" }}>
          Dashboard
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          Real-time overview of the SmartBin network and environmental impact.
        </p>
      </div>
      
      <div className="metric-grid">
        <div className="glass-panel metric-card">
          <div className="metric-icon">🗑️</div>
          <div className="metric-title">Total Bins</div>
          <div className="metric-value">{data.total_bins}</div>
        </div>
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: "rgba(14, 165, 233, 0.1)", color: "var(--color-secondary)" }}>✨</div>
          <div className="metric-title">Active Bins</div>
          <div className="metric-value">{data.active_bins}</div>
        </div>
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger)" }}>⚠️</div>
          <div className="metric-title">Full Bins</div>
          <div className="metric-value" style={{ color: "var(--color-danger)" }}>{data.full_bins}</div>
        </div>
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--color-accent)" }}>⚖️</div>
          <div className="metric-title">Total Collected</div>
          <div className="metric-value">{data.total_trash_collected_kg.toLocaleString()} <span style={{ fontSize: "1rem" }}>kg</span></div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: "32px" }}>
        <h2 style={{ color: "var(--color-primary-dark)", marginBottom: "24px" }}>Material Composition</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {data.top_materials.map((material, index) => (
            <div key={index}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "600", textTransform: "capitalize" }}>
                <span>{material.type}</span>
                <span>{material.percentage}%</span>
              </div>
              <div className="progress-container">
                <div 
                  className="progress-fill safe" 
                  style={{ 
                    width: `${material.percentage}%`,
                    background: index === 0 ? "var(--color-primary)" : index === 1 ? "var(--color-secondary)" : index === 2 ? "var(--color-accent)" : "var(--text-muted)"
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <OptimizeRouteButton />
    </div>
  );
}