"""
Migrasi: Tambah kolom owner_id ke tabel smart_bins
Jalankan sekali dengan: python migrate_owner_id.py
"""
from app.database import engine
from sqlalchemy import text

print("Menjalankan migrasi: tambah kolom owner_id ke smart_bins...")

with engine.connect() as conn:
    # Cek apakah kolom sudah ada
    result = conn.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'smart_bins' AND column_name = 'owner_id'
    """))
    exists = result.fetchone()

    if exists:
        print("OK: Kolom 'owner_id' sudah ada, tidak perlu migrasi.")
    else:
        conn.execute(text("""
            ALTER TABLE smart_bins 
            ADD COLUMN owner_id INTEGER REFERENCES users(id)
        """))
        conn.commit()
        print("OK: Kolom 'owner_id' berhasil ditambahkan ke tabel smart_bins.")

print("Migrasi selesai.")
