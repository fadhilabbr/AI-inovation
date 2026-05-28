from pydantic import BaseModel
from typing import Optional

class SmartBinBase(BaseModel):
    location_name: str
    gps_lat: float
    gps_long: float

class SmartBinCreate(SmartBinBase):
    pass

class SmartBinResponse(SmartBinBase):
    bin_id: str
    status: str
    last_updated: Optional[str] = None
    capacity_percent: int
