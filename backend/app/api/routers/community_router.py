"""Community routes: posts, likes, and comments."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_optional_user
from app.core.exceptions import BadRequestError, NotFoundError, PermissionDeniedError
from app.crud import crud_community, crud_trip
from app.models.community import CommunityPost
from app.models.user import User
from app.schemas.common import Page
from app.schemas.community import (
    CommentCreate,
    CommentOut,
    LikeToggleResponse,
    PostCreate,
    PostOut,
    PostUpdate,
)

router = APIRouter(prefix="/community", tags=["community"])


def _to_post_out(post: CommunityPost, comment_count: int, liked_by_me: bool) -> PostOut:
    out = PostOut.model_validate(post)
    out.comment_count = comment_count
    out.liked_by_me = liked_by_me
    return out


def _load_post(db: Session, post_id: int) -> CommunityPost:
    post = crud_community.get_post(db, post_id)
    if post is None:
        raise NotFoundError("Post not found")
    return post


@router.get("/posts", response_model=Page[PostOut])
def list_posts(
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> Page[PostOut]:
    rows, total = crud_community.list_posts(
        db,
        current_user_id=viewer.id if viewer else None,
        limit=page_size,
        offset=(page - 1) * page_size,
    )
    return Page[PostOut](
        items=[_to_post_out(p, cc, liked) for (p, cc, liked) in rows],
        total=total, page=page, page_size=page_size,
    )


@router.post("/posts", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostOut:
    if payload.trip_id is not None:
        trip = crud_trip.get(db, payload.trip_id)
        if trip is None or trip.user_id != current_user.id:
            raise BadRequestError("You can only attach one of your own trips")
    post = crud_community.create_post(db, user_id=current_user.id, data=payload)
    db.commit()
    return _to_post_out(crud_community.get_post(db, post.id), 0, False)


@router.get("/posts/{post_id}", response_model=PostOut)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
) -> PostOut:
    post = _load_post(db, post_id)
    return _to_post_out(
        post,
        crud_community.count_comments(db, post.id),
        crud_community.is_liked_by(db, post.id, viewer.id if viewer else None),
    )


@router.put("/posts/{post_id}", response_model=PostOut)
def update_post(
    post_id: int,
    payload: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PostOut:
    post = _load_post(db, post_id)
    if post.user_id != current_user.id:
        raise PermissionDeniedError("You can only edit your own posts")
    crud_community.update_post(db, post, payload)
    db.commit()
    updated = crud_community.get_post(db, post.id)
    return _to_post_out(
        updated,
        crud_community.count_comments(db, post.id),
        crud_community.is_liked_by(db, post.id, current_user.id),
    )


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    post = _load_post(db, post_id)
    if post.user_id != current_user.id and not current_user.is_admin:
        raise PermissionDeniedError("You can only delete your own posts")
    crud_community.delete_post(db, post)
    db.commit()


@router.post("/posts/{post_id}/like", response_model=LikeToggleResponse)
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LikeToggleResponse:
    post = _load_post(db, post_id)
    liked, like_count = crud_community.toggle_like(db, post=post, user_id=current_user.id)
    db.commit()
    return LikeToggleResponse(liked=liked, like_count=like_count)


# ── Comments ─────────────────────────────────────────────────
@router.get("/posts/{post_id}/comments", response_model=list[CommentOut])
def list_comments(post_id: int, db: Session = Depends(get_db)) -> list[CommentOut]:
    _load_post(db, post_id)
    return [CommentOut.model_validate(c) for c in crud_community.list_comments(db, post_id)]


@router.post(
    "/posts/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED
)
def add_comment(
    post_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommentOut:
    _load_post(db, post_id)
    comment = crud_community.add_comment(
        db, post_id=post_id, user_id=current_user.id, body=payload.body
    )
    db.commit()
    return CommentOut.model_validate(crud_community.get_comment(db, comment.id))


@router.delete(
    "/posts/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_comment(
    post_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    comment = crud_community.get_comment(db, comment_id)
    if comment is None or comment.post_id != post_id:
        raise NotFoundError("Comment not found")
    if comment.user_id != current_user.id and not current_user.is_admin:
        raise PermissionDeniedError("You can only delete your own comments")
    crud_community.delete_comment(db, comment)
    db.commit()
