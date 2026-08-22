"""Pytest fixtures.

The whole suite runs against an in-memory SQLite database (``sqlite://`` with a
``StaticPool``), so it needs no external services and each test starts from a
freshly created schema. Environment variables are set *before* the app is
imported so ``app.core.config.settings`` picks up the test database.
"""
from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite://")  # in-memory, shared connection
os.environ.setdefault("ENVIRONMENT", "development")  # exposes reset_token in responses
os.environ.setdefault("JWT_SECRET", "test-only-secret")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.base import Base  # noqa: E402

API = "/api/v1"


@pytest.fixture(autouse=True)
def _fresh_schema():
    """Create every table before a test and drop them all afterwards."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """A database session sharing the same in-memory engine as the API."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


# ── Auth helpers ─────────────────────────────────────────────
def register(client: TestClient, *, username: str = "alice", password: str = "password123"):
    """Register a user and return the parsed JSON response."""
    resp = client.post(
        f"{API}/auth/register",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": password,
            "first_name": username.capitalize(),
            "last_name": "Tester",
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def auth_headers(client: TestClient, *, username: str = "alice", password: str = "password123"):
    """Register a fresh user and return Authorization headers for them."""
    data = register(client, username=username, password=password)
    return {"Authorization": f"Bearer {data['tokens']['access_token']}"}
