from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.user import UserResponse, UserCreate, Reward
from typing import List

router = APIRouter(prefix="/api/v1/users", tags=["Users & Gamification"])

@router.get("/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}/rewards", response_model=List[Reward])
def get_user_rewards(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return db.query(models.Reward).all()
