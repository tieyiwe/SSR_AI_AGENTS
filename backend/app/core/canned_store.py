import threading
import uuid
from datetime import datetime, timezone

_lock = threading.Lock()
_store: list[dict] = [
    {
        "id": "cr-001",
        "title": "Greeting",
        "content": "Hello! I'm a human agent from SSR Airport operations. I've taken over your case and will personally assist you. How can I help you today?",
        "category": "greetings",
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "cr-002",
        "title": "Delay Apology",
        "content": "I sincerely apologise for the inconvenience caused by this delay. Our team is working to resolve the situation as quickly as possible. I'll keep you updated with the latest information.",
        "category": "delays",
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "cr-003",
        "title": "Escalate to Supervisor",
        "content": "I completely understand your frustration. I'm escalating your case to my supervisor right now to ensure you receive the best possible resolution. Please bear with me for a moment.",
        "category": "escalation",
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "cr-004",
        "title": "PNR Request",
        "content": "To look into your booking, could you please provide your PNR (booking reference)? It's typically a 6-character code found on your ticket or booking confirmation email.",
        "category": "bookings",
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "cr-005",
        "title": "Resolution Farewell",
        "content": "I'm glad we could resolve this for you! Thank you for your patience. Is there anything else I can help you with before you travel? Have a wonderful journey!",
        "category": "closing",
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "cr-006",
        "title": "Check-in Guidance",
        "content": "Air Mauritius check-in desks are in Hall A of the departures terminal. Check-in opens 3 hours before departure and closes 60 minutes before. You can also check in online at airmauritius.com.",
        "category": "airport_info",
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "cr-007",
        "title": "Baggage Info",
        "content": "Baggage allowance: Economy 23 kg, Premium Economy 30 kg, Business 32 kg. Excess baggage can be purchased online at a discounted rate before your flight. Please check your ticket for the specific allowance.",
        "category": "bookings",
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "cr-008",
        "title": "Put on Hold",
        "content": "Could you please hold for just a moment while I check the details for you? I'll be back shortly.",
        "category": "general",
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
]

CANNED_CATEGORIES = ["greetings", "delays", "escalation", "bookings", "closing", "airport_info", "general"]


def list_responses(category: str | None = None) -> list[dict]:
    with _lock:
        items = list(_store)
    if category:
        items = [i for i in items if i["category"] == category]
    return [i for i in items if i["active"]]


def add_response(data: dict) -> dict:
    entry = {
        "id": f"cr-{uuid.uuid4().hex[:8]}",
        "title": data["title"],
        "content": data["content"],
        "category": data.get("category", "general"),
        "active": data.get("active", True),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        _store.append(entry)
    return entry


def update_response(resp_id: str, data: dict) -> dict | None:
    with _lock:
        for i, e in enumerate(_store):
            if e["id"] == resp_id:
                _store[i] = {**e, **{k: v for k, v in data.items() if k != "id"}}
                return dict(_store[i])
    return None


def delete_response(resp_id: str) -> bool:
    with _lock:
        for i, e in enumerate(_store):
            if e["id"] == resp_id:
                _store.pop(i)
                return True
    return False
