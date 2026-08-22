"""Community persistence: posts, comments, and likes."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.community import CommunityComment, CommunityLike, CommunityPost
from app.schemas.community import PostCreate, PostUpdate


def create_post(db: Session, *, user_id: int, data: PostCreate) -> CommunityPost:
    post = CommunityPost(user_id=user_id, **data.model_dump())
    db.add(post)
    db.flush()
    return post


def get_post(db: Session, post_id: int) -> CommunityPost | None:
    return db.scalar(
        select(CommunityPost)
        .where(CommunityPost.id == post_id)
        .options(selectinload(CommunityPost.author))
    )


def _comment_counts(db: Session, post_ids: list[int]) -> dict[int, int]:
    if not post_ids:
        return {}
    rows = db.execute(
        select(CommunityComment.post_id, func.count())
        .where(CommunityComment.post_id.in_(post_ids))
        .group_by(CommunityComment.post_id)
    ).all()
    return {pid: cnt for pid, cnt in rows}


def _liked_post_ids(db: Session, post_ids: list[int], user_id: int | None) -> set[int]:
    if not post_ids or user_id is None:
        return set()
    rows = db.scalars(
        select(CommunityLike.post_id).where(
            CommunityLike.post_id.in_(post_ids), CommunityLike.user_id == user_id
        )
    )
    return set(rows)


def list_posts(
    db: Session,
    *,
    current_user_id: int | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[tuple[CommunityPost, int, bool]], int]:
    total = db.scalar(select(func.count()).select_from(CommunityPost)) or 0
    posts = list(
        db.scalars(
            select(CommunityPost)
            .options(selectinload(CommunityPost.author))
            .order_by(CommunityPost.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    )
    post_ids = [p.id for p in posts]
    counts = _comment_counts(db, post_ids)
    liked = _liked_post_ids(db, post_ids, current_user_id)
    rows = [(p, counts.get(p.id, 0), p.id in liked) for p in posts]
    return rows, total


def update_post(db: Session, post: CommunityPost, data: PostUpdate) -> CommunityPost:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    db.flush()
    return post


def delete_post(db: Session, post: CommunityPost) -> None:
    db.delete(post)
    db.flush()


# ── Comments ─────────────────────────────────────────────────
def add_comment(db: Session, *, post_id: int, user_id: int, body: str) -> CommunityComment:
    comment = CommunityComment(post_id=post_id, user_id=user_id, body=body)
    db.add(comment)
    db.flush()
    return comment


def get_comment(db: Session, comment_id: int) -> CommunityComment | None:
    return db.get(CommunityComment, comment_id)


def list_comments(db: Session, post_id: int) -> list[CommunityComment]:
    return list(
        db.scalars(
            select(CommunityComment)
            .where(CommunityComment.post_id == post_id)
            .options(selectinload(CommunityComment.author))
            .order_by(CommunityComment.created_at.asc())
        )
    )


def delete_comment(db: Session, comment: CommunityComment) -> None:
    db.delete(comment)
    db.flush()


# ── Likes ────────────────────────────────────────────────────
def toggle_like(db: Session, *, post: CommunityPost, user_id: int) -> tuple[bool, int]:
    """Add or remove the current user's like. Returns ``(liked_now, like_count)``."""
    existing = db.scalar(
        select(CommunityLike).where(
            CommunityLike.post_id == post.id, CommunityLike.user_id == user_id
        )
    )
    if existing is not None:
        db.delete(existing)
        post.like_count = max(0, post.like_count - 1)
        liked_now = False
    else:
        db.add(CommunityLike(post_id=post.id, user_id=user_id))
        post.like_count = post.like_count + 1
        liked_now = True
    db.flush()
    return liked_now, post.like_count


def count_posts(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(CommunityPost)) or 0


def count_comments(db: Session, post_id: int) -> int:
    return (
        db.scalar(
            select(func.count()).select_from(CommunityComment).where(
                CommunityComment.post_id == post_id
            )
        )
        or 0
    )


def is_liked_by(db: Session, post_id: int, user_id: int | None) -> bool:
    if user_id is None:
        return False
    return (
        db.scalar(
            select(func.count()).select_from(CommunityLike).where(
                CommunityLike.post_id == post_id, CommunityLike.user_id == user_id
            )
        )
        or 0
    ) > 0
