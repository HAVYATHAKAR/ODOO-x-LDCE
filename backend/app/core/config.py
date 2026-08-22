"""Application configuration via pydantic-settings.

Values are read from environment variables / a local ``.env`` file. A SQLite
default keeps the project runnable with zero setup; production overrides
``DATABASE_URL`` to PostgreSQL (see ``.env.example``).
"""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────
    PROJECT_NAME: str = "GlobeTrotter"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # ── Database ─────────────────────────────────────────────
    # Zero-setup default; override with Postgres in production.
    DATABASE_URL: str = "sqlite:///./globetrotter.db"

    # ── Auth / JWT ───────────────────────────────────────────
    JWT_SECRET: str = "dev-only-insecure-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_MINUTES: int = 15
    JWT_REFRESH_DAYS: int = 7

    # ── Password reset ───────────────────────────────────────
    RESET_TOKEN_MINUTES: int = 30

    # ── CORS ─────────────────────────────────────────────────
    # Comma-separated string; exposed as a parsed list via ``cors_origins``.
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
