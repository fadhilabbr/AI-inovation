"""
classifier.py — Analisis sampah menggunakan Gemini Vision API.

Satu API call menghasilkan TIGA prediksi sekaligus:
  1. Kategori sampah (Plastik / Kertas / Organik / Logam / Lainnya)
  2. Estimasi Volume (Liter) beserta rentang kepercayaan
  3. Estimasi Berat (kilogram) beserta rentang kepercayaan

Output dikembalikan sebagai PredictionResult (dataclass), bukan string mentah.
JSON parsing dilakukan dengan fallback bertingkat untuk ketahanan error.
"""

import re
import json
import cv2
import numpy as np
import PIL.Image
import google.generativeai as genai
from dataclasses import dataclass, field

from config import GEMINI_API_KEY, GEMINI_MODEL, VALID_CATEGORIES, CONFIDENCE_LEVELS


# ═══════════════════════════════════════════════════════════════════════════════
# Data Model
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class PredictionResult:
    """
    Hasil lengkap satu sesi analisis Gemini.
    Semua field memiliki nilai default sehingga parsing parsial tetap aman.
    """
    category:         str   = "Lainnya"
    item_description: str   = "-"
    volume_liter:     float = 0.0
    volume_range:     str   = "-"
    weight_kg:        float = 0.0
    weight_range:     str   = "-"
    confidence:       str   = "Rendah"
    material_note:    str   = "-"

    @property
    def confidence_pct(self) -> int:
        """Konversi confidence label ke persentase untuk progress bar."""
        return {"Tinggi": 90, "Sedang": 65, "Rendah": 35}.get(self.confidence, 35)

    @property
    def is_valid(self) -> bool:
        """True jika hasil merupakan deteksi yang bermakna."""
        return self.category in VALID_CATEGORIES and self.volume_liter > 0


# ═══════════════════════════════════════════════════════════════════════════════
# System Instruction
# ═══════════════════════════════════════════════════════════════════════════════

_SYSTEM_INSTRUCTION = """
Kamu adalah sistem analisis sampah berbasis visi komputer yang sangat akurat.

TUGAS: Analisis gambar sampah dan berikan prediksi kategori, volume, dan berat.

PANDUAN ESTIMASI VOLUME:
- Gunakan referensi visual: tangan manusia (lebar telapak ±9cm), meja, atau objek umum
- Hitung volume geometri perkiraan (silinder, balok, bola) berdasarkan dimensi visual
- Contoh referensi: botol 600ml = tinggi 22cm diameter 6cm, kaleng 330ml = tinggi 12cm diameter 6cm
- Jika ada tangan dalam gambar, gunakan proporsi tangan vs objek sebagai skala

PANDUAN ESTIMASI BERAT:
- Plastik PET/PP: 0.9-1.4 g/cm³ → botol 600ml ≈ 0.020-0.030 kg, gelas plastik ≈ 0.005-0.015 kg
- Kertas/Kardus: 0.5-1.2 g/cm³ → A4 80gsm ≈ 0.005 kg, kardus mie ≈ 0.050-0.080 kg
- Organik: 0.8-1.1 g/cm³ → kulit pisang ≈ 0.040-0.060 kg, sisa nasi ≈ 0.100-0.300 kg
- Aluminium: 2.7 g/cm³ → kaleng 330ml ≈ 0.013-0.015 kg, foil ≈ 0.001-0.005 kg
- Besi/Baja: 7.8 g/cm³ → sendok ≈ 0.030-0.040 kg, kaleng besi ≈ 0.050-0.080 kg
- Kaca: 2.5 g/cm³ → botol kaca 330ml ≈ 0.200-0.250 kg

ATURAN OUTPUT (WAJIB DIIKUTI):
1. Jawab HANYA dalam format JSON valid berikut, tanpa teks tambahan apapun:
{
  "category": "<Plastik|Kertas|Organik|Logam|Lainnya>",
  "item_description": "<deskripsi singkat objek, maks 40 karakter>",
  "volume_liter": <angka float, estimasi volume dalam LITER, contoh: 0.6>,
  "volume_range": "<min>-<max> L",
  "weight_kg": <angka float, estimasi berat dalam KILOGRAM, contoh: 0.025>,
  "weight_range": "<min>-<max> kg",
  "confidence": "<Tinggi|Sedang|Rendah>",
  "material_note": "<catatan material spesifik, maks 50 karakter>"
}

2. Gunakan "Tinggi" jika objek jelas terlihat dan mudah diidentifikasi.
3. Gunakan "Sedang" jika ada ambiguitas ukuran atau material.
4. Gunakan "Rendah" jika gambar buram, objek tidak jelas, atau tidak ada sampah.
5. Jika tidak ada sampah terlihat: category="Lainnya", volume_liter=0, weight_kg=0, confidence="Rendah"
6. JANGAN tambahkan komentar, markdown, atau teks di luar JSON.
""".strip()


# ═══════════════════════════════════════════════════════════════════════════════
# Classifier Class
# ═══════════════════════════════════════════════════════════════════════════════

class ClassifierError(Exception):
    """Exception untuk kegagalan klasifikasi."""
    pass


def init_classifier() -> genai.GenerativeModel:
    """
    Inisialisasi Gemini model dengan system instruction untuk analisis lengkap.

    Returns:
        genai.GenerativeModel siap digunakan.

    Raises:
        ClassifierError: Jika konfigurasi API gagal.
    """
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=_SYSTEM_INSTRUCTION,
        )
        return model
    except Exception as e:
        raise ClassifierError(f"Gagal menginisialisasi Gemini: {e}") from e


def _frame_to_pil(frame: np.ndarray) -> PIL.Image.Image:
    """Konversi frame OpenCV BGR ke PIL Image RGB."""
    return PIL.Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))


def _parse_response(raw_text: str) -> PredictionResult:
    """
    Parse teks JSON dari Gemini menjadi PredictionResult.

    Strategi parsing bertingkat:
      1. Direct JSON parse (ideal case)
      2. Regex extraction dari dalam blok ```json ... ```
      3. Regex cari kurung kurawal pertama-terakhir
      4. Fallback ke PredictionResult default jika semua gagal

    Args:
        raw_text: String mentah dari response.text Gemini.

    Returns:
        PredictionResult yang sudah divalidasi.
    """
    # Bersihkan whitespace berlebih
    text = raw_text.strip()

    # ── Strategi 1: Direct parse ──────────────────────────────────────────────
    data = _try_json_parse(text)

    # ── Strategi 2: Strip markdown code block ─────────────────────────────────
    if data is None:
        match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
        if match:
            data = _try_json_parse(match.group(1))

    # ── Strategi 3: Cari {} di mana saja ─────────────────────────────────────
    if data is None:
        match = re.search(r"\{[\s\S]+\}", text)
        if match:
            data = _try_json_parse(match.group(0))

    # ── Fallback ──────────────────────────────────────────────────────────────
    if data is None:
        return PredictionResult(confidence="Rendah", material_note="Parse error")

    return _dict_to_result(data)


def _try_json_parse(text: str) -> dict | None:
    """Coba parse string ke dict JSON, kembalikan None jika gagal."""
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except (json.JSONDecodeError, ValueError):
        return None


def _dict_to_result(data: dict) -> PredictionResult:
    """
    Konversi dict JSON ke PredictionResult dengan validasi per-field.
    Field yang tidak valid akan menggunakan nilai default yang aman.
    """
    def safe_float(val, default: float = 0.0) -> float:
        try:
            return max(0.0, float(val))
        except (TypeError, ValueError):
            return default

    def safe_str(val, default: str = "-", max_len: int = 80) -> str:
        return str(val)[:max_len].strip() if val else default

    # Normalisasi kategori
    raw_cat = safe_str(data.get("category"), "Lainnya")
    category = "Lainnya"
    for valid in ("Plastik", "Kertas", "Organik", "Logam", "Lainnya"):
        if valid.lower() in raw_cat.lower():
            category = valid
            break

    # Normalisasi confidence
    raw_conf = safe_str(data.get("confidence"), "Rendah")
    confidence = "Rendah"
    for level in ("Tinggi", "Sedang", "Rendah"):
        if level.lower() in raw_conf.lower():
            confidence = level
            break

    return PredictionResult(
        category         = category,
        item_description = safe_str(data.get("item_description"), "-", 50),
        volume_liter     = safe_float(data.get("volume_liter")),
        volume_range     = safe_str(data.get("volume_range"), "-"),
        weight_kg        = safe_float(data.get("weight_kg")),
        weight_range     = safe_str(data.get("weight_range"), "-"),
        confidence       = confidence,
        material_note    = safe_str(data.get("material_note"), "-", 60),
    )

import time

def analyze_frame(model, frame):
    max_retries = 3
    wait = 5  # detik awal

    for attempt in range(max_retries):
        try:
            pil_image = _frame_to_pil(frame)
            prompt = (
                "Analisis gambar ini. Identifikasi jenis sampah, "
                "estimasikan volume (Liter) dan berat (kilogram) berdasarkan ukuran visual. "
                "Kembalikan HANYA JSON sesuai format yang diminta."
            )
            response = model.generate_content(
                contents=[prompt, pil_image],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=256,
                ),
            )
            return _parse_response(response.text)

        except genai.types.BlockedPromptException:
            return PredictionResult(
                category="Lainnya",
                item_description="Diblokir safety filter",
                confidence="Rendah",
            )
        except Exception as e:
            err = str(e).lower()
            # Deteksi rate limit / quota error
            if any(k in err for k in ["429", "quota", "rate", "resource exhausted"]):
                if attempt < max_retries - 1:
                    print(f"  [RATE LIMIT] Tunggu {wait}s lalu retry ({attempt+1}/{max_retries})...")
                    time.sleep(wait)
                    wait *= 2   # Backoff: 5s → 10s → 20s
                    continue
            raise ClassifierError(f"API request gagal: {e}") from e

    return PredictionResult(confidence="Rendah", material_note="Rate limit tercapai")