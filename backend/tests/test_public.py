"""Public sharing: publish, privacy-aware read-only view, and deep copy."""
from __future__ import annotations

from tests.conftest import API, auth_headers


def _num(value):
    """Decimal fields may serialize as strings or numbers; normalize to float."""
    return float(value) if value is not None else None


def _trip_with_content(client, headers):
    trip_id = client.post(
        f"{API}/trips",
        json={
            "name": "Shareable Trip",
            "start_date": "2030-09-01",
            "end_date": "2030-09-03",
            "total_budget": 20000,
        },
        headers=headers,
    ).json()["id"]

    section = client.post(
        f"{API}/trips/{trip_id}/sections",
        json={
            "title": "Hotel",
            "section_type": "accommodation",
            "start_date": "2030-09-01",
            "end_date": "2030-09-03",
            "budget": 5000,
        },
        headers=headers,
    ).json()
    client.post(
        f"{API}/trips/{trip_id}/sections/{section['id']}/activities",
        json={"custom_name": "Suite", "scheduled_date": "2030-09-01", "expense": 1500},
        headers=headers,
    )
    return trip_id


def test_share_hides_budget_by_default(client):
    headers = auth_headers(client, username="sharer")
    trip_id = _trip_with_content(client, headers)

    share = client.post(f"{API}/trips/{trip_id}/share", headers=headers)
    assert share.status_code == 200, share.text
    slug = share.json()["public_slug"]
    assert share.json()["is_public"] is True
    assert slug

    # Anonymous view — no auth header.
    public = client.get(f"{API}/public/trips/{slug}")
    assert public.status_code == 200
    body = public.json()
    assert body["show_budget"] is False
    assert body["total_budget"] is None
    assert _num(body["sections"][0]["budget"]) == 0
    assert _num(body["sections"][0]["activities"][0]["expense"]) == 0


def test_share_reveals_budget_when_opted_in(client):
    headers = auth_headers(client, username="opener")
    trip_id = _trip_with_content(client, headers)
    slug = client.post(f"{API}/trips/{trip_id}/share", headers=headers).json()["public_slug"]

    client.put(f"{API}/trips/{trip_id}", json={"show_public_budget": True}, headers=headers)

    body = client.get(f"{API}/public/trips/{slug}").json()
    assert body["show_budget"] is True
    assert _num(body["total_budget"]) == 20000
    assert _num(body["sections"][0]["budget"]) == 5000
    assert _num(body["sections"][0]["activities"][0]["expense"]) == 1500


def test_copy_public_trip_into_another_account(client):
    owner = auth_headers(client, username="original")
    trip_id = _trip_with_content(client, owner)
    slug = client.post(f"{API}/trips/{trip_id}/share", headers=owner).json()["public_slug"]

    copier = auth_headers(client, username="copier")
    resp = client.post(f"{API}/public/trips/{slug}/copy", headers=copier)
    assert resp.status_code == 200, resp.text
    copy = resp.json()
    assert copy["name"] == "Copy of Shareable Trip"
    assert copy["is_public"] is False
    assert copy["copied_from_trip_id"] == trip_id
    # The itinerary content came across.
    assert len(copy["sections"]) == 1
    assert len(copy["sections"][0]["activities"]) == 1


def test_unknown_slug_returns_404(client):
    assert client.get(f"{API}/public/trips/does-not-exist").status_code == 404
