from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.schemas.bin import SmartBinResponse, SmartBinCreate, SmartBinUpdate
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api/v1/bins", tags=["SmartBins"])

from typing import List, Optional

@router.get("", response_model=List[SmartBinResponse])
def list_bins(owner_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.SmartBin)
    if owner_id is not None:
        query = query.filter(models.SmartBin.owner_id == owner_id)
    return query.all()

@router.post("", response_model=SmartBinResponse, status_code=status.HTTP_201_CREATED)
def create_bin(bin_data: SmartBinCreate, db: Session = Depends(get_db)):
    db_bin = db.query(models.SmartBin).filter(models.SmartBin.bin_id == bin_data.bin_id).first()
    if db_bin:
        raise HTTPException(status_code=400, detail="Bin ID already exists")
    
    new_bin = models.SmartBin(
        bin_id=bin_data.bin_id,
        location_name=bin_data.location_name,
        gps_lat=bin_data.gps_lat,
        gps_long=bin_data.gps_long,
        status="active",
        capacity_percent=0,
        total_volume_liters=bin_data.total_volume_liters,
        filled_volume_liters=0.0,
        region_id=bin_data.region_id,
        owner_id=bin_data.owner_id,
        last_updated=datetime.utcnow().isoformat()
    )
    db.add(new_bin)
    db.commit()
    db.refresh(new_bin)
    return new_bin

@router.get("/{bin_id}/summary")
def get_bin_summary(bin_id: str, db: Session = Depends(get_db)):
    """Get material composition breakdown for a specific bin."""
    material_stats = db.query(
        models.SensorLog.trash_type,
        func.sum(models.SensorLog.weight_kg).label("total_weight"),
        func.count(models.SensorLog.id).label("total_count")
    ).filter(models.SensorLog.bin_id == bin_id).group_by(models.SensorLog.trash_type).all()

    total_weight = sum([s.total_weight for s in material_stats if s.total_weight]) or 0.0
    total_items = sum([s.total_count for s in material_stats]) or 0

    materials = []
    for stat in material_stats:
        if not stat.trash_type or stat.trash_type == "None":
            continue
        weight = stat.total_weight or 0.0
        materials.append({
            "type": stat.trash_type,
            "weight_kg": round(weight, 2),
            "count": stat.total_count,
            "percentage": round((weight / total_weight) * 100) if total_weight > 0 else 0
        })

    return {
        "bin_id": bin_id,
        "total_weight_kg": round(total_weight, 2),
        "total_items": total_items,
        "materials": sorted(materials, key=lambda x: x["weight_kg"], reverse=True)
    }

@router.get("/{bin_id}", response_model=SmartBinResponse)
def get_bin(bin_id: str, db: Session = Depends(get_db)):
    bin_item = db.query(models.SmartBin).filter(models.SmartBin.bin_id == bin_id).first()
    if not bin_item:
        raise HTTPException(status_code=404, detail="Bin not found")
    return bin_item

@router.put("/{bin_id}", response_model=SmartBinResponse)
def update_bin(bin_id: str, bin_data: SmartBinUpdate, db: Session = Depends(get_db)):
    db_bin = db.query(models.SmartBin).filter(models.SmartBin.bin_id == bin_id).first()
    if not db_bin:
        raise HTTPException(status_code=404, detail="Bin not found")
    
    update_data = bin_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_bin, key, value)
    
    db_bin.last_updated = datetime.utcnow().isoformat()
    db.commit()
    db.refresh(db_bin)
    return db_bin

@router.delete("/{bin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bin(bin_id: str, db: Session = Depends(get_db)):
    db_bin = db.query(models.SmartBin).filter(models.SmartBin.bin_id == bin_id).first()
    if not db_bin:
        raise HTTPException(status_code=404, detail="Bin not found")
    
    db.delete(db_bin)
    db.commit()
    return None
