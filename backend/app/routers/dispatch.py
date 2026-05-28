from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter(prefix="/api/v1/dispatch", tags=["Fleet Dispatch"])

@router.post("/optimize-route")
def optimize_route(db: Session = Depends(get_db)):
    # Fetch all full bins to dynamically plan the route
    full_bins = db.query(models.SmartBin).filter(models.SmartBin.status == "full").all()
    
    route_plan = []
    for idx, db_bin in enumerate(full_bins):
        route_plan.append({
            "order": idx + 1,
            "bin_id": db_bin.bin_id,
            "location_name": db_bin.location_name,
            "action": "pickup",
            "priority": "high" if db_bin.capacity_percent >= 90 else "medium"
        })
        
    # If no bins are full, check for active bins above 50% capacity
    if not route_plan:
        active_bins = db.query(models.SmartBin).filter(models.SmartBin.capacity_percent > 50).order_by(models.SmartBin.capacity_percent.desc()).all()
        for idx, db_bin in enumerate(active_bins):
            route_plan.append({
                "order": idx + 1,
                "bin_id": db_bin.bin_id,
                "location_name": db_bin.location_name,
                "action": "pickup",
                "priority": "low"
            })
            
    return {
        "status": "success",
        "route_plan": route_plan
    }
