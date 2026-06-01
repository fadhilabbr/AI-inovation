from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.sensor import SensorPayload, IngestionResponse
from datetime import datetime

router = APIRouter(prefix="/api/v1/ingest", tags=["IoT Ingestion"])

@router.post("/", response_model=IngestionResponse)
def ingest_sensor_data(payload: SensorPayload, db: Session = Depends(get_db)):
    # Reject non-trash detections early — do NOT write to DB
    NON_TRASH_VALUES = {"none", "null", "", "unknown", "bukan sampah", "not trash"}
    trash_type_clean = (payload.trash_type or "").strip().lower()
    is_valid_trash = trash_type_clean and trash_type_clean not in NON_TRASH_VALUES

    if not is_valid_trash:
        return IngestionResponse(
            status="skipped",
            message=f"Deteksi '{payload.trash_type}' bukan sampah — data tidak disimpan.",
            received_at=datetime.utcnow()
        )

    # 2. Fetch or create bin to know total_volume_liters for percentage calc
    bin_item = db.query(models.SmartBin).filter(models.SmartBin.bin_id == payload.bin_id).first()

    if not bin_item:
        # Auto-create bin with default 100L capacity
        total_vol = 100.0
        filled_vol = min(total_vol, payload.volume_liters)
        capacity_pct = int(round((filled_vol / total_vol) * 100.0))
        bin_item = models.SmartBin(
            bin_id=payload.bin_id,
            location_name=f"Ingested Area ({payload.bin_id})",
            gps_lat=payload.gps_lat,
            gps_long=payload.gps_long,
            status="active",
            capacity_percent=capacity_pct,
            total_volume_liters=total_vol,
            filled_volume_liters=filled_vol,
            last_updated=datetime.utcnow().isoformat()
        )
        db.add(bin_item)
    else:
        # Update existing bin — accumulate volume in liters
        bin_item.gps_lat = payload.gps_lat
        bin_item.gps_long = payload.gps_long

        total_vol = bin_item.total_volume_liters or 100.0
        bin_item.filled_volume_liters = min(
            total_vol,
            (bin_item.filled_volume_liters or 0.0) + payload.volume_liters
        )
        bin_item.capacity_percent = int(round((bin_item.filled_volume_liters / total_vol) * 100.0))
        bin_item.last_updated = datetime.utcnow().isoformat()

    # Compute volume_percent from liters for the sensor log record
    total_vol_for_log = bin_item.total_volume_liters or 100.0
    volume_pct_for_log = int(round(min(100.0, (payload.volume_liters / total_vol_for_log) * 100.0)))

    # Automatically set status based on capacity
    if bin_item.capacity_percent >= 85:
        bin_item.status = "full"
    else:
        bin_item.status = "active"

    # 1. Create sensor log entry (only for valid trash)
    sensor_log = models.SensorLog(
        bin_id=payload.bin_id,
        timestamp=payload.timestamp,
        gps_lat=payload.gps_lat,
        gps_long=payload.gps_long,
        trash_type=payload.trash_type,
        weight_kg=payload.weight_kg,
        volume_percent=volume_pct_for_log,
        volume_liters=payload.volume_liters
    )
    db.add(sensor_log)

    # 3. Update BinContent
    bin_content = db.query(models.BinContent).filter(
        models.BinContent.bin_id == payload.bin_id,
        models.BinContent.trash_type == payload.trash_type
    ).first()

    if not bin_content:
        bin_content = models.BinContent(
            bin_id=payload.bin_id,
            trash_type=payload.trash_type,
            total_weight_kg=payload.weight_kg,
            item_count=1,
            last_updated=datetime.utcnow()
        )
        db.add(bin_content)
    else:
        bin_content.total_weight_kg += payload.weight_kg
        bin_content.item_count += 1
        bin_content.last_updated = datetime.utcnow()

    db.commit()

    remaining = round((bin_item.total_volume_liters or 100.0) - bin_item.filled_volume_liters, 2)
    return IngestionResponse(
        status="success",
        message=(
            f"Bin {payload.bin_id}: +{payload.volume_liters}L masuk | "
            f"Terisi {bin_item.filled_volume_liters:.1f}L / {bin_item.total_volume_liters:.0f}L "
            f"({bin_item.capacity_percent}%) | Sisa {remaining}L"
        ),
        received_at=datetime.utcnow()
    )
