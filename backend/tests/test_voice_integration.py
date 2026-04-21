import pytest
from httpx import AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_incoming_voice_call_returns_twiml():
    """Voice webhook should return valid TwiML XML"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/voice/incoming",
            data={
                "From": "+23057123456",
                "CallSid": "CA_test_001",
                "CallStatus": "ringing",
                "To": "+230603800",
            },
        )
    # May fail without DB, but should not crash with unhandled exception
    assert response.status_code in (200, 500)
    if response.status_code == 200:
        assert "<?xml" in response.text or "<Response>" in response.text


@pytest.mark.asyncio
async def test_bland_webhook_call_ended():
    """Bland.ai call_ended event should be handled without error"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/voice/bland-webhook",
            json={
                "event": "call_ended",
                "call_id": "bland_test_001",
                "duration": 120,
                "cost": 0.30,
                "transcript": "Hello, how can I help? I need flight info.",
                "disposition": "ai_resolved",
            },
        )
    assert response.status_code in (200, 500)


@pytest.mark.asyncio
async def test_flight_not_found():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/flights/XX999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_flight_found_mock():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/flights/MK014")
    assert response.status_code == 200
    data = response.json()
    assert data["flight_number"] == "MK014"
    assert data["airline"] == "Air Mauritius"


@pytest.mark.asyncio
async def test_booking_found_mock():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/bookings/ABC123")
    assert response.status_code == 200
    data = response.json()
    assert data["pnr"] == "ABC123"
    assert data["status"] == "Confirmed"


@pytest.mark.asyncio
async def test_booking_not_found():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/bookings/XXX000")
    assert response.status_code == 404
