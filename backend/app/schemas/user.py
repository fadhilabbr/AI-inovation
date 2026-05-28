from pydantic import BaseModel
from typing import List, Optional

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    points: int
    role: str

    class Config:
        from_attributes = True

class Reward(BaseModel):
    id: int
    name: str
    points_required: int

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: str | None = None
