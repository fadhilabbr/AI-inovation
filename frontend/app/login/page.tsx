"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || "Login gagal. Periksa email dan password Anda.");
        return;
      }
      const data = await res.json();
      login(data.access_token, data.user);
      router.push("/");
    } catch {
      setError("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-gradient)", padding: "24px"
    }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "12px",
            fontSize: "2rem", fontWeight: "800", fontFamily: "var(--font-heading)",
            background: "linear-gradient(90deg, var(--color-primary-dark), var(--color-primary))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            🗑️ SmartBin
          </div>
          <p style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "1.05rem" }}>
            Sistem Manajemen Persampahan Cerdas
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel" style={{ padding: "40px" }}>
          <h1 style={{ fontSize: "1.75rem", color: "var(--color-primary-dark)", marginBottom: "8px" }}>
            Selamat Datang
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "0.95rem" }}>
            Masuk ke akun Anda untuk melanjutkan.
          </p>

          {error && (
            <div style={{
              padding: "12px 16px", background: "rgba(239,68,68,0.1)", color: "var(--color-danger)",
              borderRadius: "12px", marginBottom: "20px", fontSize: "0.9rem", fontWeight: "500",
              border: "1px solid rgba(239,68,68,0.2)"
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--text-main)" }}>Email</label>
              <input
                id="login-email" type="email" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="contoh@email.com"
                style={{
                  padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)",
                  background: "rgba(255,255,255,0.8)", fontSize: "1rem", outline: "none",
                  transition: "border-color 0.2s", fontFamily: "var(--font-body)"
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--text-main)" }}>Password</label>
              <input
                id="login-password" type="password" required
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Masukkan password"
                style={{
                  padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)",
                  background: "rgba(255,255,255,0.8)", fontSize: "1rem", outline: "none",
                  fontFamily: "var(--font-body)"
                }}
              />
            </div>

            <button
              id="login-submit" type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: "8px", padding: "15px" }}
            >
              {loading ? "Memproses..." : "Masuk →"}
            </button>
          </form>

          {/* Admin hint box */}
          <div style={{
            marginTop: "24px", padding: "14px 16px", background: "rgba(16,185,129,0.06)",
            borderRadius: "12px", border: "1px dashed var(--color-primary-light)"
          }}>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "500" }}>
              🛡️ <strong>Demo Admin:</strong> admin@dlhk.go.id / admin123
            </p>
          </div>

          <p style={{ marginTop: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Belum punya akun?{" "}
            <Link href="/register" style={{ color: "var(--color-primary)", fontWeight: "700", textDecoration: "none" }}>
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
