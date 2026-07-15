"""
camera.py — Abstraksi pengelolaan kamera menggunakan OpenCV.
Modul ini memisahkan semua logika kamera agar mudah diganti
(misalnya mengganti webcam dengan file video atau IP Camera).
"""

import cv2
import numpy as np
from config import CAMERA_INDEX, FRAME_WIDTH, FRAME_HEIGHT, FRAME_FPS


class CameraError(RuntimeError):
    """Exception khusus untuk kegagalan kamera."""
    pass


def init_camera() -> cv2.VideoCapture:
    """
    Inisialisasi dan konfigurasi webcam.

    Returns:
        cv2.VideoCapture: Objek kamera yang sudah dikonfigurasi.

    Raises:
        CameraError: Jika kamera tidak dapat dibuka.
    """
    cap = cv2.VideoCapture(CAMERA_INDEX)

    if not cap.isOpened():
        raise CameraError(
            f"Tidak dapat membuka kamera (index={CAMERA_INDEX}). "
            "Pastikan webcam terhubung dan tidak digunakan oleh aplikasi lain."
        )

    # Konfigurasi resolusi dan FPS
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)
    cap.set(cv2.CAP_PROP_FPS,          FRAME_FPS)

    return cap


def read_frame(cap: cv2.VideoCapture) -> np.ndarray:
    """
    Baca satu frame dari kamera.

    Args:
        cap: Objek VideoCapture yang sudah diinisialisasi.

    Returns:
        np.ndarray: Frame dalam format BGR (standar OpenCV).

    Raises:
        CameraError: Jika frame gagal dibaca.
    """
    ret, frame = cap.read()
    if not ret or frame is None:
        raise CameraError("Gagal membaca frame dari kamera.")
    return frame


def release_camera(cap: cv2.VideoCapture) -> None:
    """
    Lepaskan resource kamera dengan aman.

    Args:
        cap: Objek VideoCapture yang akan dilepaskan.
    """
    if cap and cap.isOpened():
        cap.release()
