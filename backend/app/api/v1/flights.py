from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.services.fids_service import FIDSService

router = APIRouter()
fids = FIDSService()


@router.get("/{flight_number}")
async def get_flight(flight_number: str):
    result = await fids.get_flight(flight_number)
    if not result:
        raise HTTPException(status_code=404, detail=f"Flight {flight_number} not found")
    return result


@router.get("/")
async def search_flights(
    from_airport: Optional[str] = Query(None, alias="from"),
    to_airport: Optional[str] = Query(None, alias="to"),
    date: Optional[str] = Query(None),
):
    return await fids.search_flights(
        from_airport=from_airport,
        to_airport=to_airport,
        date=date,
    )
