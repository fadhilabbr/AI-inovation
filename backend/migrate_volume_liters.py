"""
Migrasi: Tambah kolom volume_liters ke tabel sensor_logs
Jalankan sekali dengan: python migrate_volume_liters.py
"""
from app.database import engine
from sqlalchemy import text

print("Menjalankan migrasi: tambah kolom volume_liters ke sensor_logs...")

with engine.connect() as conn:
    # Cek apakah kolom sudah ada
    result = conn.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sensor_logs' AND column_name = 'volume_liters'
    """))
    exists = result.fetchone()

    if exists:
        print("OK: Kolom 'volume_liters' sudah ada, tidak perlu migrasi.")
    else:
        conn.execute(text("""
            ALTER TABLE sensor_logs 
            ADD COLUMN volume_liters FLOAT DEFAULT 0.0
        """))
        conn.commit()
        print("OK: Kolom 'volume_liters' berhasil ditambahkan ke tabel sensor_logs.")

print("Migrasi selesai.")
