"""
display.py — Rendering UI overlay dan output console.

Layout layar:
  ┌─────────────────────────────────┬──────────────────────┐
  │                                 │  INFO PANEL          │
  │     LIVE CAMERA FEED            │  • Kategori          │
  │                                 │  • Volume            │
  │     [Panduan kotak tengah]      │  • Berat             │
  │                                 │  • Confidence bar    │
  │                                 │  • Deskripsi         │
  └─────────────────────────────────┴──────────────────────┘
  │ STATUS BAR (bawah penuh)                               │
  └────────────────────────────────────────────────────────┘
"""

import cv2
import numpy as np
from datetime import datetime
from classifier import PredictionResult
from config import (
    CATEGORY_COLORS, DEFAULT_COLOR,
    FRAME_WIDTH, FRAME_HEIGHT, INFO_PANEL_WIDTH,
)

# ── Warna UI ──────────────────────────────────────────────────────────────────
_BG_DARK    = (18,  18,  18 )
_BG_PANEL   = (28,  28,  35 )
_TEXT_WHITE = (240, 240, 240)
_TEXT_GRAY  = (140, 140, 140)
_TEXT_DIM   = (80,  80,  80 )
_ACCENT     = (100, 200, 255)
_SUCCESS    = (80,  210, 120)
_WARNING    = (0,   200, 255)
_DANGER     = (80,  80,  220)


# ═══════════════════════════════════════════════════════════════════════════════
# CONSOLE OUTPUT
# ═══════════════════════════════════════════════════════════════════════════════

def print_banner() -> None:
    print("""
╔══════════════════════════════════════════════════════╗
║    DETEKSI & PREDIKSI SAMPAH — Gemini Vision AI      ║
╠══════════════════════════════════════════════════════╣
║  Fitur  : Kategori + Volume + Berat                  ║
║  Kontrol: [SPACE] Analisis  [Q] Keluar               ║
╚══════════════════════════════════════════════════════╝
""")


def print_prediction(result: PredictionResult, frame_no: int, elapsed_ms: float) -> None:
    """Cetak hasil prediksi lengkap ke console dengan format tabel rapi."""
    ts      = datetime.now().strftime("%H:%M:%S")
    divider = "═" * 52
    emoji   = {"Plastik":"🧴","Kertas":"📄","Organik":"🌿","Logam":"🔩","Lainnya":"❓"}

    print(f"\n  {divider}")
    print(f"  🕐  {ts}   │   Frame #{frame_no:,}   │   ⚡ {elapsed_ms:.0f} ms")
    print(f"  {'─'*52}")
    print(f"  {emoji.get(result.category,'❓')}  KATEGORI   : {result.category.upper()}")
    print(f"  📦  Objek      : {result.item_description}")
    print(f"  {'─'*52}")
    print(f"  🧪  VOLUME     : {result.volume_liter:>8.3f} L    [ {result.volume_range} ]")
    print(f"  ⚖️   BERAT      : {result.weight_kg:>8.3f} kg   [ {result.weight_range} ]")
    print(f"  {'─'*52}")
    print(f"  🎯  Akurasi    : {result.confidence}")
    print(f"  📝  Material   : {result.material_note}")
    print(f"  {divider}\n")


def print_error(msg: str)  -> None: print(f"\n  [ERROR] {msg}")
def print_info(msg: str)   -> None: print(f"  [INFO]  {msg}")

def print_shutdown_stats(frames: int, detections: int) -> None:
    print("\n" + "=" * 52)
    print("  SESI SELESAI")
    print("=" * 52)
    print(f"  Total frame     : {frames:,}")
    print(f"  Total analisis  : {detections:,}")
    print("=" * 52 + "\n")


# ═══════════════════════════════════════════════════════════════════════════════
# OPENCV HELPER PRIMITIVES
# ═══════════════════════════════════════════════════════════════════════════════

def _rect_alpha(
    canvas: np.ndarray,
    pt1: tuple, pt2: tuple,
    color: tuple, alpha: float = 0.6,
) -> None:
    """Gambar persegi panjang semi-transparan (alpha blending)."""
    ov = canvas.copy()
    cv2.rectangle(ov, pt1, pt2, color, -1)
    cv2.addWeighted(ov, alpha, canvas, 1 - alpha, 0, canvas)


def _text(
    canvas: np.ndarray, txt: str,
    x: int, y: int,
    color: tuple = _TEXT_WHITE,
    scale: float = 0.45,
    bold: bool = False,
) -> int:
    """
    Tulis teks ke canvas, kembalikan lebar teks (piksel).
    bold=True → gambar dua kali dengan offset 1px untuk efek tebal.
    """
    font = cv2.FONT_HERSHEY_SIMPLEX
    th   = 2 if bold else 1
    if bold:
        cv2.putText(canvas, txt, (x+1, y+1), font, scale, (0,0,0), th+1, cv2.LINE_AA)
    cv2.putText(canvas, txt, (x, y), font, scale, color, th, cv2.LINE_AA)
    (w, _), _ = cv2.getTextSize(txt, font, scale, th)
    return w


def _progress_bar(
    canvas: np.ndarray,
    x: int, y: int, w: int, h: int,
    pct: int, fill_color: tuple, label: str = "",
) -> None:
    """Gambar progress bar horizontal dengan label opsional."""
    # Background
    cv2.rectangle(canvas, (x, y), (x+w, y+h), (50, 50, 50), -1)
    # Fill
    fill_w = int(w * min(pct, 100) / 100)
    if fill_w > 0:
        cv2.rectangle(canvas, (x, y), (x+fill_w, y+h), fill_color, -1)
    # Border
    cv2.rectangle(canvas, (x, y), (x+w, y+h), (80, 80, 80), 1)
    # Label
    if label:
        _text(canvas, label, x + w + 6, y + h - 1, _TEXT_GRAY, scale=0.36)


def _divider_line(canvas: np.ndarray, x: int, y: int, w: int) -> None:
    cv2.line(canvas, (x, y), (x+w, y), (55, 55, 65), 1)


def _guide_crosshair(canvas: np.ndarray, cx: int, cy: int, size: int = 130) -> None:
    """Gambar kotak panduan di tengah area kamera."""
    x1, y1 = cx - size, cy - size
    x2, y2 = cx + size, cy + size
    corner  = size // 4
    color   = (60, 60, 70)
    th      = 1
    for (px, py, dx, dy) in [(x1,y1,1,1),(x2,y1,-1,1),(x1,y2,1,-1),(x2,y2,-1,-1)]:
        cv2.line(canvas, (px, py), (px + dx*corner, py),      color, th, cv2.LINE_AA)
        cv2.line(canvas, (px, py), (px, py + dy*corner),      color, th, cv2.LINE_AA)
    _text(canvas, "Arahkan objek ke area ini",
          cx - 95, y2 + 18, _TEXT_DIM, scale=0.38)


# ═══════════════════════════════════════════════════════════════════════════════
# INFO PANEL RENDERER
# ═══════════════════════════════════════════════════════════════════════════════

def _draw_info_panel(
    canvas: np.ndarray,
    result: PredictionResult | None,
    is_analyzing: bool,
    tick: int,
    cam_w: int,
) -> None:
    """
    Render panel info di sisi kanan layar.

    Args:
        canvas:       Frame lengkap (kamera + panel area).
        result:       Hasil prediksi terakhir (None = belum ada).
        is_analyzing: True saat API call sedang berjalan.
        tick:         Frame counter untuk animasi.
        cam_w:        Lebar area kamera (panel dimulai dari sini).
    """
    h = canvas.shape[0]
    px = cam_w + 8   # X awal teks dalam panel
    pw = INFO_PANEL_WIDTH - 16

    # ── Panel background ──────────────────────────────────────────────────────
    cv2.rectangle(canvas, (cam_w, 0), (canvas.shape[1], h), _BG_PANEL, -1)

    # ── Header panel ──────────────────────────────────────────────────────────
    cv2.rectangle(canvas, (cam_w, 0), (canvas.shape[1], 36), (22, 22, 30), -1)
    _text(canvas, "HASIL ANALISIS", px, 22, _ACCENT, scale=0.48, bold=True)

    cy = 50   # cursor Y

    # ── Status: analyzing / idle ──────────────────────────────────────────────
    if is_analyzing:
        dots  = "." * ((tick // 7 % 3) + 1)
        blink = _WARNING if (tick // 15) % 2 == 0 else (150, 150, 0)
        cv2.circle(canvas, (px + 6, cy - 3), 5, blink, -1)
        _text(canvas, f"Menganalisis{dots}", px + 16, cy, _WARNING, scale=0.42)
        cy += 22
    else:
        cv2.circle(canvas, (px + 6, cy - 3), 5, (50, 180, 80), -1)
        _text(canvas, "Siap", px + 16, cy, _SUCCESS, scale=0.42)
        cy += 22

    _divider_line(canvas, cam_w + 4, cy, pw + 8)
    cy += 12

    if result is None or not result.is_valid:
        # Belum ada data — tampilkan placeholder
        _text(canvas, "Belum ada data.", px, cy, _TEXT_DIM, scale=0.42)
        _text(canvas, "Tekan SPACE untuk", px, cy + 18, _TEXT_DIM, scale=0.38)
        _text(canvas, "memulai analisis.", px, cy + 34, _TEXT_DIM, scale=0.38)
        return

    # ── Kategori ──────────────────────────────────────────────────────────────
    cat_color = CATEGORY_COLORS.get(result.category, DEFAULT_COLOR)
    _text(canvas, "KATEGORI", px, cy, _TEXT_GRAY, scale=0.36)
    cy += 16

    # Badge warna kategori
    badge_w = _text(canvas, result.category.upper(), px, cy, cat_color, scale=0.62, bold=True)
    cv2.rectangle(canvas, (px - 2, cy - 14), (px + badge_w + 4, cy + 4), cat_color, 1)
    cy += 20

    # Deskripsi objek
    _text(canvas, result.item_description, px, cy, _TEXT_GRAY, scale=0.36)
    cy += 20

    _divider_line(canvas, cam_w + 4, cy, pw + 8)
    cy += 12

    # ── Volume ────────────────────────────────────────────────────────────────
    _text(canvas, "VOLUME", px, cy, _TEXT_GRAY, scale=0.36)
    cy += 16
    _text(canvas, f"{result.volume_liter:.3f} L", px, cy, _TEXT_WHITE, scale=0.62, bold=True)
    cy += 18
    _text(canvas, f"Rentang: {result.volume_range}", px, cy, _TEXT_GRAY, scale=0.35)
    cy += 20

    _divider_line(canvas, cam_w + 4, cy, pw + 8)
    cy += 12

    # ── Berat ─────────────────────────────────────────────────────────────────
    _text(canvas, "BERAT", px, cy, _TEXT_GRAY, scale=0.36)
    cy += 16
    _text(canvas, f"{result.weight_kg:.3f} kg", px, cy, _TEXT_WHITE, scale=0.62, bold=True)
    cy += 18
    _text(canvas, f"Rentang: {result.weight_range}", px, cy, _TEXT_GRAY, scale=0.35)
    cy += 20

    _divider_line(canvas, cam_w + 4, cy, pw + 8)
    cy += 12

    # ── Confidence ───────────────────────────────────────────────────────────
    _text(canvas, "AKURASI", px, cy, _TEXT_GRAY, scale=0.36)
    cy += 16

    conf_color = {
        "Tinggi": _SUCCESS,
        "Sedang": _WARNING,
        "Rendah": _DANGER,
    }.get(result.confidence, _TEXT_GRAY)

    _text(canvas, result.confidence, px, cy, conf_color, scale=0.50, bold=True)
    cy += 16

    _progress_bar(
        canvas, px, cy, pw - 20, 7,
        result.confidence_pct, conf_color,
        f"{result.confidence_pct}%",
    )
    cy += 22

    _divider_line(canvas, cam_w + 4, cy, pw + 8)
    cy += 12

    # ── Material note ─────────────────────────────────────────────────────────
    _text(canvas, "MATERIAL", px, cy, _TEXT_GRAY, scale=0.36)
    cy += 16

    # Word-wrap sederhana jika teks terlalu panjang
    note = result.material_note
    if len(note) > 28:
        _text(canvas, note[:28] + "-", px, cy, _TEXT_GRAY, scale=0.36)
        cy += 14
        _text(canvas, note[28:], px, cy, _TEXT_GRAY, scale=0.36)
    else:
        _text(canvas, note, px, cy, _TEXT_GRAY, scale=0.36)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN OVERLAY RENDERER
# ═══════════════════════════════════════════════════════════════════════════════

def draw_overlay(
    frame:        np.ndarray,
    result:       PredictionResult | None,
    is_analyzing: bool,
    tick:         int,
    next_in:      float,
) -> np.ndarray:
    """
    Render semua elemen UI di atas frame kamera dan kembalikan canvas final.

    Args:
        frame:        Frame BGR asli dari kamera.
        result:       Hasil PredictionResult terakhir (None = belum ada).
        is_analyzing: True saat API call berjalan di background.
        tick:         Counter frame untuk animasi.
        next_in:      Detik hingga auto-sampling berikutnya.

    Returns:
        np.ndarray: Canvas lengkap siap ditampilkan via cv2.imshow.
    """
    h, w = frame.shape[:2]
    cam_w = w   # Lebar area kamera = lebar frame asli

    # Buat canvas lebih lebar untuk panel info di kanan
    canvas = np.zeros((h, cam_w + INFO_PANEL_WIDTH, 3), dtype=np.uint8)
    canvas[:h, :cam_w] = frame

    # ── Header bar (area kamera) ──────────────────────────────────────────────
    _rect_alpha(canvas, (0, 0), (cam_w, 42), _BG_DARK, alpha=0.70)
    _text(canvas, "Deteksi Sampah Real-Time", 10, 20, _TEXT_WHITE, scale=0.58, bold=True)
    hint = f"[SPACE] Analisis  [Q] Keluar"
    _text(canvas, hint, 10, 36, _TEXT_DIM, scale=0.34)

    # Timer auto-sampling di pojok kanan atas area kamera
    if not is_analyzing:
        timer_txt = f"Auto: {next_in:.1f}s"
        tw = _text(canvas, timer_txt, 0, 0, _TEXT_GRAY, scale=0.37)  # dummy untuk ukuran
        _text(canvas, timer_txt, cam_w - tw - 36, 36, _TEXT_GRAY, scale=0.37)

    # ── Panduan tengah (jika belum ada hasil) ────────────────────────────────
    if result is None or not result.is_valid:
        _guide_crosshair(canvas, cam_w // 2, h // 2, size=120)

    # ── Tanda "ANALYZING" di tengah layar kamera ─────────────────────────────
    if is_analyzing:
        overlay_h, overlay_w = 40, 200
        ox = (cam_w - overlay_w) // 2
        oy = h // 2 - overlay_h // 2
        _rect_alpha(canvas, (ox, oy), (ox+overlay_w, oy+overlay_h), (20, 20, 20), alpha=0.75)
        dots = "." * ((tick // 7 % 3) + 1)
        _text(canvas, f"  Menganalisis{dots}", ox + 10, oy + 26, _WARNING, scale=0.55, bold=True)

    # ── Status bar bawah (area kamera) ───────────────────────────────────────
    _rect_alpha(canvas, (0, h - 30), (cam_w, h), _BG_DARK, alpha=0.72)
    if result and result.is_valid:
        cat_color = CATEGORY_COLORS.get(result.category, DEFAULT_COLOR)
        status = f"{result.category}  |  {result.volume_liter:.3f} L  |  {result.weight_kg:.3f} kg  |  {result.confidence}"
        _text(canvas, status, 10, h - 10, cat_color, scale=0.42, bold=True)
    else:
        _text(canvas, "Tekan SPACE atau tunggu auto-sampling...", 10, h - 10, _TEXT_DIM, scale=0.38)

    # ── Info panel kanan ─────────────────────────────────────────────────────
    _draw_info_panel(canvas, result, is_analyzing, tick, cam_w)

    # ── Separator line kamera | panel ────────────────────────────────────────
    cv2.line(canvas, (cam_w, 0), (cam_w, h), (50, 50, 60), 1)

    return canvas