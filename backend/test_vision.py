"""
test_vision.py
Script untuk menguji endpoint /api/vision/classify
Mengirim gambar contoh ke backend dan menampilkan respons AI (Gemini)
"""
import requests
import sys
import os

# ─────────────────────────────────────────────
# KONFIGURASI — sesuaikan jika perlu
# ─────────────────────────────────────────────
BASE_URL = "http://10.46.10.241:8000"
BIN_ID   = "BIN-001"   # ganti dengan bin_id yang ada di database Anda

# Gambar uji — bisa ganti ke path file gambar lokal Anda
LOCAL_IMAGE_PATH = "C:\Download\images.jpg"  # contoh: r"C:\Users\USER DK\Pictures\sampah.jpg"
ESP32_CAM_URL = "http://10.46.10.224/" # Ganti dengan IP/URL ESP32-CAM Anda (biasanya /capture atau /jpg)
SAMPLE_IMAGE_URL = "http://10.46.10.224"

# ─────────────────────────────────────────────

def get_image_bytes():
    """Ambil bytes gambar: dari file lokal, ESP32-CAM, atau download dari internet."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    if LOCAL_IMAGE_PATH and os.path.exists(LOCAL_IMAGE_PATH):
        print(f"📂 Menggunakan gambar lokal: {LOCAL_IMAGE_PATH}")
        with open(LOCAL_IMAGE_PATH, "rb") as f:
            return f.read(), "image/jpeg", os.path.basename(LOCAL_IMAGE_PATH)
            
    # Tawarkan opsi interaktif jika tidak ada file lokal yang diset
    print("\n--- PILIHAN SUMBER GAMBAR ---")
    print("1. Gunakan URL Gambar Internet (Default)")
    print("2. Ambil Gambar dari ESP32-CAM")
    try:
        pilihan = input("Pilih sumber gambar (1/2) [Default 1]: ").strip()
    except (KeyboardInterrupt, EOFError):
        pilihan = "1"

    if pilihan == "2":
        try:
            cam_url = input(f"Masukkan URL/IP ESP32-CAM [Default {ESP32_CAM_URL}]: ").strip()
        except (KeyboardInterrupt, EOFError):
            cam_url = ""
        if not cam_url:
            cam_url = ESP32_CAM_URL
        if not cam_url.startswith("http://") and not cam_url.startswith("https://"):
            cam_url = "http://" + cam_url
            
        print(f"📷 Mengambil gambar dari ESP32-CAM di: {cam_url} ...")
        resp = requests.get(cam_url, headers=headers, timeout=15)
        resp.raise_for_status()
        print(f"   ✅ Gambar berhasil diambil dari ESP32-CAM ({len(resp.content)} bytes)")
        return resp.content, "image/jpeg", "esp32_cam_capture.jpg"
    else:
        print(f"🌐 Mengunduh gambar dari internet: {SAMPLE_IMAGE_URL} ...")
        resp = requests.get(SAMPLE_IMAGE_URL, headers=headers, timeout=15)
        resp.raise_for_status()
        print(f"   ✅ Gambar berhasil diunduh ({len(resp.content)} bytes)")
        return resp.content, "image/jpeg", "test_bottle.jpg"


def main():
    print("=" * 55)
    print("  🧪 TEST ENDPOINT KAMERA + GEMINI AI")
    print("=" * 55)
    print(f"  Server  : {BASE_URL}")
    print(f"  Bin ID  : {BIN_ID}")
    print("-" * 55)

    # 1. Pastikan backend berjalan
    print("\n[1/3] Memeriksa status backend...")
    try:
        r = requests.get(f"{BASE_URL}/", timeout=5)
        if r.status_code == 200:
            print("  ✅ Backend berjalan dengan baik!")
        else:
            print(f"  ⚠️  Backend merespons dengan status: {r.status_code}")
    except requests.exceptions.ConnectionError:
        print("  ❌ GAGAL: Tidak dapat terhubung ke backend!")
        print("     Pastikan 'python -m uvicorn main:app --host 0.0.0.0 --port 8000' sudah berjalan.")
        sys.exit(1)

    # 2. Ambil gambar
    print("\n[2/3] Menyiapkan gambar uji...")
    try:
        image_bytes, content_type, filename = get_image_bytes()
    except Exception as e:
        print(f"  ❌ GAGAL mengambil gambar: {e}")
        sys.exit(1)

    # 3. Kirim ke endpoint vision
    print(f"\n[3/3] Mengirim gambar ke endpoint AI...")
    print(f"  URL: POST {BASE_URL}/api/vision/classify?bin_id={BIN_ID}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/vision/classify",
            params={"bin_id": BIN_ID},
            files={"file": (filename, image_bytes, content_type)},
            timeout=30  # Gemini butuh waktu untuk memproses
        )

        print("\n" + "=" * 55)
        print(f"  📡 Status HTTP  : {response.status_code}")
        print("-" * 55)

        if response.status_code == 200:
            data = response.json()
            classification = data.get("classification", {})
            log_id = data.get("log_id", "N/A")

            print(f"  ✅ STATUS        : BERHASIL!")
            print(f"  🤖 JENIS SAMPAH  : {classification.get('trash_type', '?')}")
            print(f"  ⚖️  BERAT EST.    : {classification.get('weight_kg', '?')} kg")
            print(f"  📦 VOLUME EST.   : {classification.get('volume_percent', '?')}%")
            print(f"  🗄️  LOG ID        : {log_id}")
            print("=" * 55)
            print("\n✅ AI BERJALAN SEMPURNA! Gemini berhasil mendeteksi sampah.\n")

        else:
            print(f"  ❌ STATUS        : GAGAL")
            try:
                err = response.json()
                print(f"  Detail error   : {err.get('detail', response.text)}")
            except Exception:
                print(f"  Raw response   : {response.text[:300]}")
            print("=" * 55)

            if "not found" in response.text.lower() or "404" in response.text:
                print("\n⚠️  KEMUNGKINAN MASALAH: Nama model Gemini tidak ditemukan.")
                print("   Solusi: Restart backend agar perubahan model name berlaku.")
            elif "api key" in response.text.lower():
                print("\n⚠️  KEMUNGKINAN MASALAH: GEMINI_API_KEY tidak valid atau sudah kedaluwarsa.")

    except requests.exceptions.Timeout:
        print("  ❌ GAGAL: Permintaan timeout (>30 detik).")
        print("     Gemini mungkin membutuhkan waktu lebih lama, atau koneksi internet lambat.")
    except Exception as e:
        print(f"  ❌ GAGAL: {e}")


if __name__ == "__main__":
    main()
