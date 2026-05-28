"""
Seeder script - Run once to create the default Admin account.
Usage: python seed_admin.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models
from app.auth import get_password_hash

def seed_admin():
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == "admin@dlhk.go.id").first()
        if existing:
            print("[OK] Akun Admin sudah ada, tidak perlu dibuat ulang.")
            return

        admin = models.User(
            name="Admin DLHK",
            email="admin@dlhk.go.id",
            password=get_password_hash("admin123"),
            role="admin",
            points=0
        )
        db.add(admin)
        db.commit()
        print("[OK] Akun Admin berhasil dibuat!")
        print("   Email   : admin@dlhk.go.id")
        print("   Password: admin123")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
