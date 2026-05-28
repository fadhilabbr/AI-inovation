from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class SensorPayload(BaseModel):
    bin_id: str = Field(..., example="BIN-JKT-001")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    gps_lat: float = Field(..., example=-6.2088)
    gps_long: float = Field(..., example=106.8456)
    trash_type: str = Field(..., example="plastic")
    weight_kg: float = Field(..., example=0.5)
    volume_percent: int = Field(..., example=45, ge=0, le=100)

class IngestionResponse(BaseModel):
    status: str
    message: str
    received_at: datetime
