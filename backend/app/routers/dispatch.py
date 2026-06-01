from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter(prefix="/api/v1/dispatch", tags=["Fleet Dispatch"])

@router.post("/optimize-route")
def optimize_route(db: Session = Depends(get_db)):
    # Group bins by region_id to prioritize regions with full bins
    regions = db.query(models.Region).all()
    route_plan = []
    order_idx = 1
    
    for region in regions:
        # Check if region has any full bins
        region_bins = db.query(models.SmartBin).filter(models.SmartBin.region_id == region.id).all()
        full_bins_in_region = [b for b in region_bins if b.status == "full"]
        
        # If at least 1 bin is full in this region, dispatch to ALL bins in the region
        if full_bins_in_region:
            for db_bin in region_bins:
                route_plan.append({
                    "order": order_idx,
                    "bin_id": db_bin.bin_id,
                    "location_name": db_bin.location_name,
                    "region_name": region.name,
                    "action": "pickup",
                    "priority": "high" if db_bin.status == "full" else "medium"
                })
                order_idx += 1
                
    # If no region has full bins, check for active bins above 50% capacity without region priority
    if not route_plan:
        active_bins = db.query(models.SmartBin).filter(models.SmartBin.capacity_percent > 50).order_by(models.SmartBin.capacity_percent.desc()).all()
        for db_bin in active_bins:
            region_name = db_bin.region.name if db_bin.region else "Unassigned Region"
            route_plan.append({
                "order": order_idx,
                "bin_id": db_bin.bin_id,
                "location_name": db_bin.location_name,
                "region_name": region_name,
                "action": "pickup",
                "priority": "low"
            })
            order_idx += 1
            
    return {
        "status": "success",
        "route_plan": route_plan
    }
