import httpx
from typing import Dict, Optional

from app.core.config import settings


MOCK_BOOKINGS: Dict[str, Dict] = {
    "ABC123": {
        "pnr": "ABC123",
        "status": "Confirmed",
        "passenger": {"name": "John Doe", "phone": "+23057000000", "email": "john@example.com"},
        "flight": {"number": "MK014", "date": "2026-04-25", "class": "Economy", "seat": "12A"},
        "services": {"special_meal": "None", "wheelchair": False, "baggage": "23kg"},
    },
    "XYZ789": {
        "pnr": "XYZ789",
        "status": "Confirmed",
        "passenger": {"name": "Marie Dupont", "phone": "+23058000000", "email": "marie@example.fr"},
        "flight": {"number": "MK026", "date": "2026-04-22", "class": "Business", "seat": "3B"},
        "services": {"special_meal": "VGML", "wheelchair": False, "baggage": "32kg"},
    },
}


class BookingService:
    def __init__(self):
        self.api_url = settings.BOOKING_SYSTEM_URL
        self.api_key = settings.BOOKING_SYSTEM_API_KEY

    async def get_booking(self, pnr: str) -> Optional[Dict]:
        pnr = pnr.upper().strip()

        if settings.BOOKING_SYSTEM_API_KEY:
            try:
                return await self._fetch_from_booking_system(pnr)
            except Exception:
                pass

        return MOCK_BOOKINGS.get(pnr)

    async def request_service(self, pnr: str, service_type: str, service_code: str, notes: str = "") -> Dict:
        # In production, call booking system API
        # For now, simulate a successful service request
        ticket_number = f"TKT{hash(pnr + service_type) % 1000000:06d}"

        return {
            "success": True,
            "message": f"{service_type.replace('_', ' ').title()} request submitted",
            "requires_approval": True,
            "ticket_number": ticket_number,
        }

    async def _fetch_from_booking_system(self, pnr: str) -> Optional[Dict]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.api_url}/bookings/{pnr}",
                headers={"X-API-Key": self.api_key},
                timeout=10,
            )
            if resp.status_code == 200:
                return resp.json()
        return None
