"""
Script to reset the admin password with a proper bcrypt hash.
Run: python reset_admin_password.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models
from app.auth import get_password_hash

def reset_admin():
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.email == "admin@dlhk.go.id").first()
        if not admin:
            print("[ERROR] Akun admin tidak ditemukan!")
            return

        admin.password = get_password_hash("admin123")
        admin.role = "admin"
        db.commit()
        print("[OK] Password admin berhasil di-reset!")
        print("   Email   : admin@dlhk.go.id")
        print("   Password: admin123")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
