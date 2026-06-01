from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
from google import genai
# pyrefly: ignore [missing-import]
from google.genai import types

router = APIRouter(prefix="/api/v1/diy", tags=["DIY Recommendations"])

class DIYRequest(BaseModel):
    items: str  # E.g., "3 botol plastik, 1 kardus besar, 2 sedotan"

@router.post("/recommend")
async def recommend_diy(request: DIYRequest):
    """
    Menghasilkan rekomendasi kerajinan DIY (Upcycling) berdasarkan bahan yang dimiliki.
    """
    # Inisialisasi client Gemini
    # Catatan: Sebaiknya gunakan os.environ.get("GEMINI_API_KEY") untuk keamanan di produksi
    client = genai.Client(
        api_key="GEMINI_API_KEY_DIY",
    )

    model = "gemini-3.5-flash"
    
    # Memasukkan input dari user (items) ke dalam prompt
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=f"Bahan yang saya miliki: {request.items}"),
            ],
        ),
    ]
    
    generate_content_config = types.GenerateContentConfig(
        system_instruction=[
            types.Part.from_text(text="""Kamu adalah EcoCrafter, seorang konsultan ahli upcycling (daur ulang kreatif) yang ramah dan jenius. Tugas utamanya adalah menganalisis daftar bahan bekas yang dimiliki pengguna, lalu memberikan rekomendasi produk kreatif apa saja yang bisa dibuat dari bahan tersebut dengan tampilan ala gamifikasi (crafting recipe).

Aturan dalam Merespons:
1. Analisis Bahan: Perhatikan baik-baik jenis dan jumlah bahan yang diinput oleh pengguna.
2. Berikan 2-3 Rekomendasi Produk:
   - Rekomendasi 1: Produk yang bisa langsung dibuat dengan jumlah bahan yang ada saat ini (Bahan Cukup).
   - Rekomendasi 2 atau 3: Produk keren yang bahannya mirip, tetapi masih kurang sedikit (Butuh Bahan Tambahan).
3. Aturan Gamifikasi (Crafting Checklist):
   Pada bagian "Bahan yang Diperlukan", kamu WAJIB menampilkannya dalam bentuk checklist perbandingan jumlah: [Jumlah yang Dimiliki Pengguna] / [Jumlah yang Dibutuhkan Resep].
   Contoh format:
   - Kertas: 2/2 (Artinya user punya 2, butuh 2)
   - Lampu LED: 0/1 (Artinya user punya 0, butuh 1)
4. Format Jawaban: Untuk setiap rekomendasi, kamu WAJIB menyusunnya dengan struktur yang kaku dan rapi seperti ini:

   ### 📦 [Nama Produk Daur Ulang]
   **Status:** [Pilih salah satu: "🟢 Bisa Langsung Dibuat" ATAU "🟡 Butuh Bahan Tambahan"]
   
   **✂️ Alat yang Diperlukan:**
   - (Sebutkan alat seperti gunting, lem, penggaris, dll)
   
   **🎨 Bahan & Crafting Checklist:**
   - [Nama Bahan 1]: [Jumlah Dimiliki]/[Jumlah Dibutuhkan]
   - [Nama Bahan 2]: [Jumlah Dimiliki]/[Jumlah Dibutuhkan]
   *Kekurangan:* (Sebutkan dengan jelas apa saja kekurangan bahannya secara spesifik jika statusnya "Butuh Bahan Tambahan", misal: "Kurang 1 buah Lampu LED lagi").

   **🌱 Langkah-langkah Pembuatan:**
   1. (Langkah 1...)
   2. (Langkah 2...)

Tone & Gaya Bahasa: Selalu gunakan bahasa Indonesia yang ramah, santun, menyemangati, dan gunakan beberapa emoji ramah lingkungan (🌱, ✂️, 📦, 🎨) di setiap bagian agar menarik dan interaktif bagi pengguna."""),
        ],
    )

    # Fungsi generator untuk streaming response text
    def generate():
        try:
            response_stream = client.models.generate_content_stream(
                model=model,
                contents=contents,
                config=generate_content_config,
            )
            for chunk in response_stream:
                if text := chunk.text:
                    yield text
        except Exception as e:
            # Jika terjadi error (misalnya quota habis / 429 Resource Exhausted)
            yield f"\n\n**[Error dari AI]**: Terjadi kesalahan saat memanggil API Gemini. Kemungkinan kuota API Key telah habis. Detail: {str(e)}"

    return StreamingResponse(generate(), media_type="text/plain")
