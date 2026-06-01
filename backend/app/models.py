from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    
    # Relationship with bins
    bins = relationship("SmartBin", back_populates="region")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    points = Column(Integer, default=0)
    role = Column(String, default="warga") # "admin" or "warga"
    refresh_token = Column(String, nullable=True)  # Stored refresh token for validation
    
    # Relationship to bins
    bins = relationship("SmartBin", back_populates="owner")

class SmartBin(Base):
    __tablename__ = "smart_bins"

    bin_id = Column(String, primary_key=True, index=True)
    location_name = Column(String, nullable=False)
    gps_lat = Column(Float, nullable=False)
    gps_long = Column(Float, nullable=False)
    status = Column(String, default="active") # "active", "full", "under_maintenance"
    capacity_percent = Column(Integer, default=0)
    total_volume_liters = Column(Float, default=100.0)
    filled_volume_liters = Column(Float, default=0.0)
    last_updated = Column(String, nullable=True)
    
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationship back to region
    region = relationship("Region", back_populates="bins")
    
    # Relationship to user (owner)
    owner = relationship("User", back_populates="bins")
    
    # Relationship to bin contents
    contents = relationship("BinContent", back_populates="bin", cascade="all, delete-orphan")

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
    volume_liters = Column(Float, default=0.0)

class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    points_required = Column(Integer, nullable=False)

class BinContent(Base):
    __tablename__ = "bin_contents"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(String, ForeignKey("smart_bins.bin_id"), index=True, nullable=False)
    trash_type = Column(String, index=True, nullable=False)
    total_weight_kg = Column(Float, default=0.0)
    item_count = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    bin = relationship("SmartBin", back_populates="contents")
