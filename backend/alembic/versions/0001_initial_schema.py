"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-22

Creates all 11 GlobeTrotter tables. A Postgres-only tail promotes username/email
to ``citext``, adds ``pg_trgm`` trigram indexes for catalog search, and makes the
section ordering constraint DEFERRABLE (SQLite runs the app via create_all and
never executes this migration).
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _pk() -> sa.Column:
    return sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True)


def _created_updated() -> list[sa.Column]:
    return [
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
    ]


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────
    op.create_table(
        "users",
        _pk(),
        sa.Column("username", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("first_name", sa.String(80), nullable=True),
        sa.Column("last_name", sa.String(80), nullable=True),
        sa.Column("phone_number", sa.String(20), nullable=True),
        sa.Column("city", sa.String(120), nullable=True),
        sa.Column("country", sa.String(120), nullable=True),
        sa.Column("additional_info", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("language_pref", sa.String(10), nullable=False, server_default="en"),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        *_created_updated(),
        sa.UniqueConstraint("username", name="uq_users_username"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    # ── cities ───────────────────────────────────────────────
    op.create_table(
        "cities",
        _pk(),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("country", sa.String(120), nullable=False),
        sa.Column("region", sa.String(120), nullable=True),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("cost_index", sa.Numeric(6, 2), nullable=False, server_default="100"),
        sa.Column("popularity_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.UniqueConstraint("name", "country", name="uq_city_country"),
    )
    op.create_index("idx_cities_region_pop", "cities", ["region", "popularity_score"])

    # ── activities ───────────────────────────────────────────
    op.create_table(
        "activities",
        _pk(),
        sa.Column("city_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("category", sa.String(40), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("estimated_cost", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.ForeignKeyConstraint(
            ["city_id"], ["cities.id"], ondelete="RESTRICT", name="fk_activities_city"
        ),
        sa.CheckConstraint("estimated_cost >= 0", name="ck_activities_cost_nonneg"),
    )
    op.create_index("ix_activities_city_id", "activities", ["city_id"])
    op.create_index("idx_activities_city_cat", "activities", ["city_id", "category"])

    # ── password_reset_tokens ────────────────────────────────
    op.create_table(
        "password_reset_tokens",
        _pk(),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name="fk_reset_user"
        ),
    )
    op.create_index("ix_reset_user_id", "password_reset_tokens", ["user_id"])
    op.create_index("ix_reset_token_hash", "password_reset_tokens", ["token_hash"])

    # ── trips ────────────────────────────────────────────────
    op.create_table(
        "trips",
        _pk(),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("cover_photo_url", sa.String(500), nullable=True),
        sa.Column("total_budget", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR"),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("show_public_budget", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("public_slug", sa.String(16), nullable=True),
        sa.Column("copied_from_trip_id", sa.BigInteger(), nullable=True),
        *_created_updated(),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="RESTRICT", name="fk_trips_user"
        ),
        sa.ForeignKeyConstraint(
            ["copied_from_trip_id"], ["trips.id"], ondelete="SET NULL", name="fk_trips_copied_from"
        ),
        sa.UniqueConstraint("public_slug", name="uq_trips_public_slug"),
        sa.CheckConstraint("end_date >= start_date", name="ck_trips_date_order"),
        sa.CheckConstraint(
            "total_budget IS NULL OR total_budget >= 0", name="ck_trips_budget_nonneg"
        ),
    )
    op.create_index("ix_trips_user_id", "trips", ["user_id"])
    op.create_index("idx_trips_user_dates", "trips", ["user_id", "start_date"])

    # ── trip_sections ────────────────────────────────────────
    op.create_table(
        "trip_sections",
        _pk(),
        sa.Column("trip_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("section_type", sa.String(20), nullable=False),
        sa.Column("city_id", sa.BigInteger(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("budget", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("sequence_order", sa.Integer(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["trip_id"], ["trips.id"], ondelete="CASCADE", name="fk_sections_trip"
        ),
        sa.ForeignKeyConstraint(
            ["city_id"], ["cities.id"], ondelete="RESTRICT", name="fk_sections_city"
        ),
        sa.UniqueConstraint("trip_id", "sequence_order", name="uq_section_trip_order"),
        sa.CheckConstraint("end_date >= start_date", name="ck_sections_date_order"),
        sa.CheckConstraint("budget >= 0", name="ck_sections_budget_nonneg"),
    )
    op.create_index("ix_sections_trip_id", "trip_sections", ["trip_id"])
    op.create_index("idx_sections_trip_order", "trip_sections", ["trip_id", "sequence_order"])
    op.create_index("idx_sections_type", "trip_sections", ["trip_id", "section_type"])

    # ── section_activities ───────────────────────────────────
    op.create_table(
        "section_activities",
        _pk(),
        sa.Column("trip_section_id", sa.BigInteger(), nullable=False),
        sa.Column("activity_id", sa.BigInteger(), nullable=True),
        sa.Column("custom_name", sa.String(160), nullable=True),
        sa.Column("scheduled_date", sa.Date(), nullable=False),
        sa.Column("scheduled_time", sa.Time(), nullable=True),
        sa.Column("sequence_order", sa.Integer(), nullable=False),
        sa.Column("expense", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["trip_section_id"], ["trip_sections.id"], ondelete="CASCADE",
            name="fk_secact_section",
        ),
        sa.ForeignKeyConstraint(
            ["activity_id"], ["activities.id"], ondelete="RESTRICT", name="fk_secact_activity"
        ),
        sa.CheckConstraint(
            "activity_id IS NOT NULL OR custom_name IS NOT NULL", name="ck_secact_identity"
        ),
        sa.CheckConstraint("expense >= 0", name="ck_secact_expense_nonneg"),
    )
    op.create_index("ix_secact_section_id", "section_activities", ["trip_section_id"])
    op.create_index(
        "idx_secact_section_day_order",
        "section_activities",
        ["trip_section_id", "scheduled_date", "sequence_order"],
    )

    # ── community_posts ──────────────────────────────────────
    op.create_table(
        "community_posts",
        _pk(),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("trip_id", sa.BigInteger(), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("like_count", sa.Integer(), nullable=False, server_default="0"),
        *_created_updated(),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name="fk_posts_user"
        ),
        sa.ForeignKeyConstraint(
            ["trip_id"], ["trips.id"], ondelete="SET NULL", name="fk_posts_trip"
        ),
    )
    op.create_index("ix_posts_user_id", "community_posts", ["user_id"])
    op.create_index("idx_posts_created", "community_posts", ["created_at"])
    op.create_index("idx_posts_likes", "community_posts", ["like_count"])

    # ── community_comments ───────────────────────────────────
    op.create_table(
        "community_comments",
        _pk(),
        sa.Column("post_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        *_created_updated(),
        sa.ForeignKeyConstraint(
            ["post_id"], ["community_posts.id"], ondelete="CASCADE", name="fk_comments_post"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name="fk_comments_user"
        ),
    )
    op.create_index("ix_comments_post_id", "community_comments", ["post_id"])

    # ── community_likes ──────────────────────────────────────
    op.create_table(
        "community_likes",
        _pk(),
        sa.Column("post_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        *_created_updated(),
        sa.ForeignKeyConstraint(
            ["post_id"], ["community_posts.id"], ondelete="CASCADE", name="fk_likes_post"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name="fk_likes_user"
        ),
        sa.UniqueConstraint("post_id", "user_id", name="uq_post_like"),
    )
    op.create_index("ix_likes_post_id", "community_likes", ["post_id"])

    # ── saved_destinations ───────────────────────────────────
    op.create_table(
        "saved_destinations",
        _pk(),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("city_id", sa.BigInteger(), nullable=False),
        *_created_updated(),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE", name="fk_saved_user"
        ),
        sa.ForeignKeyConstraint(
            ["city_id"], ["cities.id"], ondelete="CASCADE", name="fk_saved_city"
        ),
        sa.UniqueConstraint("user_id", "city_id", name="uq_saved_user_city"),
    )
    op.create_index("ix_saved_user_id", "saved_destinations", ["user_id"])

    _postgres_enhancements()


def _postgres_enhancements() -> None:
    """Postgres-only: case-insensitive identity columns, trigram search, deferrable order."""
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    op.execute("CREATE EXTENSION IF NOT EXISTS citext")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # Case-insensitive uniqueness at the type level.
    op.execute("ALTER TABLE users ALTER COLUMN username TYPE citext")
    op.execute("ALTER TABLE users ALTER COLUMN email TYPE citext")

    # Fast fuzzy search on catalog names.
    op.execute(
        "CREATE INDEX idx_cities_name_trgm ON cities USING gin (name gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX idx_activities_name_trgm ON activities USING gin (name gin_trgm_ops)"
    )

    # Allow single-statement reordering inside a transaction.
    op.execute("ALTER TABLE trip_sections DROP CONSTRAINT uq_section_trip_order")
    op.execute(
        "ALTER TABLE trip_sections ADD CONSTRAINT uq_section_trip_order "
        "UNIQUE (trip_id, sequence_order) DEFERRABLE INITIALLY IMMEDIATE"
    )


def downgrade() -> None:
    for table in (
        "saved_destinations",
        "community_likes",
        "community_comments",
        "community_posts",
        "section_activities",
        "trip_sections",
        "trips",
        "password_reset_tokens",
        "activities",
        "cities",
        "users",
    ):
        op.drop_table(table)
