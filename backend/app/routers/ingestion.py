from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.sensor import SensorPayload, IngestionResponse
from datetime import datetime

router = APIRouter(prefix="/api/v1/ingest", tags=["IoT Ingestion"])

@router.post("/", response_model=IngestionResponse)
def ingest_sensor_data(payload: SensorPayload, db: Session = Depends(get_db)):
    # 1. Create a sensor log entry
    sensor_log = models.SensorLog(
        bin_id=payload.bin_id,
        timestamp=payload.timestamp,
        gps_lat=payload.gps_lat,
        gps_long=payload.gps_long,
        trash_type=payload.trash_type,
        weight_kg=payload.weight_kg,
        volume_percent=payload.volume_percent
    )
    db.add(sensor_log)
    
    # 2. Update the SmartBin state
    bin_item = db.query(models.SmartBin).filter(models.SmartBin.bin_id == payload.bin_id).first()
    if not bin_item:
        # Create a new bin automatically if it doesn't exist
        bin_item = models.SmartBin(
            bin_id=payload.bin_id,
            location_name=f"Ingested Area ({payload.bin_id})",
            gps_lat=payload.gps_lat,
            gps_long=payload.gps_long,
            status="active",
            capacity_percent=payload.volume_percent,
            last_updated=datetime.utcnow().isoformat()
        )
        db.add(bin_item)
    else:
        # Update existing bin
        bin_item.gps_lat = payload.gps_lat
        bin_item.gps_long = payload.gps_long
        bin_item.capacity_percent = payload.volume_percent
        bin_item.last_updated = datetime.utcnow().isoformat()
        
    # Automatically set status based on capacity
    if bin_item.capacity_percent >= 85:
        bin_item.status = "full"
    else:
        bin_item.status = "active"
        
    db.commit()
    
    return IngestionResponse(
        status="success",
        message=f"Data for bin {payload.bin_id} received and processed successfully",
        received_at=datetime.utcnow()
    )
