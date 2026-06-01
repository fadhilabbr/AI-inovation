from pydantic import BaseModel
from typing import Optional, List

class RegionBase(BaseModel):
    name: str
    description: Optional[str] = None

class RegionCreate(RegionBase):
    id: int

class RegionResponse(RegionBase):
    id: int

    class Config:
        from_attributes = True
