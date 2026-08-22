from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.auth import UserCreate, UserLogin, Token
from app.models.user import User

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=409, detail="Email already registered")

    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        username=user_in.username,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        password_hash=hashed_password
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(subject=str(new_user.id))
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer", "user": user}
