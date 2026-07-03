"use client";
import React, { useState, useEffect } from "react";

interface AnalyticsSummary {
  total_trash_collected_kg: number;
  top_materials: { type: string; percentage: number }[];
}

const TRASH_ID: Record<string, string> = {
  Plastic: "Plastik",
  Paper: "Kertas",
  Metal: "Logam",
  Glass: "Kaca",
  Organic: "Organik",
  Other: "Lainnya",
};

export default function RekomendasiDIYPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [resultText, setResultText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : "http://127.0.0.1:8000");

  useEffect(() => {
    let isMounted = true;
    async function fetchSummary() {
      try {
        const res = await fetch(`${baseUrl}/api/v1/analytics/summary`, {
          cache: "no-store",
        });
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setSummary(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoadingSummary(false);
      }
    }
    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, [baseUrl]);

  const handleAnalyze = async () => {
    if (!summary) return;
    setLoading(true);
    setError(null);
    setResultText("");

    try {
      // Siapkan items berdasarkan jenis sampah terbanyak di sistem
      const topMat = summary.top_materials
        .slice(0, 3)
        .map(
          (m) =>
            `${TRASH_ID[m.type] || m.type} (Sebanyak ${m.percentage.toFixed(0)}%)`,
        )
        .join(", ");

      const itemsList = topMat || "Plastik, Kertas, Organik";

      // Panggil endpoint backend kita
      const res = await fetch(`${baseUrl}/api/v1/diy/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsList }),
      });

      if (!res.ok) {
        throw new Error(`Gagal menghubungi server. Status: ${res.status}`);
      }

      // Membaca stream respons text
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        throw new Error("Gagal membaca streaming data");
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setResultText((prev) => prev + chunk);
      }
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Terjadi kesalahan saat menganalisis.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease-out_forwards] pb-7">
      {/* Hero Header */}
      <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-indigo-700 to-indigo-900 text-white p-5 shadow-lg shadow-indigo-900/20 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-4 w-16 h-16 rounded-full bg-white/5 translate-y-8" />

        <div className="flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-white text-[1.6rem] font-extrabold m-0 mb-1 font-[family-name:var(--font-heading)]">
              ✨ Rekomendasi DIY
            </h1>
            <p className="text-white/75 text-[0.85rem] m-0 leading-relaxed">
              Resep kreatif ala EcoCrafter
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 bg-white/10 py-1 px-3 rounded-full relative z-10">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-[pulse_1.2s_infinite]" />
              <span className="text-white/90 text-[0.72rem] font-semibold">
                Live AI Generation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      {!loadingSummary && summary && (
        <div className="mx-4 mt-6">
          <div className="bg-white rounded-[18px] p-4 pt-4 pb-4 shadow-[0_6px_24px_rgba(0,0,0,0.09)] relative z-10">
            <div className="text-[0.7rem] font-bold text-gray-400 uppercase tracking-wide mb-2.5">
              Bahan di Tempat Sampah Saat Ini
            </div>
            <div className="flex gap-4 flex-wrap">
              <div>
                <div className="text-[1.5rem] font-extrabold text-green-700 font-[family-name:var(--font-heading)]">
                  {summary.total_trash_collected_kg.toFixed(1)}{" "}
                  <span className="text-[0.85rem] font-medium text-gray-500">
                    kg
                  </span>
                </div>
                <div className="text-[0.72rem] text-gray-500">
                  Total terkumpul
                </div>
              </div>
              <div className="w-[1px] bg-gray-100" />
              <div className="flex-1">
                <div className="text-[0.72rem] text-gray-500 mb-1">
                  Jenis terbanyak:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(summary.top_materials.length > 0
                    ? summary.top_materials.slice(0, 3)
                    : [
                        { type: "Plastic", percentage: 45 },
                        { type: "Paper", percentage: 30 },
                        { type: "Organic", percentage: 15 },
                      ]
                  ).map((m) => (
                    <span
                      key={m.type}
                      className="text-[0.72rem] font-semibold bg-green-50 text-green-700 py-0.5 px-2 rounded-full border border-green-200"
                    >
                      {TRASH_ID[m.type] || m.type} {m.percentage.toFixed(0)}%
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`w-full mt-4 p-3.5 rounded-2xl border-none text-white font-bold text-[0.95rem] font-[family-name:var(--font-heading)] flex items-center justify-center gap-2 transition-all duration-200 ${
                loading
                  ? "bg-gradient-to-br from-gray-400 to-gray-300 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-br from-blue-700 to-indigo-900 cursor-pointer shadow-[0_4px_16px_rgba(21,101,192,0.3)] hover:scale-[1.02]"
              }`}
            >
              {loading && resultText.length === 0 ? (
                <>
                  <span className="inline-block animate-[spin_1s_linear_infinite]">
                    ⚙️
                  </span>
                  Menganalisis...
                </>
              ) : (
                <>✨ Analisis & Dapatkan Resep DIY</>
              )}
            </button>
          </div>
        </div>
      )}

      {loadingSummary && (
        <div className="text-center py-10 text-gray-500">
          <div className="text-3xl mb-2 inline-block animate-[spin_1.5s_linear_infinite]">
            ⚙️
          </div>
          <p className="m-0 text-[0.85rem]">Memuat bahan-bahan...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex gap-2.5 items-start">
            <span className="text-[1.3rem]">⚠️</span>
            <div>
              <div className="font-bold text-red-600 text-[0.9rem] mb-1">
                Gagal Menganalisis
              </div>
              <div className="text-[0.8rem] text-red-800 leading-relaxed">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results from Streaming Backend */}
      {resultText && (
        <div className="px-4 mt-5">
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_3px_16px_rgba(0,0,0,0.06)] border border-gray-100 p-5">
            <div className="flex gap-2 items-center mb-4 border-b border-gray-100 pb-3">
              <span className="text-2xl">👩‍🎨</span>
              <h2 className="text-[1.1rem] font-bold text-gray-800 m-0">
                EcoCrafter Ideas
              </h2>
              {loading && (
                <span className="ml-auto text-xs font-bold text-blue-500 animate-pulse">
                  Mengetik...
                </span>
              )}
            </div>

            {/* Render Text using whitespace-pre-wrap to respect newlines and markdown-like spacing */}
            <div className="text-gray-700 leading-relaxed text-[0.9rem] whitespace-pre-wrap font-medium">
              {/* Replace **text** with bold tags dynamically for simple rendering without react-markdown */}
              {resultText.split("**").map((chunk, index) =>
                index % 2 !== 0 ? (
                  <strong key={index} className="text-gray-900">
                    {chunk}
                  </strong>
                ) : (
                  chunk
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !resultText && !error && !loadingSummary && (
        <div className="text-center pt-10 px-6">
          <div className="text-5xl mb-3">♻️</div>
          <h3 className="text-base font-bold text-gray-800 m-0 mb-1.5">
            Siap Bereksperimen!
          </h3>
          <p className="text-[0.85rem] text-gray-500 m-0 leading-relaxed">
            Tekan tombol di atas untuk mendapatkan resep kreasi DIY ala
            EcoCrafter berdasarkan bahan sampah yang Anda kumpulkan.
          </p>
        </div>
      )}
    </div>
  );
}
