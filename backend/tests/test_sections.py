"""Section & activity CRUD, plus the two-phase reorder."""
from __future__ import annotations

from tests.conftest import API, auth_headers


def _new_trip(client, headers):
    resp = client.post(
        f"{API}/trips",
        json={"name": "Sectioned", "start_date": "2030-06-01", "end_date": "2030-06-05"},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _add_section(client, headers, trip_id, title, order_dates=("2030-06-01", "2030-06-02")):
    return client.post(
        f"{API}/trips/{trip_id}/sections",
        json={
            "title": title,
            "section_type": "sightseeing",
            "start_date": order_dates[0],
            "end_date": order_dates[1],
            "budget": 1000,
        },
        headers=headers,
    )


def test_sections_get_sequential_order(client):
    headers = auth_headers(client, username="sectioner")
    trip_id = _new_trip(client, headers)

    first = _add_section(client, headers, trip_id, "First")
    second = _add_section(client, headers, trip_id, "Second")
    assert first.status_code == 201 and second.status_code == 201
    assert first.json()["sequence_order"] == 0
    assert second.json()["sequence_order"] == 1


def test_reorder_sections(client):
    headers = auth_headers(client, username="reorderer")
    trip_id = _new_trip(client, headers)
    a = _add_section(client, headers, trip_id, "A").json()
    b = _add_section(client, headers, trip_id, "B").json()
    c = _add_section(client, headers, trip_id, "C").json()

    # Reverse the order.
    resp = client.put(
        f"{API}/trips/{trip_id}/sections/reorder",
        json={"ordered_ids": [c["id"], b["id"], a["id"]]},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    ordered = resp.json()
    assert [s["id"] for s in ordered] == [c["id"], b["id"], a["id"]]
    assert [s["sequence_order"] for s in ordered] == [0, 1, 2]


def test_reorder_rejects_wrong_ids(client):
    headers = auth_headers(client, username="badreorder")
    trip_id = _new_trip(client, headers)
    a = _add_section(client, headers, trip_id, "A").json()

    resp = client.put(
        f"{API}/trips/{trip_id}/sections/reorder",
        json={"ordered_ids": [a["id"], 99999]},
        headers=headers,
    )
    assert resp.status_code == 400


def test_add_activity_to_section(client):
    headers = auth_headers(client, username="activityadder")
    trip_id = _new_trip(client, headers)
    section = _add_section(client, headers, trip_id, "Explore").json()

    resp = client.post(
        f"{API}/trips/{trip_id}/sections/{section['id']}/activities",
        json={"custom_name": "Museum visit", "scheduled_date": "2030-06-01", "expense": 250},
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["display_name"] == "Museum visit"
    assert body["sequence_order"] == 0

    # It shows up on the trip detail.
    detail = client.get(f"{API}/trips/{trip_id}", headers=headers).json()
    section_out = next(s for s in detail["sections"] if s["id"] == section["id"])
    assert len(section_out["activities"]) == 1


def test_activity_requires_identity(client):
    headers = auth_headers(client, username="identity")
    trip_id = _new_trip(client, headers)
    section = _add_section(client, headers, trip_id, "Explore").json()

    # Neither activity_id nor custom_name → 422 at the schema layer.
    resp = client.post(
        f"{API}/trips/{trip_id}/sections/{section['id']}/activities",
        json={"scheduled_date": "2030-06-01"},
        headers=headers,
    )
    assert resp.status_code == 422
