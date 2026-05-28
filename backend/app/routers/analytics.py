from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & Dashboard"])

@router.get("/summary")
async def get_dashboard_summary():
    return {
        "total_bins": 120,
        "active_bins": 115,
        "full_bins": 5,
        "total_trash_collected_kg": 1540.5,
        "top_materials": [
            {"type": "plastic", "percentage": 45},
            {"type": "organic", "percentage": 30},
            {"type": "paper", "percentage": 20},
            {"type": "metal", "percentage": 5},
        ]
    }
