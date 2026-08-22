"""Trip CRUD, listing, and ownership enforcement over the HTTP API."""
from __future__ import annotations

from tests.conftest import API, auth_headers


def _create_trip(client, headers, **overrides):
    body = {
        "name": "Japan Adventure",
        "start_date": "2030-03-01",
        "end_date": "2030-03-07",
        "total_budget": 50000,
        "currency": "INR",
    }
    body.update(overrides)
    return client.post(f"{API}/trips", json=body, headers=headers)


def test_create_and_fetch_trip(client):
    headers = auth_headers(client, username="tripper")
    created = _create_trip(client, headers)
    assert created.status_code == 201, created.text
    trip = created.json()
    assert trip["name"] == "Japan Adventure"
    assert trip["num_days"] == 7           # computed field
    assert trip["status"] == "upcoming"    # 2030 is in the future
    assert trip["sections"] == []

    fetched = client.get(f"{API}/trips/{trip['id']}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["id"] == trip["id"]


def test_list_trips_is_scoped_to_user(client):
    headers = auth_headers(client, username="lister")
    _create_trip(client, headers, name="Trip A")
    _create_trip(client, headers, name="Trip B")

    resp = client.get(f"{API}/trips", headers=headers)
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["total"] == 2
    assert {t["name"] for t in payload["items"]} == {"Trip A", "Trip B"}


def test_update_and_delete_trip(client):
    headers = auth_headers(client, username="editor")
    trip = _create_trip(client, headers).json()

    updated = client.put(
        f"{API}/trips/{trip['id']}", json={"name": "Renamed Trip"}, headers=headers
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Renamed Trip"

    deleted = client.delete(f"{API}/trips/{trip['id']}", headers=headers)
    assert deleted.status_code == 204
    gone = client.get(f"{API}/trips/{trip['id']}", headers=headers)
    assert gone.status_code == 404


def test_requires_authentication(client):
    assert client.get(f"{API}/trips").status_code == 401


def test_cannot_access_another_users_trip(client):
    owner = auth_headers(client, username="owner")
    trip = _create_trip(client, owner).json()

    intruder = auth_headers(client, username="intruder")
    resp = client.get(f"{API}/trips/{trip['id']}", headers=intruder)
    assert resp.status_code == 403


def test_invalid_date_order_is_rejected(client):
    headers = auth_headers(client, username="baddates")
    resp = _create_trip(client, headers, start_date="2030-03-10", end_date="2030-03-01")
    assert resp.status_code == 422  # pydantic validation error
