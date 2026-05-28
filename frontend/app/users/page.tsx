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
  const [userRes, rewardsRes] = await Promise.all([
    fetch("http://127.0.0.1:8000/api/v1/users/1", { cache: "no-store" }),
    fetch("http://127.0.0.1:8000/api/v1/users/1/rewards", { cache: "no-store" })
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
        <div className="glass-panel" style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", padding: "40px 24px" }}>
          <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: "bold" }}>
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 style={{ margin: "0 0 4px 0", color: "var(--color-primary-dark)" }}>{user.name}</h2>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>{user.email}</p>
          </div>
          
          <div style={{ marginTop: "24px", background: "rgba(16, 185, 129, 0.1)", padding: "16px 32px", borderRadius: "16px", border: "1px dashed var(--color-primary)" }}>
            <div style={{ fontSize: "0.9rem", color: "var(--color-primary-dark)", fontWeight: "600", textTransform: "uppercase" }}>Current Balance</div>
            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>
              {user.points} <span style={{ fontSize: "1.5rem" }}>pts</span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ flex: "2 1 400px" }}>
          <h3 style={{ borderBottom: "1px solid var(--glass-border)", paddingBottom: "16px", marginBottom: "24px" }}>
            Rewards Catalog
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {rewards.map(reward => (
              <div key={reward.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(255,255,255,0.5)", borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                    🎁
                  </div>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "1.1rem" }}>{reward.name}</div>
                    <div style={{ color: "var(--color-accent)", fontWeight: "bold" }}>{reward.points_required} pts</div>
                  </div>
                </div>
                <button 
                  style={{
                    padding: "8px 16px",
                    borderRadius: "99px",
                    border: "none",
                    background: user.points >= reward.points_required ? "var(--color-primary)" : "#e2e8f0",
                    color: user.points >= reward.points_required ? "white" : "#94a3b8",
                    fontWeight: "600",
                    cursor: user.points >= reward.points_required ? "pointer" : "not-allowed",
                  }}
                >
                  Redeem
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
