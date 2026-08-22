"""Auth flow: registration, login, identity, and password reset."""
from __future__ import annotations

from tests.conftest import API, auth_headers, register


def test_register_returns_profile_and_tokens(client):
    data = register(client, username="newbie")
    assert data["user"]["username"] == "newbie"
    assert data["user"]["email"] == "newbie@example.com"
    assert data["tokens"]["access_token"]
    assert data["tokens"]["refresh_token"]
    assert data["tokens"]["token_type"] == "bearer"
    # The password must never be echoed back.
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]


def test_register_duplicate_username_conflicts(client):
    register(client, username="dupe")
    resp = client.post(
        f"{API}/auth/register",
        json={"username": "dupe", "email": "other@example.com", "password": "password123"},
    )
    assert resp.status_code == 409, resp.text


def test_login_success_and_wrong_password(client):
    register(client, username="loginuser", password="password123")

    ok = client.post(
        f"{API}/auth/login",
        json={"identifier": "loginuser", "password": "password123"},
    )
    assert ok.status_code == 200
    assert ok.json()["tokens"]["access_token"]

    bad = client.post(
        f"{API}/auth/login",
        json={"identifier": "loginuser", "password": "wrong-password"},
    )
    assert bad.status_code == 401


def test_login_by_email(client):
    register(client, username="emailer", password="password123")
    resp = client.post(
        f"{API}/auth/login",
        json={"identifier": "emailer@example.com", "password": "password123"},
    )
    assert resp.status_code == 200


def test_me_requires_authentication(client):
    anon = client.get(f"{API}/auth/me")
    assert anon.status_code == 401

    headers = auth_headers(client, username="whoami")
    me = client.get(f"{API}/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["username"] == "whoami"


def test_forgot_and_reset_password_flow(client):
    register(client, username="forgetful", password="password123")

    forgot = client.post(
        f"{API}/auth/forgot-password", json={"email": "forgetful@example.com"}
    )
    assert forgot.status_code == 200
    token = forgot.json()["reset_token"]  # exposed only in non-production
    assert token

    reset = client.post(
        f"{API}/auth/reset-password", json={"token": token, "new_password": "brand-new-pass"}
    )
    assert reset.status_code == 200

    # Old password no longer works; new one does.
    old = client.post(
        f"{API}/auth/login", json={"identifier": "forgetful", "password": "password123"}
    )
    assert old.status_code == 401
    new = client.post(
        f"{API}/auth/login", json={"identifier": "forgetful", "password": "brand-new-pass"}
    )
    assert new.status_code == 200

    # Reset tokens are single-use.
    reuse = client.post(
        f"{API}/auth/reset-password", json={"token": token, "new_password": "another-pass"}
    )
    assert reuse.status_code >= 400
