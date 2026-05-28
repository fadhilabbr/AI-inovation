from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_bins = db.query(models.SmartBin).count()
    active_bins = db.query(models.SmartBin).filter(models.SmartBin.status == "active").count()
    full_bins = db.query(models.SmartBin).filter(models.SmartBin.status == "full").count()
    
    # Total weight of trash collected
    total_weight = db.query(func.sum(models.SensorLog.weight_kg)).scalar() or 0.0
    
    # Calculate top materials
    material_counts = db.query(
        models.SensorLog.trash_type,
        func.count(models.SensorLog.id)
    ).group_by(models.SensorLog.trash_type).all()
    
    total_logs = sum([count for _, count in material_counts]) or 1
    
    top_materials = []
    for material, count in material_counts:
        top_materials.append({
            "type": material,
            "percentage": round((count / total_logs) * 100)
        })
        
    # Default placeholder materials if no logs yet
    if not top_materials:
        top_materials = [
            {"type": "plastic", "percentage": 40},
            {"type": "organic", "percentage": 35},
            {"type": "paper", "percentage": 20},
            {"type": "metal", "percentage": 5},
        ]
        
    return {
        "total_bins": total_bins,
        "active_bins": active_bins,
        "full_bins": full_bins,
        "total_trash_collected_kg": round(total_weight, 1),
        "top_materials": top_materials
    }
