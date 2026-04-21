import httpx
from typing import Dict, Optional

from app.core.config import settings


# Mock flight data for development when FIDS API is unavailable
MOCK_FLIGHTS: Dict[str, Dict] = {
    "MK014": {
        "flight_number": "MK014",
        "airline": "Air Mauritius",
        "status": "On Time",
        "departure": {
            "airport": "MRU",
            "scheduled": "23:50",
            "actual": "23:50",
            "terminal": "International",
            "gate": "B5",
            "check_in": "Hall A, Desks 12-18",
        },
        "arrival": {
            "airport": "CDG",
            "scheduled": "07:15+1",
            "terminal": "2E",
        },
        "aircraft": "A350-900",
        "duration": "11h 25m",
    },
    "MK042": {
        "flight_number": "MK042",
        "airline": "Air Mauritius",
        "status": "On Time",
        "departure": {
            "airport": "MRU",
            "scheduled": "01:30",
            "actual": "01:30",
            "terminal": "International",
            "gate": "A8",
            "check_in": "Hall A, Desks 1-6",
        },
        "arrival": {
            "airport": "SIN",
            "scheduled": "13:45+1",
            "terminal": "1",
        },
        "aircraft": "A330-900neo",
        "duration": "8h 15m",
    },
    "MK026": {
        "flight_number": "MK026",
        "airline": "Air Mauritius",
        "status": "Delayed",
        "delay_minutes": 45,
        "departure": {
            "airport": "MRU",
            "scheduled": "10:30",
            "actual": "11:15",
            "terminal": "International",
            "gate": "B3",
            "check_in": "Hall A, Desks 7-12",
        },
        "arrival": {
            "airport": "LHR",
            "scheduled": "19:05",
            "terminal": "4",
        },
        "aircraft": "A350-900",
        "duration": "12h 35m",
    },
}


class FIDSService:
    def __init__(self):
        self.api_url = settings.FIDS_API_URL
        self.api_key = settings.FIDS_API_KEY

    async def get_flight(self, flight_number: str) -> Optional[Dict]:
        flight_number = flight_number.upper().strip()

        if settings.FIDS_API_KEY:
            try:
                return await self._fetch_from_fids(flight_number)
            except Exception:
                pass

        # Fall back to mock data
        return MOCK_FLIGHTS.get(flight_number)

    async def search_flights(
        self, from_airport: Optional[str] = None, to_airport: Optional[str] = None, date: Optional[str] = None
    ) -> Dict:
        flights = list(MOCK_FLIGHTS.values())

        if from_airport:
            flights = [f for f in flights if f["departure"]["airport"] == from_airport.upper()]
        if to_airport:
            flights = [f for f in flights if f["arrival"]["airport"] == to_airport.upper()]

        return {"flights": flights}

    async def _fetch_from_fids(self, flight_number: str) -> Optional[Dict]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.api_url}/flights/{flight_number}",
                headers={"X-API-Key": self.api_key},
                timeout=10,
            )
            if resp.status_code == 200:
                return resp.json()
        return None
