from app.database import engine, SessionLocal
from app import models

print("Dropping all tables...")
models.Base.metadata.drop_all(bind=engine)

print("Creating all tables...")
models.Base.metadata.create_all(bind=engine)

print("Seeding initial data...")
db = SessionLocal()

try:
    # 1. Create a region
    region = models.Region(name="Kawasan Jakarta Pusat", description="Area sekitar Monas dan Thamrin")
    db.add(region)
    db.commit()
    db.refresh(region)
    
    # 2. Create users
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_pwd = pwd_context.hash("admin123")
    
    admin = models.User(name="Admin DLHK", email="admin@dlhk.go.id", password=hashed_pwd, role="admin", points=0)
    db.add(admin)
    
    warga = models.User(name="Budi Warga", email="warga@test.com", password=hashed_pwd, role="warga", points=150)
    db.add(warga)
    
    db.commit()
    
    # 3. Create a bin assigned to region
    bin1 = models.SmartBin(
        bin_id="BIN_001",
        location_name="Taman Suropati",
        gps_lat=-6.199,
        gps_long=106.832,
        status="active",
        capacity_percent=20,
        region_id=region.id
    )
    db.add(bin1)
    db.commit()
    
    print("Database reset and seeded successfully!")
except Exception as e:
    print(f"Error seeding database: {e}")
    db.rollback()
finally:
    db.close()
