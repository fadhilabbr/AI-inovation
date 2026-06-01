from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & Dashboard"])

@router.post("/reset")
def reset_analytics_data(db: Session = Depends(get_db)):
    try:
        # Delete all sensor logs
        db.query(models.SensorLog).delete()
        
        # Delete all bin contents
        db.query(models.BinContent).delete()
        
        # Reset all bins capacity, filled volume, and status
        bins = db.query(models.SmartBin).all()
        for bin_item in bins:
            bin_item.capacity_percent = 0
            bin_item.filled_volume_liters = 0.0
            bin_item.status = "active"
            
        db.commit()
        return {"status": "success", "message": "Semua data isi tong telah di-reset."}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}

@router.get("/recent-logs")
def get_recent_logs(limit: int = 10, db: Session = Depends(get_db)):
    logs = db.query(models.SensorLog).order_by(models.SensorLog.timestamp.desc()).limit(limit).all()
    # Serialize logs
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "bin_id": log.bin_id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "gps_lat": log.gps_lat,
            "gps_long": log.gps_long,
            "trash_type": log.trash_type,
            "weight_kg": log.weight_kg,
            "volume_percent": log.volume_percent
        })
    return result


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

@router.get("/recyclable-recommendations")
def get_recyclable_recommendations(db: Session = Depends(get_db)):
    # Calculate the most frequent recyclable materials
    material_counts = db.query(
        models.SensorLog.trash_type,
        func.count(models.SensorLog.id)
    ).group_by(models.SensorLog.trash_type).all()
    
    recommendations_db = {
        "plastic": {
            "name": "Plastik",
            "items": ["Ecobrick", "Pot Tanaman", "Kerajinan Tangan", "Biji Plastik Daur Ulang"]
        },
        "paper": {
            "name": "Kertas",
            "items": ["Kertas Daur Ulang", "Kardus Kemasan", "Kompos (Kertas Buram)"]
        },
        "glass": {
            "name": "Kaca",
            "items": ["Vas Bunga", "Bahan Konstruksi (Campuran Aspal/Beton)", "Hiasan Dinding"]
        },
        "metal": {
            "name": "Logam/Kaleng",
            "items": ["Pot Tanaman", "Kerajinan Logam", "Dilebur untuk produk baru"]
        },
        "organic": {
            "name": "Organik",
            "items": ["Pupuk Kompos", "Eco-enzyme", "Pakan Ternak", "Biogas"]
        }
    }
    
    result = []
    for material, count in material_counts:
        mat_lower = material.lower()
        if mat_lower in recommendations_db:
            result.append({
                "material": recommendations_db[mat_lower]["name"],
                "count": count,
                "recommendations": recommendations_db[mat_lower]["items"]
            })
            
    # Default placeholder if empty
    if not result:
        result = [
            {
                "material": "Plastik",
                "count": 0,
                "recommendations": ["Ecobrick", "Pot Tanaman", "Kerajinan Tangan", "Biji Plastik Daur Ulang"]
            }
        ]
        
    return {
        "status": "success",
        "data": result
    }

@router.get("/composition-by-bin")
def get_composition_by_bin(db: Session = Depends(get_db)):
    # Group by bin_id and trash_type
    stats = db.query(
        models.SensorLog.bin_id,
        models.SensorLog.trash_type,
        func.sum(models.SensorLog.weight_kg).label("total_weight"),
        func.count(models.SensorLog.id).label("total_count")
    ).group_by(models.SensorLog.bin_id, models.SensorLog.trash_type).all()
    
    # Organize data
    result = {}
    for stat in stats:
        if not stat.bin_id: continue
        if stat.bin_id not in result:
            result[stat.bin_id] = {"total_weight": 0.0, "total_items": 0, "materials": []}
            
        weight = stat.total_weight or 0.0
        result[stat.bin_id]["total_weight"] += weight
        result[stat.bin_id]["total_items"] += stat.total_count
        
        if stat.trash_type and stat.trash_type != "None":
            result[stat.bin_id]["materials"].append({
                "type": stat.trash_type,
                "weight_kg": round(weight, 2),
                "count": stat.total_count
            })
            
    # Calculate percentages
    formatted_result = []
    for bin_id, data in result.items():
        for mat in data["materials"]:
            mat["percentage"] = round((mat["weight_kg"] / data["total_weight"]) * 100) if data["total_weight"] > 0 else 0
        formatted_result.append({
            "bin_id": bin_id,
            "total_weight_kg": round(data["total_weight"], 2),
            "total_items": data["total_items"],
            "materials": sorted(data["materials"], key=lambda x: x["weight_kg"], reverse=True)
        })
        
    return formatted_result

