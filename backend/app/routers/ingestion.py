from fastapi import APIRouter, HTTPException
from app.schemas.sensor import SensorPayload, IngestionResponse
from datetime import datetime

router = APIRouter(prefix="/api/v1/ingest", tags=["IoT Ingestion"])

@router.post("/", response_model=IngestionResponse)
async def ingest_sensor_data(payload: SensorPayload):
    # In a real app, this would push the payload to a message broker like RabbitMQ or Kafka
    # For now, we simulate success
    return IngestionResponse(
        status="success",
        message="Data received and queued for processing",
        received_at=datetime.utcnow()
    )
