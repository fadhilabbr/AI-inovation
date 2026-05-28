from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.bin import SmartBinResponse, SmartBinCreate, SmartBinUpdate
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api/v1/bins", tags=["SmartBins"])

@router.get("", response_model=List[SmartBinResponse])
def list_bins(db: Session = Depends(get_db)):
    return db.query(models.SmartBin).all()

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
        last_updated=datetime.utcnow().isoformat()
    )
    db.add(new_bin)
    db.commit()
    db.refresh(new_bin)
    return new_bin

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
