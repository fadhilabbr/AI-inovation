import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
# pyright: ignore [reportMissingImports]
import google.generativeai as genai
from dotenv import load_dotenv
from ..database import get_db
from .. import models
import datetime
import json

load_dotenv()

router = APIRouter(
    prefix="/api/vision",
    tags=["vision"]
)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

@router.post("/classify")
async def classify_trash(
    bin_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Endpoint for ESP32-CAM to upload image.
    Classifies the trash using Gemini 1.5 Flash (Lite).
    """
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing in backend")

    # Read the image file
    contents = await file.read()

    # Use the recommended Gemini model
    model = genai.GenerativeModel('gemini-3.1-flash-lite')

    # Prepare prompt
    prompt = """
    Analyze this image and identify if there is any waste/trash.
    If there is, classify it into one of these categories: Plastic, Paper, Metal, Glass, Organic, Other.
    If it is not trash (or nothing is detected), return "None" as the trash_type.
    Also estimate the approximate weight in kg (make a rough guess, e.g., 0.1 for a bottle) and estimated volume of the item in Liters (make a rough guess, e.g., 1.5 for a large plastic bottle, 0.3 for a small cup, etc.).
    Return ONLY a JSON response with this exact structure, no markdown formatting:
    {"trash_type": "Plastic", "weight_kg": 0.1, "volume_liters": 1.5}
    """
    
    try:
        # Call Gemini
        response = model.generate_content([
            prompt,
            {"mime_type": file.content_type or "image/jpeg", "data": contents}
        ])
        
        # Clean response string (sometimes Gemini wraps in ```json ... ```)
        text_response = response.text.strip()
        if text_response.startswith("```json"):
            text_response = text_response[7:]
        if text_response.endswith("```"):
            text_response = text_response[:-3]
            
        data = json.loads(text_response.strip())
        
        trash_type = data.get("trash_type", "Unknown")
        weight_kg = float(data.get("weight_kg", 0.0))
        volume_liters = float(data.get("volume_liters", 0.0))

        # Reject non-trash detections early — do NOT write to DB
        NON_TRASH_VALUES = {"none", "null", "", "unknown", "bukan sampah", "not trash"}
        trash_type_clean = (trash_type or "").strip().lower()
        is_valid_trash = trash_type_clean and trash_type_clean not in NON_TRASH_VALUES

        if not is_valid_trash:
            return {
                "status": "skipped",
                "message": f"Deteksi '{trash_type}' bukan sampah — data tidak disimpan.",
                "classification": data
            }
        
        # Check if bin exists, if not, you might want to create a default one or reject
        bin_record = db.query(models.SmartBin).filter(models.SmartBin.bin_id == bin_id).first()
        gps_lat, gps_long = 0.0, 0.0
        
        if bin_record:
            gps_lat = bin_record.gps_lat
            gps_long = bin_record.gps_long
            total_vol = bin_record.total_volume_liters or 100.0
            
            # Accumulate filled_volume_liters and update capacity_percent
            bin_record.filled_volume_liters = min(
                total_vol,
                (bin_record.filled_volume_liters or 0.0) + volume_liters
            )
            bin_record.capacity_percent = int(round((bin_record.filled_volume_liters / total_vol) * 100.0))
            
            # Update status
            if bin_record.capacity_percent >= 85:
                bin_record.status = "full"
            else:
                bin_record.status = "active"
                
            bin_record.last_updated = datetime.datetime.utcnow().isoformat()
        else:
            total_vol = 100.0
            
        # Compute volume_percent for the log from liters
        volume_pct_for_log = int(round(min(100.0, (volume_liters / total_vol) * 100.0)))
        
        # Log to SensorLog
        new_log = models.SensorLog(
            bin_id=bin_id,
            timestamp=datetime.datetime.utcnow(),
            gps_lat=gps_lat,
            gps_long=gps_long,
            trash_type=trash_type,
            weight_kg=weight_kg,
            volume_percent=volume_pct_for_log,
            volume_liters=volume_liters
        )
        db.add(new_log)

        # Update BinContent
        bin_content = db.query(models.BinContent).filter(
            models.BinContent.bin_id == bin_id,
            models.BinContent.trash_type == trash_type
        ).first()

        if not bin_content:
            bin_content = models.BinContent(
                bin_id=bin_id,
                trash_type=trash_type,
                total_weight_kg=weight_kg,
                item_count=1,
                last_updated=datetime.datetime.utcnow()
            )
            db.add(bin_content)
        else:
            bin_content.total_weight_kg += weight_kg
            bin_content.item_count += 1
            bin_content.last_updated = datetime.datetime.utcnow()
            
        db.commit()
        db.refresh(new_log)
        
        return {
            "status": "success",
            "classification": data,
            "log_id": new_log.id
        }

    except Exception as e:
        print(f"Error classifying: {e}")
        raise HTTPException(status_code=500, detail=str(e))
