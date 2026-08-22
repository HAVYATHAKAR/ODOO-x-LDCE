"""Community subsystem (posts, comments, likes) and saved destinations."""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BigIntPK, TimestampMixin

if TYPE_CHECKING:  # pragma: no cover
    from app.models.city import City
    from app.models.trip import Trip
    from app.models.user import User


class CommunityPost(Base, TimestampMixin):
    """A shared experience about a trip or activity, with likes and comments."""

    __tablename__ = "community_posts"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    trip_id: Mapped[int | None] = mapped_column(ForeignKey("trips.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    like_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    author: Mapped["User"] = relationship("User", back_populates="posts")
    trip: Mapped["Trip | None"] = relationship("Trip", back_populates="posts")
    comments: Mapped[list["CommunityComment"]] = relationship(
        "CommunityComment", back_populates="post", cascade="all, delete-orphan", passive_deletes=True
    )
    likes: Mapped[list["CommunityLike"]] = relationship(
        "CommunityLike", back_populates="post", cascade="all, delete-orphan", passive_deletes=True
    )

    __table_args__ = (
        Index("idx_posts_created", "created_at"),
        Index("idx_posts_likes", "like_count"),
    )


class CommunityComment(Base, TimestampMixin):
    __tablename__ = "community_comments"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True)
    post_id: Mapped[int] = mapped_column(
        ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    post: Mapped["CommunityPost"] = relationship("CommunityPost", back_populates="comments")
    author: Mapped["User"] = relationship("User", back_populates="comments")


class CommunityLike(Base, TimestampMixin):
    __tablename__ = "community_likes"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True)
    post_id: Mapped[int] = mapped_column(
        ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    post: Mapped["CommunityPost"] = relationship("CommunityPost", back_populates="likes")
    user: Mapped["User"] = relationship("User", back_populates="likes")

    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_like"),)


class SavedDestination(Base, TimestampMixin):
    """A user's bookmarked city."""

    __tablename__ = "saved_destinations"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="saved_destinations")
    city: Mapped["City"] = relationship("City", back_populates="saved_by")

    __table_args__ = (UniqueConstraint("user_id", "city_id", name="uq_saved_user_city"),)
