from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.booking_service import BookingService

router = APIRouter()
booking_service = BookingService()


class ServiceRequest(BaseModel):
    service_type: str
    service_code: str
    notes: Optional[str] = ""


@router.get("/{pnr}")
async def get_booking(pnr: str):
    result = await booking_service.get_booking(pnr)
    if not result:
        raise HTTPException(status_code=404, detail=f"Booking {pnr} not found")
    return result


@router.post("/{pnr}/services")
async def request_service(pnr: str, request: ServiceRequest):
    # Verify booking exists first
    booking = await booking_service.get_booking(pnr)
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking {pnr} not found")

    return await booking_service.request_service(
        pnr=pnr,
        service_type=request.service_type,
        service_code=request.service_code,
        notes=request.notes or "",
    )
