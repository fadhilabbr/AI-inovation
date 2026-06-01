"""
Migration script to add refresh_token column to users table
Run this after pulling the updated code
"""
import os
import sys
from sqlalchemy import text
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:123@localhost:5432/AI-Inovation"

def migrate():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as connection:
        # Add refresh_token column if it doesn't exist
        try:
            connection.execute(text("""
                ALTER TABLE users ADD COLUMN refresh_token VARCHAR NULL;
            """))
            connection.commit()
            print("✅ Successfully added refresh_token column to users table")
        except Exception as e:
            print(f"ℹ️  Column might already exist: {e}")
            connection.rollback()

if __name__ == "__main__":
    print("🔄 Running migration...")
    migrate()
    print("✅ Migration completed!")
