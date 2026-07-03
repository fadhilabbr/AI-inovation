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
  const [showPass, setShowPass] = useState(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : "http://127.0.0.1:8000");

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
      login(data.access_token, data.refresh_token, data.user);
      router.push(data.user.role === "admin" ? "/adminpage" : "/");
    } catch {
      setError("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start overflow-hidden relative">
      {/* Hero Header */}
      <div className="w-full bg-gradient-to-br from-green-900 via-green-800 to-lime-700 pt-12 px-6 pb-20 text-center relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-[50px] -right-[50px] w-[200px] h-[200px] bg-white/5 rounded-full" />
        <div className="absolute -bottom-[30px] -left-[30px] w-[140px] h-[140px] bg-white/5 rounded-full" />
        <div className="absolute top-[30px] left-[20px] w-[70px] h-[70px] bg-white/5 rounded-full" />

        {/* Logo */}
        <div className="inline-flex items-center justify-center w-[68px] h-[68px] bg-white/15 rounded-2xl text-[2.2rem] mb-5 backdrop-blur-md border border-white/20">
          ♻️
        </div>

        <h1 className="text-white text-3xl font-extrabold m-0 mb-2 font-[family-name:var(--font-heading)]">
          Eco<span className="text-green-300">Craft</span>
        </h1>
        <p className="text-white/75 text-[0.9rem] m-0">
          Sistem Daur Ulang & Persampahan Cerdas
        </p>
      </div>

      {/* Card Form — overlapping hero */}
      <div className="w-full max-w-[460px] px-5 -mt-10 relative z-10">
        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100">
          <h2 className="text-[1.4rem] font-extrabold text-gray-800 mb-1 font-[family-name:var(--font-heading)]">
            Selamat Datang Kembali 👋
          </h2>
          <p className="text-gray-500 text-[0.9rem] mb-7 m-0">
            Masuk untuk melanjutkan sesi Anda.
          </p>

          {/* Error Banner */}
          {error && (
            <div className="py-3 px-4 bg-red-50 text-red-500 rounded-xl mb-5 text-[0.85rem] font-medium border border-red-200 flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-email"
                className="font-semibold text-[0.85rem] text-gray-800"
              >
                Alamat Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contoh@email.com"
                className="p-3.5 rounded-xl border-1.5 border-gray-200 bg-gray-50 text-[0.95rem] outline-none font-[family-name:var(--font-body)] text-gray-800 transition-colors focus:border-green-600 focus:bg-white"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-password"
                className="font-semibold text-[0.85rem] text-gray-800"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="off"
                  placeholder="Masukkan password"
                  className="w-full py-3.5 pl-4 pr-12 rounded-xl border-1.5 border-gray-200 bg-gray-50 text-[0.95rem] outline-none font-[family-name:var(--font-body)] text-gray-800 box-border transition-colors focus:border-green-600 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-base text-gray-400 p-0"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className={`mt-1 p-3.5 rounded-xl border-none text-white text-base font-bold font-[family-name:var(--font-heading)] transition-all duration-200 flex items-center justify-center gap-2 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-br from-green-700 to-green-600 cursor-pointer shadow-[0_4px_20px_rgba(46,125,50,0.35)] hover:scale-[1.02]"
              }`}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-[spin_1s_linear_infinite]">⏳</span>
                  Memproses...
                </>
              ) : (
                "Masuk →"
              )}
            </button>
          </form>

          {/* Admin hint */}
          <div className="mt-6 py-3 px-4 bg-green-50 rounded-xl border border-dashed border-green-300">
            <p className="m-0 text-[0.78rem] text-gray-600 font-medium">
              🛡️ <strong>Demo Admin:</strong> admin@dlhk.go.id / admin123
            </p>
          </div>

          {/* Register link */}
          <p className="mt-5 text-center text-gray-500 text-[0.88rem] m-0">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-green-700 font-bold no-underline hover:text-green-800"
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-3 mt-5 pb-10">
          {[
            { icon: "🤖", label: "AI Deteksi" },
            { icon: "📍", label: "GPS Live" },
          ].map((f) => (
            <div
              key={f.label}
              className="bg-white/80 rounded-xl py-3.5 px-2 text-center shadow-sm border border-gray-100 backdrop-blur-sm"
            >
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-[0.72rem] font-bold text-gray-500">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
