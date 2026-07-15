"""
main.py — Entry point program deteksi & prediksi sampah.

Fitur:
  - Klasifikasi kategori sampah (Plastik/Kertas/Organik/Logam/Lainnya)
  - Prediksi Volume (mL) dengan rentang estimasi
  - Prediksi Berat (gram) dengan rentang estimasi
  - Tingkat akurasi (Tinggi/Sedang/Rendah) + progress bar
  - Auto-sampling setiap N detik (konfigurasi di config.py)
  - Manual trigger dengan [SPACE]

Arsitektur:
  ┌───────────────────────────────────────────────────────────────┐
  │  Main Thread  (setiap frame)                                  │
  │   1. Baca frame kamera                                        │
  │   2. Cek interval / tombol SPACE → spawn worker thread        │
  │   3. Render overlay + info panel                              │
  │   4. Tampilkan via cv2.imshow                                 │
  │                                                               │
  │  Worker Thread  (background, per API call)                    │
  │   └─ frame → Gemini API → PredictionResult → update state    │
  └───────────────────────────────────────────────────────────────┘

Jalankan:
  # Edit GEMINI_API_KEY di config.py, atau:
  export GEMINI_API_KEY="your_key_here"
  python main.py
"""

import sys
import time
import threading

import cv2

from config     import (
    GEMINI_API_KEY, SAMPLING_INTERVAL_SECONDS, WINDOW_TITLE,
    FRAME_WIDTH, INFO_PANEL_WIDTH,
)
from camera     import init_camera, read_frame, release_camera, CameraError
from classifier import init_classifier, analyze_frame, ClassifierError, PredictionResult
from display    import (
    draw_overlay, print_banner, print_prediction,
    print_error, print_info, print_shutdown_stats,
)


# ═══════════════════════════════════════════════════════════════════════════════
# Thread-safe Shared State
# ═══════════════════════════════════════════════════════════════════════════════

class AppState:
    """
    Menyimpan state bersama antara main thread dan worker thread.
    Semua operasi baca/tulis dijaga threading.Lock.
    """

    def __init__(self) -> None:
        self._lock      = threading.Lock()
        self._result:   PredictionResult | None = None
        self._is_busy:  bool                    = False
        self._frame:    object                  = None   # np.ndarray copy

    # ── Result ────────────────────────────────────────────────────────────────
    @property
    def result(self) -> PredictionResult | None:
        with self._lock: return self._result

    @result.setter
    def result(self, v: PredictionResult | None) -> None:
        with self._lock: self._result = v

    # ── Busy flag ─────────────────────────────────────────────────────────────
    @property
    def is_busy(self) -> bool:
        with self._lock: return self._is_busy

    @is_busy.setter
    def is_busy(self, v: bool) -> None:
        with self._lock: self._is_busy = v

    # ── Frame buffer ──────────────────────────────────────────────────────────
    def set_frame(self, frame) -> None:
        with self._lock: self._frame = frame.copy()

    def get_frame(self):
        with self._lock: return self._frame


# ═══════════════════════════════════════════════════════════════════════════════
# Worker Thread
# ═══════════════════════════════════════════════════════════════════════════════

def _api_worker(model, state: AppState, frame_no: int) -> None:
    """
    Kirim frame ke Gemini API di background thread.
    Menggunakan analyze_frame() yang mengembalikan PredictionResult (kategori
    + volume + berat dalam satu call).
    """
    frame = state.get_frame()
    if frame is None:
        state.is_busy = False
        return

    t0 = time.perf_counter()
    try:
        result     = analyze_frame(model, frame)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        state.result = result
        print_prediction(result, frame_no, elapsed_ms)

    except ClassifierError as e:
        print_error(str(e))

    finally:
        state.is_busy = False   # WAJIB: reset agar trigger berikutnya bisa jalan


# ═══════════════════════════════════════════════════════════════════════════════
# Main Loop
# ═══════════════════════════════════════════════════════════════════════════════

def _spawn_analysis(model, state: AppState, frame, frame_no: int, detection_count: int) -> None:
    """Helper: tandai busy, simpan frame, spawn worker thread."""
    state.is_busy = True
    state.set_frame(frame)
    threading.Thread(
        target  = _api_worker,
        args    = (model, state, frame_no),
        daemon  = True,
        name    = f"gemini-worker-{detection_count}",
    ).start()


def run_detector() -> None:
    """Loop utama program."""
    print_banner()

    # ── Validasi API Key ──────────────────────────────────────────────────────
    if GEMINI_API_KEY == "YOUR_API_KEY_HERE":
        print_error(
            "GEMINI_API_KEY belum diset!\n"
            "  → Edit baris GEMINI_API_KEY di config.py\n"
            "  → Atau: export GEMINI_API_KEY='isi_key_di_sini'"
        )
        sys.exit(1)

    # ── Init Gemini ───────────────────────────────────────────────────────────
    print_info("Menginisialisasi Gemini model...")
    try:
        model = init_classifier()
        print_info(f"Model '{model.model_name}' siap. ✓")
    except ClassifierError as e:
        print_error(str(e)); sys.exit(1)

    # ── Init Kamera ───────────────────────────────────────────────────────────
    print_info("Membuka kamera...")
    try:
        cap = init_camera()
        print_info("Kamera berhasil dibuka. ✓\n")
    except CameraError as e:
        print_error(str(e)); sys.exit(1)

    # ── State & Counters ──────────────────────────────────────────────────────
    state           = AppState()
    frame_count     = 0
    detection_count = 0
    last_api_time   = 0.0
    tick            = 0

    print_info(f"Siap! Auto-analisis setiap {SAMPLING_INTERVAL_SECONDS:.0f} detik.")
    print_info("Tekan [SPACE] untuk analisis manual, [Q] untuk keluar.\n")

    try:
        while True:
            # ── Baca Frame ────────────────────────────────────────────────────
            try:
                frame = read_frame(cap)
            except CameraError as e:
                print_error(str(e)); break

            frame_count += 1
            tick        += 1
            now          = time.time()

            # ── Keyboard ──────────────────────────────────────────────────────
            key = cv2.waitKey(1) & 0xFF

            if key == ord('q'):
                print_info("Keluar..."); break

            # ── Trigger Logic ─────────────────────────────────────────────────
            # [SPACE] → analisis manual kapan saja (abaikan cooldown)
            # Auto    → setelah SAMPLING_INTERVAL_SECONDS berlalu
            manual_trigger = (key == ord(' '))
            auto_trigger   = (now - last_api_time) >= SAMPLING_INTERVAL_SECONDS

            if (manual_trigger or auto_trigger) and not state.is_busy:
                last_api_time    = now
                detection_count += 1

                if manual_trigger:
                    print_info(f"Manual trigger (frame #{frame_count:,})")

                _spawn_analysis(model, state, frame, frame_count, detection_count)

            # ── Hitung countdown ──────────────────────────────────────────────
            next_in = max(0.0, SAMPLING_INTERVAL_SECONDS - (now - last_api_time))

            # ── Render & Tampilkan ────────────────────────────────────────────
            canvas = draw_overlay(
                frame        = frame,
                result       = state.result,
                is_analyzing = state.is_busy,
                tick         = tick,
                next_in      = next_in,
            )
            cv2.imshow(WINDOW_TITLE, canvas)

    except KeyboardInterrupt:
        print_info("\nCtrl+C diterima.")

    finally:
        release_camera(cap)
        cv2.destroyAllWindows()
        print_shutdown_stats(frame_count, detection_count)


if __name__ == "__main__":
    run_detector()
