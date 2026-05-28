from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app import models
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest
from app.auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if email already taken
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    hashed_password = get_password_hash(user_data.password)
    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_password,
        role="warga",
        points=0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
def login(user_data: LoginRequest, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_me(token: str, db: Session = Depends(get_db)):
    """Verify token and return current user profile"""
    from jose import jwt, JWTError
    from app.auth import SECRET_KEY, ALGORITHM
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token tidak valid")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid atau kadaluarsa")

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    return user
