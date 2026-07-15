"""
tracker.py — Deteksi & tracking objek secara lokal menggunakan OpenCV.

Strategi:
  1. Background Subtraction (MOG2) → pisahkan foreground dari background.
  2. Morphological ops (dilate + erode) → bersihkan noise kecil.
  3. findContours → temukan kontur objek.
  4. Filter by area → abaikan noise & background yang terlalu besar.
  5. Pilih kontur terbesar → anggap sebagai objek utama yang dipegang.
  6. Stability counter → tunggu N frame stabil sebelum trigger API.

Seluruh proses ini berjalan di CPU lokal setiap frame (~1ms),
TANPA mengirim data ke internet.
"""

import cv2
import numpy as np
from dataclasses import dataclass, field
from config import (
    TRACKER_MIN_AREA,
    TRACKER_MAX_AREA,
    TRACKER_STABLE_FRAMES,
    TRACKER_BOX_PADDING,
    FRAME_WIDTH,
    FRAME_HEIGHT,
)


@dataclass
class TrackedObject:
    """Hasil tracking objek dalam satu frame."""
    found:         bool              = False
    bbox:          tuple | None      = None   # (x, y, w, h) sebelum padding
    bbox_padded:   tuple | None      = None   # (x, y, w, h) setelah padding + clamp
    center:        tuple | None      = None   # (cx, cy)
    area:          int               = 0
    stable_frames: int               = 0      # Berapa frame berturut-turut objek terdeteksi
    is_stable:     bool              = False  # True jika stable_frames >= threshold


class ObjectTracker:
    """
    Tracker objek berbasis background subtraction.

    Lifecycle:
      tracker = ObjectTracker()
      while True:
          frame = camera.read()
          result = tracker.update(frame)
          if result.is_stable:
              # kirim ke Gemini
    """

    def __init__(self) -> None:
        # MOG2: Mixture of Gaussians — algoritm background subtraction adaptif
        # history=300  → jumlah frame untuk membangun model background
        # varThreshold → sensitivitas deteksi perubahan piksel
        # detectShadows → nonaktifkan (kita tidak butuh deteksi bayangan)
        self._bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=300,
            varThreshold=40,
            detectShadows=False,
        )

        # Kernel morfologi untuk operasi dilate/erode
        self._kernel_dilate = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE, (9, 9)
        )
        self._kernel_erode = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE, (5, 5)
        )

        self._stable_counter: int = 0
        self._last_bbox: tuple | None = None

    def update(self, frame: np.ndarray) -> TrackedObject:
        """
        Proses satu frame dan kembalikan hasil tracking.

        Args:
            frame: Frame BGR dari kamera.

        Returns:
            TrackedObject dengan informasi bounding box & status stabilitas.
        """
        # ── 1. Foreground Mask ────────────────────────────────────────────────
        fg_mask = self._bg_subtractor.apply(frame)

        # ── 2. Morphological Cleanup ──────────────────────────────────────────
        # Erode dulu → hapus noise kecil
        # Dilate → gabungkan area yang terpisah tipis
        cleaned = cv2.erode(fg_mask,  self._kernel_erode,  iterations=1)
        cleaned = cv2.dilate(cleaned, self._kernel_dilate, iterations=3)

        # ── 3. Find Contours ──────────────────────────────────────────────────
        contours, _ = cv2.findContours(
            cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        if not contours:
            self._stable_counter = 0
            return TrackedObject(found=False)

        # ── 4. Filter & Pilih Kontur Terbesar ─────────────────────────────────
        valid = [
            c for c in contours
            if TRACKER_MIN_AREA <= cv2.contourArea(c) <= TRACKER_MAX_AREA
        ]

        if not valid:
            self._stable_counter = 0
            return TrackedObject(found=False)

        largest = max(valid, key=cv2.contourArea)
        area    = int(cv2.contourArea(largest))
        x, y, w, h = cv2.boundingRect(largest)

        # ── 5. Padding & Clamp ke batas frame ────────────────────────────────
        p  = TRACKER_BOX_PADDING
        px = max(0, x - p)
        py = max(0, y - p)
        pw = min(FRAME_WIDTH,  x + w + p) - px
        ph = min(FRAME_HEIGHT, y + h + p) - py

        center = (x + w // 2, y + h // 2)

        # ── 6. Stability Counter ──────────────────────────────────────────────
        # Jika bounding box tidak berpindah jauh → objek dianggap stabil
        if self._last_bbox and _boxes_overlap(self._last_bbox, (x, y, w, h), threshold=0.4):
            self._stable_counter = min(self._stable_counter + 1, TRACKER_STABLE_FRAMES + 10)
        else:
            self._stable_counter = 1   # Reset tapi tidak ke 0, agar tidak terlalu sensitif

        self._last_bbox = (x, y, w, h)

        is_stable = self._stable_counter >= TRACKER_STABLE_FRAMES

        return TrackedObject(
            found       = True,
            bbox        = (x, y, w, h),
            bbox_padded = (px, py, pw, ph),
            center      = center,
            area        = area,
            stable_frames=self._stable_counter,
            is_stable   = is_stable,
        )

    def reset_background(self) -> None:
        """Reset model background (gunakan jika background berubah drastis)."""
        self._bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=300, varThreshold=40, detectShadows=False
        )
        self._stable_counter = 0
        self._last_bbox = None


# ─────────────────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────────────────

def _boxes_overlap(
    box1: tuple, box2: tuple, threshold: float = 0.4
) -> bool:
    """
    Cek apakah dua bounding box cukup tumpang tindih (IoU-like check).
    Digunakan untuk menentukan apakah objek masih di posisi yang sama.
    """
    x1, y1, w1, h1 = box1
    x2, y2, w2, h2 = box2

    # Hitung area irisan
    ix = max(0, min(x1 + w1, x2 + w2) - max(x1, x2))
    iy = max(0, min(y1 + h1, y2 + h2) - max(y1, y2))
    intersection = ix * iy

    # Hitung area gabungan
    union = w1 * h1 + w2 * h2 - intersection

    if union == 0:
        return False

    iou = intersection / union
    return iou >= threshold


def crop_object(frame: np.ndarray, tracked: TrackedObject) -> np.ndarray | None:
    """
    Crop frame sesuai bounding box objek yang terdeteksi.
    Mengirim crop (bukan full frame) ke Gemini → lebih akurat & hemat token.

    Args:
        frame:   Frame penuh dari kamera.
        tracked: Hasil TrackedObject dari ObjectTracker.update().

    Returns:
        np.ndarray: Crop objek, atau None jika tidak ada objek.
    """
    if not tracked.found or tracked.bbox_padded is None:
        return None

    x, y, w, h = tracked.bbox_padded
    crop = frame[y:y+h, x:x+w]

    # Pastikan crop tidak kosong (edge case: bbox tepat di pinggir frame)
    if crop.size == 0:
        return frame  # fallback ke full frame

    return crop
