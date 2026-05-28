from fastapi import APIRouter
from app.schemas.user import UserResponse, UserCreate, Reward

router = APIRouter(prefix="/api/v1/users", tags=["Users & Gamification"])

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    # Mock data
    return UserResponse(id=user_id, name="Budi", email="budi@example.com", points=150)

@router.get("/{user_id}/rewards")
async def get_user_rewards(user_id: int):
    # Mock data
    return [
        Reward(id=1, name="Voucher Belanja 50k", points_required=500),
        Reward(id=2, name="Tiket TransJakarta", points_required=100)
    ]
