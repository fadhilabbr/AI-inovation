from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    points = Column(Integer, default=0)
    role = Column(String, default="warga") # "admin" or "warga"

class SmartBin(Base):
    __tablename__ = "smart_bins"

    bin_id = Column(String, primary_key=True, index=True)
    location_name = Column(String, nullable=False)
    gps_lat = Column(Float, nullable=False)
    gps_long = Column(Float, nullable=False)
    status = Column(String, default="active") # "active", "full", "under_maintenance"
    capacity_percent = Column(Integer, default=0)
    last_updated = Column(String, nullable=True)

class SensorLog(Base):
    __tablename__ = "sensor_logs"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    gps_lat = Column(Float, nullable=False)
    gps_long = Column(Float, nullable=False)
    trash_type = Column(String, nullable=False)
    weight_kg = Column(Float, nullable=False)
    volume_percent = Column(Integer, nullable=False)

class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    points_required = Column(Integer, nullable=False)
