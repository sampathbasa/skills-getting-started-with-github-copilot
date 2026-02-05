from fastapi.testclient import TestClient
from src.app import app


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Basic sanity: expected activity keys exist
    assert "Chess Club" in data
    assert "Programming Class" in data


def test_signup_and_unregister_cycle():
    activity = "Chess Club"
    email = "pytest-user@example.com"

    # Ensure email is not registered (cleanup if left from previous runs)
    resp = client.get("/activities")
    participants = resp.json()[activity].get("participants", [])
    if email in participants:
        client.post(f"/activities/{activity}/unregister?email={email}")

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in client.get("/activities").json()[activity]["participants"]

    # Unregister
    resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 200
    assert email not in client.get("/activities").json()[activity]["participants"]


def test_unregister_nonexistent_returns_400():
    activity = "Programming Class"
    email = "does-not-exist@example.com"

    # Ensure email not present
    resp = client.get("/activities")
    participants = resp.json()[activity].get("participants", [])
    if email in participants:
        client.post(f"/activities/{activity}/unregister?email={email}")

    # Attempt to unregister a non-registered user
    resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 400
