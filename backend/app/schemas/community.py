"""Community (posts, comments, likes) schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.schemas.common import ORMModel
from app.schemas.user import UserPublic


class PostCreate(ORMModel):
    title: str = Field(max_length=200)
    body: str = Field(min_length=1)
    image_url: str | None = Field(default=None, max_length=500)
    trip_id: int | None = None


class PostUpdate(ORMModel):
    title: str | None = Field(default=None, max_length=200)
    body: str | None = None
    image_url: str | None = Field(default=None, max_length=500)


class PostOut(ORMModel):
    id: int
    title: str
    body: str
    image_url: str | None = None
    like_count: int
    trip_id: int | None = None
    created_at: datetime
    author: UserPublic
    comment_count: int = 0
    liked_by_me: bool = False


class CommentCreate(ORMModel):
    body: str = Field(min_length=1)


class CommentOut(ORMModel):
    id: int
    post_id: int
    body: str
    created_at: datetime
    author: UserPublic


class LikeToggleResponse(ORMModel):
    liked: bool
    like_count: int
