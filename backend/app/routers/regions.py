from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.region import RegionCreate, RegionResponse
from typing import List

router = APIRouter(prefix="/api/v1/regions", tags=["Regions"])

@router.get("/", response_model=List[RegionResponse])
def get_all_regions(db: Session = Depends(get_db)):
    return db.query(models.Region).all()

@router.post("/", response_model=RegionResponse, status_code=status.HTTP_201_CREATED)
def create_region(region_data: RegionCreate, db: Session = Depends(get_db)):
    # Check ID uniqueness
    db_region_id = db.query(models.Region).filter(models.Region.id == region_data.id).first()
    if db_region_id:
        raise HTTPException(status_code=400, detail="ID Region sudah digunakan")

    # Check Name uniqueness
    db_region_name = db.query(models.Region).filter(models.Region.name == region_data.name).first()
    if db_region_name:
        raise HTTPException(status_code=400, detail="Nama Region sudah digunakan")
    
    new_region = models.Region(
        id=region_data.id,
        name=region_data.name,
        description=region_data.description
    )
    db.add(new_region)
    db.commit()
    db.refresh(new_region)
    return new_region

@router.delete("/{region_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_region(region_id: int, db: Session = Depends(get_db)):
    db_region = db.query(models.Region).filter(models.Region.id == region_id).first()
    if not db_region:
        raise HTTPException(status_code=404, detail="Region not found")
    
    db.delete(db_region)
    db.commit()
    return None
