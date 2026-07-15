"""
config.py — Konfigurasi terpusat untuk program deteksi & prediksi sampah.
"""

import os

# ── API Configuration ─────────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str   = "gemini-3.1-flash-lite"

# ── Camera Configuration ──────────────────────────────────────────────────────
CAMERA_INDEX: int  = 0
FRAME_WIDTH: int   = 640
FRAME_HEIGHT: int  = 480
FRAME_FPS: int     = 30

# ── Sampling Configuration ────────────────────────────────────────────────────
# Interval minimum (detik) antar API call agar tidak boros kuota.
# Tekan [SPACE] untuk analisis manual kapan saja.
SAMPLING_INTERVAL_SECONDS: float = 4.0

# ── Detection Categories ──────────────────────────────────────────────────────
VALID_CATEGORIES: list[str] = ["Plastik", "Kertas", "Organik", "Logam", "Lainnya"]
CONFIDENCE_LEVELS: list[str] = ["Tinggi", "Sedang", "Rendah"]

# ── Display ───────────────────────────────────────────────────────────────────
WINDOW_TITLE: str = "Deteksi & Prediksi Sampah  |  [SPACE] Analisis  [Q] Keluar"

# Warna per kategori — BGR format
CATEGORY_COLORS: dict[str, tuple[int, int, int]] = {
    "Plastik": (0,   165, 255),   # Oranye
    "Kertas":  (255, 220, 0  ),   # Kuning
    "Organik": (0,   200, 80 ),   # Hijau
    "Logam":   (210, 210, 210),   # Silver
    "Lainnya": (80,  80,  220),   # Merah-biru
}
DEFAULT_COLOR: tuple[int, int, int] = (200, 200, 200)

# Lebar panel info di sisi kanan layar (piksel)
INFO_PANEL_WIDTH: int = 220
