from pydantic import BaseModel
from typing import Optional

class SmartBinBase(BaseModel):
    bin_id: str
    location_name: str
    gps_lat: float
    gps_long: float
    region_id: Optional[int] = None
    owner_id: Optional[int] = None
    total_volume_liters: float = 100.0
    filled_volume_liters: Optional[float] = 0.0

class SmartBinCreate(SmartBinBase):
    pass

class SmartBinUpdate(BaseModel):
    location_name: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_long: Optional[float] = None
    status: Optional[str] = None
    capacity_percent: Optional[int] = None
    total_volume_liters: Optional[float] = None
    filled_volume_liters: Optional[float] = None
    region_id: Optional[int] = None

class SmartBinResponse(SmartBinBase):
    status: Optional[str] = "active"
    capacity_percent: Optional[int] = 0
    last_updated: Optional[str] = None

    class Config:
        from_attributes = True
