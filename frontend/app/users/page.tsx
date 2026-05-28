import React from "react";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  points: number;
}

interface Reward {
  id: number;
  name: string;
  points_required: number;
}

async function getUserData(): Promise<{ user: UserProfile, rewards: Reward[] }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [userRes, rewardsRes] = await Promise.all([
    fetch(`${baseUrl}/api/v1/users/1`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/v1/users/1/rewards`, { cache: "no-store" })
  ]);
  
  if (!userRes.ok || !rewardsRes.ok) throw new Error("Failed to fetch user data");
  
  return {
    user: await userRes.json(),
    rewards: await rewardsRes.json()
  };
}

export default async function UsersPage() {
  let data;
  try {
    data = await getUserData();
  } catch (e) {
    return <div className="glass-panel">Error loading gamification data.</div>;
  }

  const { user, rewards } = data;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2.5rem", color: "var(--color-primary-dark)", marginBottom: "8px" }}>
          Gamification Profile
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          Track citizen recycling habits and reward points.
        </p>
      </div>

      <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
        <div className="glass-panel" style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", padding: "40px 24px", position: "relative", overflow: "hidden" }}>
          {/* Decorative background glow */}
          <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", background: "var(--color-primary)", filter: "blur(80px)", opacity: 0.3, zIndex: 0 }}></div>
          
          <div style={{ position: "relative", zIndex: 1, width: "120px", height: "120px", borderRadius: "50%", background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.5rem", fontWeight: "bold", boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)" }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ position: "relative", zIndex: 1, marginTop: "8px" }}>
            <h2 style={{ margin: "0 0 4px 0", color: "var(--color-primary-dark)", fontSize: "1.8rem" }}>{user.name}</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "1rem" }}>{user.email}</p>
          </div>
          
          <div style={{ position: "relative", zIndex: 1, marginTop: "24px", background: "rgba(255, 255, 255, 0.8)", padding: "24px", borderRadius: "20px", border: "1px solid rgba(16, 185, 129, 0.2)", boxShadow: "0 10px 40px rgba(16, 185, 129, 0.15)", width: "100%", transition: "transform 0.3s" }} className="hover-lift">
            <div style={{ fontSize: "0.95rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Saldo Poin Anda</div>
            <div style={{ fontSize: "3.5rem", fontWeight: "800", background: "linear-gradient(90deg, var(--color-primary-dark), var(--color-primary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "var(--font-heading)" }}>
              {user.points.toLocaleString()} <span style={{ fontSize: "1.5rem", color: "var(--color-primary-light)", WebkitTextFillColor: "var(--color-primary-light)" }}>pts</span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ flex: "2 1 400px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "20px", marginBottom: "24px" }}>
            <h3 style={{ margin: 0, color: "var(--color-primary-dark)" }}>🎁 Katalog Hadiah</h3>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.05)", padding: "4px 12px", borderRadius: "99px" }}>Tukarkan poin Anda</span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {rewards.map(reward => (
              <div key={reward.id} className="reward-card" style={{ 
                display: "flex", justifyContent: "space-between", alignItems: "center", 
                padding: "20px", background: "rgba(255,255,255,0.6)", 
                borderRadius: "16px", transition: "all 0.3s ease",
                border: "1px solid rgba(255,255,255,0.8)",
                boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg, #fef3c7, #fde68a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", boxShadow: "0 4px 10px rgba(245, 158, 11, 0.2)" }}>
                    🏆
                  </div>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "1.2rem", color: "var(--text-main)", marginBottom: "4px" }}>{reward.name}</div>
                    <div style={{ color: "var(--color-accent)", fontWeight: "800", fontSize: "1rem" }}>{reward.points_required.toLocaleString()} pts</div>
                  </div>
                </div>
                <button 
                  className={user.points >= reward.points_required ? "btn-reward-active" : "btn-reward-disabled"}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "99px",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    transition: "all 0.2s"
                  }}
                >
                  Tukarkan
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
