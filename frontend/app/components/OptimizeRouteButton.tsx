"use client";

import { useState } from "react";

interface RouteStep {
  order: number;
  bin_id: string;
  action: string;
  priority: string;
}

export default function OptimizeRouteButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [routeData, setRouteData] = useState<RouteStep[] | null>(null);

  const handleOptimize = async () => {
    setStatus("loading");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/dispatch/optimize-route", {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to optimize");
      const data = await res.json();
      setRouteData(data.route_plan);
      setStatus("success");
      
      // Reset after 5 seconds
      setTimeout(() => setStatus("idle"), 5000);
    } catch (e) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div style={{ marginTop: "32px", padding: "24px", background: "rgba(255,255,255,0.6)", borderRadius: "16px", border: "1px dashed var(--color-primary)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: "0 0 8px 0" }}>Fleet Dispatch Optimization</h3>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Run AI model to calculate the most efficient pickup routes for DLH trucks based on bin capacity.
          </p>
        </div>
        <button 
          className={`btn-primary ${status === "loading" ? "btn-loading" : ""}`}
          onClick={handleOptimize}
          disabled={status === "loading"}
        >
          {status === "idle" && "🚚 Optimize Route"}
          {status === "loading" && "⏳ Calculating..."}
          {status === "success" && "✅ Route Generated!"}
          {status === "error" && "❌ Failed"}
        </button>
      </div>
      
      {status === "success" && routeData && (
        <div className="animate-fade-in" style={{ marginTop: "16px", background: "white", padding: "16px", borderRadius: "8px", borderLeft: "4px solid var(--color-primary)" }}>
          <h4 style={{ margin: "0 0 12px 0" }}>Suggested Route Plan:</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {routeData.map((step, i) => (
              <li key={i} style={{ background: "#f8fafc", padding: "8px 16px", borderRadius: "8px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ background: "var(--color-primary)", color: "white", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "bold" }}>
                  {step.order}
                </span>
                {step.bin_id} ({step.priority} priority)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
