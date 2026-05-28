from fastapi import APIRouter
from app.schemas.bin import SmartBinResponse
from typing import List

router = APIRouter(prefix="/api/v1/bins", tags=["SmartBins"])

@router.get("/", response_model=List[SmartBinResponse])
async def list_bins():
    # Mock data
    return [
        SmartBinResponse(
            bin_id="BIN-JKT-001",
            location_name="Taman Menteng",
            gps_lat=-6.1961,
            gps_long=106.8296,
            status="active",
            capacity_percent=45
        ),
        SmartBinResponse(
            bin_id="BIN-JKT-002",
            location_name="Stasiun Sudirman",
            gps_lat=-6.2023,
            gps_long=106.8227,
            status="full",
            capacity_percent=95
        )
    ]
