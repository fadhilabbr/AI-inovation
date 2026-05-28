"""
Script to hash all existing plain-text passwords in the database.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models
from app.auth import get_password_hash

def fix_passwords():
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        updated_count = 0
        for user in users:
            # Check if password is not already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
            if not (user.password.startswith("$2a$") or user.password.startswith("$2b$") or user.password.startswith("$2y$")):
                plain_password = user.password
                user.password = get_password_hash(plain_password)
                print(f"[FIX] Hashing password for {user.name} ({user.email}) -> Plain text was: '{plain_password}'")
                updated_count += 1
        
        if updated_count > 0:
            db.commit()
            print(f"[OK] Berhasil memperbarui {updated_count} password pengguna menjadi hash bcrypt.")
        else:
            print("[OK] Semua password pengguna sudah di-hash dengan benar.")
    finally:
        db.close()

if __name__ == "__main__":
    fix_passwords()
