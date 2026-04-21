#!/usr/bin/env python3
"""
Voice integration test — simulate a Bland.ai call flow
Usage: python scripts/test_voice.py
"""

import asyncio
import httpx
import os

API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")


async def test_incoming_call():
    print("Testing: Incoming Voice Call")
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_BASE}/api/v1/voice/incoming",
            data={
                "From": "+23057123456",
                "CallSid": "CA_script_test_001",
                "CallStatus": "ringing",
                "To": "+230603800",
            },
        )
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        print(f"  TwiML: {response.text[:200]}")
        print("  PASS")
    else:
        print(f"  Response: {response.text[:200]}")
        print("  FAIL (may need DB connection)")


async def test_bland_webhook():
    print("\nTesting: Bland.ai Webhook")
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_BASE}/api/v1/voice/bland-webhook",
            json={
                "event": "call_ended",
                "call_id": "bland_script_test_001",
                "duration": 180,
                "cost": 0.45,
                "transcript": "Assistant: Hello, Air Mauritius AI. Caller: What time does MK014 depart? Assistant: MK014 departs at 23:50 from Gate B5. Caller: Thank you!",
                "disposition": "ai_resolved",
                "concatenated_transcript": [
                    {"user": "assistant", "text": "Hello, Air Mauritius AI.", "start": 0.0, "end": 2.5, "confidence": 0.98},
                    {"user": "caller", "text": "What time does MK014 depart?", "start": 3.0, "end": 5.5, "confidence": 0.92},
                    {"user": "assistant", "text": "MK014 departs at 23:50 from Gate B5.", "start": 6.0, "end": 9.0, "confidence": 0.97},
                    {"user": "caller", "text": "Thank you!", "start": 9.5, "end": 10.5, "confidence": 0.99},
                ],
            },
        )
    print(f"  Status: {response.status_code}")
    print("  PASS" if response.status_code == 200 else "  FAIL (may need DB)")


async def test_flight_lookup():
    print("\nTesting: Flight Lookup (MK014)")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE}/api/v1/flights/MK014")
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Flight: {data['flight_number']} — {data['status']}")
        print(f"  Gate: {data['departure']['gate']}")
        print("  PASS")
    else:
        print("  FAIL")


async def test_booking_lookup():
    print("\nTesting: Booking Lookup (ABC123)")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE}/api/v1/bookings/ABC123")
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Passenger: {data['passenger']['name']}")
        print(f"  Flight: {data['flight']['number']}")
        print("  PASS")
    else:
        print("  FAIL")


async def test_health():
    print("Testing: Health Check")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE}/health")
    print(f"  Status: {response.status_code}")
    if response.status_code == 200:
        print(f"  Response: {response.json()}")
        print("  PASS")
    else:
        print("  FAIL")


async def main():
    print(f"SSR Airport AI — Voice Integration Tests")
    print(f"API: {API_BASE}")
    print("=" * 50)

    await test_health()
    await test_flight_lookup()
    await test_booking_lookup()
    await test_incoming_call()
    await test_bland_webhook()

    print("\n" + "=" * 50)
    print("Tests complete.")


if __name__ == "__main__":
    asyncio.run(main())
