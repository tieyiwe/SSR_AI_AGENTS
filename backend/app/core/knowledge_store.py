import threading
import uuid
from datetime import datetime, timezone

_lock = threading.Lock()
_store: list[dict] = [
    {
        "id": "kb-001",
        "category": "Flights",
        "question": "What is the baggage allowance?",
        "answer": "Economy: 23 kg, Premium Economy: 30 kg, Business: 32 kg for Air Mauritius. Always verify the specific allowance printed on your ticket or e-ticket confirmation.",
        "keywords": ["baggage", "luggage", "weight", "allowance", "kg"],
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "kb-002",
        "category": "Flights",
        "question": "How early should I arrive for check-in?",
        "answer": "For international flights, arrive at least 3 hours before departure. Check-in opens 3 hours and closes 60 minutes before departure. Online check-in is available at airmauritius.com from 48 h before.",
        "keywords": ["check-in", "arrive", "early", "time", "airport", "online"],
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "kb-003",
        "category": "Special Services",
        "question": "How do I request wheelchair or mobility assistance?",
        "answer": "Request wheelchair assistance at booking or at least 48 hours before departure. At the airport, go to any Air Mauritius check-in counter. The service is complimentary.",
        "keywords": ["wheelchair", "mobility", "assistance", "disability", "special", "WCHR"],
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "kb-004",
        "category": "Special Services",
        "question": "What special meals are available and how do I order one?",
        "answer": "Available meal codes: VGML (vegetarian), KSML (kosher), HNML (Hindu), MOML (Muslim/halal), BLML (bland/medical), CHML (child). Request at least 24 hours before departure via Air Mauritius website or call centre.",
        "keywords": ["meal", "food", "vegetarian", "kosher", "halal", "VGML", "HNML", "MOML", "special"],
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "kb-005",
        "category": "Airport Info",
        "question": "Where is the Air Mauritius Business lounge?",
        "answer": "The SSR Lounge is in the departure terminal airside (after passport control), Level 2. Access for Business Class passengers and qualifying frequent flyer cardholders. Hours: 24/7 following flight schedules.",
        "keywords": ["lounge", "business class", "departure", "airside", "frequent flyer"],
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "kb-006",
        "category": "Bookings",
        "question": "How do I change or cancel my flight?",
        "answer": "Contact Air Mauritius on +230 207 7070 or visit airmauritius.com. Change fees depend on fare type. Refundable tickets: full refund minus fee. Non-refundable: taxes only refunded.",
        "keywords": ["change", "cancel", "refund", "modify", "booking", "ticket"],
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "kb-007",
        "category": "Airport Info",
        "question": "What are the duty-free shop hours and where are they?",
        "answer": "Duty-free shops are open 24/7, airside in the departure terminal after security screening. They accept MUR, EUR, USD, GBP and major credit cards.",
        "keywords": ["duty-free", "shops", "shopping", "hours", "tax-free"],
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "kb-008",
        "category": "Policies",
        "question": "What is the unaccompanied minor (UMNR) policy?",
        "answer": "Children aged 5–11 travelling alone must use the UMNR service. Children 12–17 may use it optionally. Book via Air Mauritius at least 72 hours before departure. A fee applies. A parent/guardian must complete the UMNR form at check-in.",
        "keywords": ["unaccompanied", "minor", "child", "UMNR", "alone", "travelling"],
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "kb-009",
        "category": "Flights",
        "question": "How do I find out if my flight is delayed or cancelled?",
        "answer": "Check real-time flight status on airmauritius.com, the Air Mauritius app, or ask Priya here. Departure boards at SSR Airport are updated every 3 minutes. In case of cancellation, Air Mauritius will notify you by SMS/email.",
        "keywords": ["delay", "delayed", "cancelled", "cancellation", "flight status", "FIDS"],
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "kb-010",
        "category": "Airport Info",
        "question": "Where are the check-in desks for Air Mauritius?",
        "answer": "Air Mauritius check-in desks are located in Hall A of the departures terminal. Desks 1–6 handle long-haul flights, Desks 7–12 handle regional flights, Desks 12–18 handle select international flights. See the FIDS boards for your specific flight.",
        "keywords": ["check-in", "desk", "hall A", "where", "location"],
        "active": True,
        "created_at": "2026-01-10T08:00:00Z",
    },
]

CATEGORIES = ["Flights", "Bookings", "Special Services", "Airport Info", "Policies", "General"]


def list_entries(category: str | None = None, search: str | None = None) -> list[dict]:
    with _lock:
        items = list(_store)
    if category:
        items = [i for i in items if i["category"] == category]
    if search:
        sl = search.lower()
        items = [
            i for i in items
            if sl in i["question"].lower()
            or sl in i["answer"].lower()
            or any(sl in k.lower() for k in i.get("keywords", []))
        ]
    return items


def get_entry(entry_id: str) -> dict | None:
    with _lock:
        for e in _store:
            if e["id"] == entry_id:
                return dict(e)
    return None


def add_entry(data: dict) -> dict:
    entry = {
        "id": f"kb-{uuid.uuid4().hex[:8]}",
        "category": data["category"],
        "question": data["question"],
        "answer": data["answer"],
        "keywords": data.get("keywords", []),
        "active": data.get("active", True),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        _store.append(entry)
    return entry


def update_entry(entry_id: str, data: dict) -> dict | None:
    with _lock:
        for i, e in enumerate(_store):
            if e["id"] == entry_id:
                _store[i] = {**e, **{k: v for k, v in data.items() if k != "id"}}
                return dict(_store[i])
    return None


def delete_entry(entry_id: str) -> bool:
    with _lock:
        for i, e in enumerate(_store):
            if e["id"] == entry_id:
                _store.pop(i)
                return True
    return False
