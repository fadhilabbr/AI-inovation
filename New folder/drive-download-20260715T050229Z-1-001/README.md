# Deteksi Sampah Real-Time
**OpenCV + Google Gemini 2.0 Flash**

Program deteksi objek sampah real-time yang mengklasifikasikan sampah dari feed kamera
ke dalam 5 kategori: **Plastik**, **Kertas**, **Organik**, **Logam**, atau **Lainnya**.

---

## Arsitektur Program

```
trash_detector/
├── main.py          → Entry point & loop utama (threading)
├── config.py        → Semua konstanta konfigurasi
├── camera.py        → Abstraksi kamera OpenCV
├── classifier.py    → Integrasi Gemini API
├── display.py       → Overlay OpenCV & output console
└── requirements.txt → Dependensi Python
```

### Diagram Alur

```
┌─────────────────────────────────────────────────────────┐
│  Main Thread                                            │
│   OpenCV loop → baca frame → render overlay → tampilkan │
│                     │                                   │
│              (setiap N detik)                           │
│                     ▼                                   │
│  Worker Thread (background)                             │
│   frame → PIL Image → Gemini API → kategori            │
│                     ▼                                   │
│              Shared State (thread-safe)                 │
│               category / is_busy                        │
└─────────────────────────────────────────────────────────┘
```

---

## Setup & Instalasi

### 1. Clone / Download
```bash
git clone <repo> && cd trash_detector
```

### 2. Buat Virtual Environment
```bash
python -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows
```

### 3. Install Dependensi
```bash
pip install -r requirements.txt
```

### 4. Set API Key
```bash
# Linux/macOS
export GEMINI_API_KEY="your_gemini_api_key_here"

# Windows (Command Prompt)
set GEMINI_API_KEY=your_gemini_api_key_here

# Windows (PowerShell)
$env:GEMINI_API_KEY="your_gemini_api_key_here"
```

> Dapatkan API key gratis di: https://aistudio.google.com/app/apikey

### 5. Jalankan Program
```bash
python main.py
```

---

## Kontrol Keyboard

| Tombol | Fungsi                                  |
|--------|-----------------------------------------|
| `Q`    | Keluar dari program                     |
| `S`    | Analisis frame saat ini secara manual   |

---

## Konfigurasi

Edit `config.py` untuk menyesuaikan perilaku program:

| Parameter                  | Default | Deskripsi                                    |
|----------------------------|---------|----------------------------------------------|
| `CAMERA_INDEX`             | `0`     | Index kamera (0 = webcam utama)              |
| `SAMPLING_INTERVAL_SECONDS`| `2.5`   | Interval antar API call (detik)              |
| `FRAME_WIDTH/HEIGHT`       | 640×480 | Resolusi kamera                              |
| `GEMINI_MODEL`             | `gemini-2.0-flash` | Model Gemini yang digunakan      |

---

## Kategori Deteksi

| Kategori  | Contoh Objek                               | Warna Overlay |
|-----------|--------------------------------------------|---------------|
| Plastik   | Botol plastik, kantong, styrofoam          | 🟠 Oranye     |
| Kertas    | Kardus, koran, tissue, cup kertas          | 🔵 Cyan       |
| Organik   | Sisa makanan, daun, kulit buah             | 🟢 Hijau      |
| Logam     | Kaleng, sendok, aluminium foil             | ⚪ Abu-abu    |
| Lainnya   | Kaca, elektronik, tidak terdeteksi         | 🔴 Merah      |

---

## Troubleshooting

**Kamera tidak terbuka:**
```bash
# Coba ganti CAMERA_INDEX di config.py ke 1 atau 2
# Pastikan tidak ada aplikasi lain yang menggunakan kamera
```

**API Error / Quota Exceeded:**
```bash
# Naikkan SAMPLING_INTERVAL_SECONDS di config.py (misalnya ke 5.0)
# Cek kuota API di: https://aistudio.google.com
```

**Hasil tidak akurat:**
- Pastikan pencahayaan cukup
- Arahkan objek ke kotak deteksi di tengah layar
- Tekan `S` untuk analisis ulang manual
