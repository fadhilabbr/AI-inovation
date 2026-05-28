from pydantic import BaseModel
from typing import Optional

class SmartBinBase(BaseModel):
    location_name: str
    gps_lat: float
    gps_long: float

class SmartBinCreate(SmartBinBase):
    bin_id: str

class SmartBinUpdate(BaseModel):
    location_name: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_long: Optional[float] = None
    status: Optional[str] = None
    capacity_percent: Optional[int] = None

class SmartBinResponse(SmartBinBase):
    bin_id: str
    status: str
    last_updated: Optional[str] = None
    capacity_percent: int

    class Config:
        from_attributes = True
