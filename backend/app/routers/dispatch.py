from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/dispatch", tags=["Fleet Dispatch"])

@router.post("/optimize-route")
async def optimize_route():
    # Mock interaction with AI Model / Routing API
    return {
        "status": "success",
        "route_plan": [
            {"order": 1, "bin_id": "BIN-JKT-002", "action": "pickup", "priority": "high"},
            {"order": 2, "bin_id": "BIN-JKT-005", "action": "pickup", "priority": "medium"}
        ]
    }
