from app.database import SessionLocal, engine
from app import models
from datetime import datetime
from app.auth import get_password_hash

print("Creating database tables...")
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("Checking existing records...")

# Add initial bins if empty
if db.query(models.SmartBin).count() == 0:
    bins = [
        models.SmartBin(
            bin_id="BIN-JKT-001",
            location_name="Taman Menteng",
            gps_lat=-6.1961,
            gps_long=106.8296,
            status="active",
            capacity_percent=45,
            last_updated=datetime.utcnow().isoformat()
        ),
        models.SmartBin(
            bin_id="BIN-JKT-002",
            location_name="Stasiun Sudirman",
            gps_lat=-6.2023,
            gps_long=106.8227,
            status="full",
            capacity_percent=95,
            last_updated=datetime.utcnow().isoformat()
        ),
        models.SmartBin(
            bin_id="BIN-JKT-003",
            location_name="Grand Indonesia",
            gps_lat=-6.1953,
            gps_long=106.8202,
            status="active",
            capacity_percent=60,
            last_updated=datetime.utcnow().isoformat()
        )
    ]
    db.add_all(bins)
    print("Seeded initial bins.")
else:
    print("Bins already exist, skipping seeding.")

# Add initial users if empty
if db.query(models.User).count() == 0:
    users = [
        models.User(
            name="Admin DLHK",
            email="admin@dlhk.go.id",
            password=get_password_hash("adminpassword"),
            points=0,
            role="admin"
        ),
        models.User(
            name="Budi Wisesa",
            email="budi@email.com",
            password=get_password_hash("userpassword"),
            points=150,
            role="warga"
        ),
        models.User(
            name="Siti Rahma",
            email="siti@email.com",
            password=get_password_hash("userpassword"),
            points=320,
            role="warga"
        )
    ]
    db.add_all(users)
    print("Seeded initial users.")
else:
    print("Users already exist, skipping seeding.")

# Add initial rewards if empty
if db.query(models.Reward).count() == 0:
    rewards = [
        models.Reward(name="Voucher Belanja Rp50.000", points_required=100),
        models.Reward(name="Tumbler Ramah Lingkungan", points_required=250),
        models.Reward(name="Kompos Organik 5Kg", points_required=150)
    ]
    db.add_all(rewards)
    print("Seeded initial rewards.")
else:
    print("Rewards already exist, skipping seeding.")

db.commit()
db.close()
print("Seeding complete successfully!")
