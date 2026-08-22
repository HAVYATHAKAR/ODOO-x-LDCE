"""Saved destinations (city bookmarks) routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundError
from app.crud import crud_city, crud_saved
from app.models.user import User
from app.schemas.saved import SavedCreate, SavedOut

router = APIRouter(prefix="/saved", tags=["saved"])


@router.get("", response_model=list[SavedOut])
def list_saved(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SavedOut]:
    return [SavedOut.model_validate(s) for s in crud_saved.list_for_user(db, current_user.id)]


@router.post("", response_model=SavedOut, status_code=status.HTTP_201_CREATED)
def save_city(
    payload: SavedCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavedOut:
    if crud_city.get(db, payload.city_id) is None:
        raise NotFoundError("City not found")
    saved = crud_saved.add(db, user_id=current_user.id, city_id=payload.city_id)
    db.commit()
    db.refresh(saved)
    return SavedOut.model_validate(saved)


@router.delete("/{city_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def unsave_city(
    city_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    removed = crud_saved.remove(db, user_id=current_user.id, city_id=city_id)
    if not removed:
        raise NotFoundError("That city is not in your saved list")
    db.commit()
