from datetime import date
from typing import Optional

from fastapi import APIRouter, Query

from app.services.analytics_service import AnalyticsService
from app.services.transcript_service import TranscriptService

router = APIRouter()
analytics_service = AnalyticsService()
transcript_service = TranscriptService()


@router.get("/dashboard")
async def get_dashboard(target_date: Optional[str] = Query(None, alias="date")):
    d = date.fromisoformat(target_date) if target_date else None
    return await analytics_service.get_dashboard(target_date=d)


@router.get("/trends")
async def get_trends(period: str = Query("7d")):
    days = int(period.replace("d", "")) if "d" in period else 7
    return await analytics_service.get_trends(period_days=days)


@router.get("/transcripts/summary")
async def get_transcript_summary(period: str = Query("7d")):
    days = int(period.replace("d", "")) if "d" in period else 7
    return await transcript_service.get_analytics_summary(period_days=days)
