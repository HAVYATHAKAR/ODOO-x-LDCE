"""Profile management routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.crud import crud_user
from app.models.user import User
from app.schemas.common import Message
from app.schemas.user import UserProfile, UserUpdate

router = APIRouter(prefix="/users", tags=["profile"])


@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.put("/me", response_model=UserProfile)
def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    user = crud_user.update_profile(db, current_user, payload)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/me", response_model=Message, status_code=status.HTTP_200_OK)
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Message:
    # Soft delete: trips use ON DELETE RESTRICT, so we retain data and just
    # deactivate the account.
    crud_user.soft_delete(db, current_user)
    db.commit()
    return Message(detail="Account deactivated.")
