from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Query

router = APIRouter()

# ── Static demo data ──────────────────────────────────────────────────────────

_DEMO_DASHBOARD = {
    "metrics": {
        "total_conversations": 2347,
        "ai_resolved": 1641,
        "human_escalated": 706,
        "automation_rate": 69.9,
        "avg_response_time_seconds": 4.2,
        "avg_conversation_duration_seconds": 178,
        "cost_today_usd": 845.50,
        "cost_per_conversation_usd": 0.36,
    },
    "by_channel": {
        "phone":    {"count": 1850, "ai_rate": 73.0},
        "whatsapp": {"count": 320,  "ai_rate": 81.2},
        "web":      {"count": 177,  "ai_rate": 55.4},
    },
    "by_language": {
        "en": {"count": 1056, "percentage": 45.0},
        "fr": {"count": 704,  "percentage": 30.0},
        "cr": {"count": 470,  "percentage": 20.0},
        "hi": {"count": 117,  "percentage": 5.0},
    },
    "top_queries": [
        {"type": "flight_status",  "count": 680},
        {"type": "booking_lookup", "count": 520},
        {"type": "pnr_servicing",  "count": 450},
        {"type": "airport_info",   "count": 380},
        {"type": "general_inquiry","count": 317},
    ],
}

def _demo_trends(period_days: int):
    base = date.today()
    rows = []
    volumes = [2210, 2450, 1980, 2630, 2710, 1620, 2347]
    for i in range(min(period_days, len(volumes))):
        d = base - timedelta(days=period_days - 1 - i)
        total = volumes[i % len(volumes)]
        rows.append({
            "date": str(d),
            "total_conversations": total,
            "ai_resolved": int(total * 0.70),
            "human_escalated": int(total * 0.30),
            "avg_response_time_seconds": 4.1 + (i % 3) * 0.2,
            "total_cost_usd": round(total * 0.36, 2),
        })
    return rows


def _is_db_available() -> bool:
    try:
        from app.core.database import get_pool
        get_pool()
        return True
    except RuntimeError:
        return False


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_dashboard(target_date: Optional[str] = Query(None, alias="date")):
    if _is_db_available():
        from app.services.analytics_service import AnalyticsService
        d = date.fromisoformat(target_date) if target_date else None
        return await AnalyticsService().get_dashboard(target_date=d)

    return {**_DEMO_DASHBOARD, "date": target_date or str(date.today())}


@router.get("/trends")
async def get_trends(period: str = Query("7d")):
    days = int(period.replace("d", "")) if "d" in period else 7

    if _is_db_available():
        from app.services.analytics_service import AnalyticsService
        return await AnalyticsService().get_trends(period_days=days)

    return _demo_trends(days)


@router.get("/transcripts/summary")
async def get_transcript_summary(period: str = Query("7d")):
    days = int(period.replace("d", "")) if "d" in period else 7

    if _is_db_available():
        from app.services.transcript_service import TranscriptService
        return await TranscriptService().get_analytics_summary(period_days=days)

    return {
        "period": period,
        "total_calls": 9800,
        "total_transcripts": 9785,
        "transcription_success_rate": 99.8,
        "avg_confidence_score": 94.2,
        "sentiment_distribution": {"positive": 7350, "neutral": 2100, "negative": 335},
        "top_topics": [
            {"topic": "flight_status",  "count": 4200},
            {"topic": "booking_lookup", "count": 2800},
            {"topic": "pnr_servicing",  "count": 1900},
        ],
        "avg_call_duration_seconds": 145,
    }
