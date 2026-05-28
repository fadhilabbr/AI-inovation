"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthContext";

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    setLoading(true);
    try {
      // Register
      const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      if (!regRes.ok) {
        const err = await regRes.json();
        setError(err.detail || "Pendaftaran gagal.");
        return;
      }
      // Auto-login after successful registration
      const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      if (loginRes.ok) {
        const data = await loginRes.json();
        login(data.access_token, data.user);
        router.push("/");
      }
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
            Bergabunglah dan dapatkan poin daur ulang!
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel" style={{ padding: "40px" }}>
          <h1 style={{ fontSize: "1.75rem", color: "var(--color-primary-dark)", marginBottom: "8px" }}>
            Buat Akun Baru
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "0.95rem" }}>
            Daftar sebagai Warga dan mulai dapatkan poin.
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

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontWeight: "600", fontSize: "0.9rem" }}>Nama Lengkap</label>
              <input
                id="reg-name" type="text" required
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nama Anda"
                style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)", fontSize: "1rem", outline: "none", fontFamily: "var(--font-body)" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontWeight: "600", fontSize: "0.9rem" }}>Email</label>
              <input
                id="reg-email" type="email" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="contoh@email.com"
                style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)", fontSize: "1rem", outline: "none", fontFamily: "var(--font-body)" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontWeight: "600", fontSize: "0.9rem" }}>Password</label>
              <input
                id="reg-password" type="password" required
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 6 karakter"
                style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)", fontSize: "1rem", outline: "none", fontFamily: "var(--font-body)" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontWeight: "600", fontSize: "0.9rem" }}>Konfirmasi Password</label>
              <input
                id="reg-confirm" type="password" required
                value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
                placeholder="Ulangi password"
                style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)", fontSize: "1rem", outline: "none", fontFamily: "var(--font-body)" }}
              />
            </div>
            <button
              id="reg-submit" type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: "8px", padding: "15px" }}
            >
              {loading ? "Mendaftarkan..." : "Daftar & Masuk →"}
            </button>
          </form>

          <p style={{ marginTop: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Sudah punya akun?{" "}
            <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: "700", textDecoration: "none" }}>
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
