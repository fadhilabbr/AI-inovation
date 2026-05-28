import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:123@localhost:5432/AI-Inovation"

# Create Engine
engine = create_engine(DATABASE_URL)

# Create SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base
Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
