import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Form, Request, HTTPException, Query
from fastapi.responses import Response

from app.core.config import settings
from app.core.database import get_pool
from app.models.call import EscalationRequest, EscalationResponse
from app.services.voice_service import BlandVoiceService
from app.services.twilio_service import TwilioService
from app.services.transcript_service import TranscriptService
from app.utils.language import detect_language

router = APIRouter()
bland_service = BlandVoiceService()
twilio_service = TwilioService()
transcript_service = TranscriptService()


@router.post("/incoming")
async def handle_incoming_call(request: Request):
    """Twilio webhook — incoming phone call"""
    form = await request.form()
    caller = form.get("From", "unknown")
    call_sid = form.get("CallSid", "")

    pool = get_pool()
    async with pool.acquire() as conn:
        conv_row = await conn.fetchrow(
            "INSERT INTO conversations (channel, passenger_phone) VALUES ('phone', $1) RETURNING id",
            caller,
        )
        conv_id = str(conv_row["id"])
        await conn.execute(
            """
            INSERT INTO voice_calls (conversation_id, twilio_call_sid, caller_number, direction, status)
            VALUES ($1, $2, $3, 'inbound', 'ringing')
            """,
            conv_id, call_sid, caller,
        )

    twiml = twilio_service.generate_incoming_twiml()
    return Response(content=twiml, media_type="application/xml")


@router.post("/route-to-bland")
async def route_to_bland(request: Request):
    """Intermediate step: trigger Bland.ai for the caller"""
    form = await request.form()
    caller = form.get("From", "unknown")
    call_sid = form.get("CallSid", "")

    if settings.BLAND_AI_API_KEY:
        try:
            await bland_service.create_call(phone_number=caller, language="en")
        except Exception:
            pass  # Fallback: keep caller in Twilio

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="en-GB">Our AI assistant will assist you shortly. Please stay on the line.</Say>
    <Pause length="60"/>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


@router.post("/status")
async def handle_status_callback(request: Request):
    """Twilio call status callback"""
    form = await request.form()
    call_sid = form.get("CallSid", "")
    status = form.get("CallStatus", "")
    duration = form.get("CallDuration")

    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE voice_calls
            SET status = $1,
                duration_seconds = $2,
                ended_at = CASE WHEN $1 IN ('completed', 'failed', 'no-answer', 'busy') THEN NOW() ELSE ended_at END
            WHERE twilio_call_sid = $3
            """,
            status, int(duration) if duration else None, call_sid,
        )

    return {"ok": True}


@router.post("/bland-webhook")
async def handle_bland_webhook(payload: dict):
    """Bland.ai event webhook"""
    event = payload.get("event")
    bland_call_id = payload.get("call_id", "")

    pool = get_pool()

    if event == "call_ended":
        duration = payload.get("duration", 0)
        cost = payload.get("cost", 0.0)
        transcript_text = payload.get("transcript", "")
        language = detect_language(transcript_text) if transcript_text else "en"

        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE voice_calls
                SET status = 'completed',
                    duration_seconds = $1,
                    cost_usd = $2,
                    language_detected = $3,
                    bland_call_id = $4,
                    ended_at = NOW()
                WHERE bland_call_id = $4 OR (bland_call_id IS NULL AND status = 'ringing')
                """,
                duration, float(cost), language, bland_call_id,
            )

        # Save transcript
        if transcript_text and bland_call_id:
            await transcript_service.save_transcript(
                call_id=bland_call_id,
                bland_call_id=bland_call_id,
                transcript_data=payload,
            )

        # Handle escalation disposition
        if payload.get("disposition") in ("escalated", "transferred"):
            async with pool.acquire() as conn:
                call = await conn.fetchrow(
                    "SELECT id, conversation_id FROM voice_calls WHERE bland_call_id = $1",
                    bland_call_id,
                )
                if call and call["conversation_id"]:
                    await conn.execute(
                        "UPDATE voice_calls SET escalated = TRUE WHERE id = $1",
                        call["id"],
                    )
                    await conn.execute(
                        "INSERT INTO escalation_queue (conversation_id, reason) VALUES ($1, $2)",
                        call["conversation_id"], "Voice call escalated via Bland.ai",
                    )

    return {"received": True}


@router.post("/escalate", response_model=EscalationResponse)
async def escalate_call(request: EscalationRequest):
    """Manually escalate a call to human agent queue"""
    pool = get_pool()
    async with pool.acquire() as conn:
        call = await conn.fetchrow(
            "SELECT id, conversation_id FROM voice_calls WHERE twilio_call_sid = $1",
            request.call_sid,
        )
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")

        await conn.execute(
            "UPDATE voice_calls SET escalated = TRUE, escalation_reason = $1 WHERE id = $2",
            request.reason, call["id"],
        )

        if call["conversation_id"]:
            await conn.execute(
                "INSERT INTO escalation_queue (conversation_id, priority, reason) VALUES ($1, $2, $3)",
                call["conversation_id"], request.priority, request.reason,
            )

        queue_pos = await conn.fetchval(
            "SELECT COUNT(*) FROM escalation_queue WHERE status = 'pending'"
        )

    return EscalationResponse(
        escalated=True,
        queue_position=int(queue_pos),
        estimated_wait_minutes=max(1, int(queue_pos) * 2),
    )


@router.get("/transcripts/analytics/summary")
async def get_transcript_analytics(period: str = Query("7d")):
    days = int(period.replace("d", "")) if "d" in period else 7
    return await transcript_service.get_analytics_summary(period_days=days)


@router.get("/transcripts/search")
async def search_transcripts(
    query: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    caller_number: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
):
    from_dt = datetime.fromisoformat(from_date) if from_date else None
    return await transcript_service.search_transcripts(
        query=query or "",
        from_date=from_dt,
        caller_number=caller_number,
        sentiment=sentiment,
        limit=limit,
        offset=offset,
    )


@router.get("/transcripts/caller/{phone_number}")
async def get_caller_history(phone_number: str, limit: int = Query(10, le=50)):
    return await transcript_service.get_caller_history(phone_number, limit=limit)


@router.get("/transcripts/{call_id}")
async def get_transcript(call_id: str):
    result = await transcript_service.get_transcript(call_id)
    if not result:
        raise HTTPException(status_code=404, detail="Transcript not found")
    return result


@router.post("/transcripts/{call_id}/export")
async def export_transcript(call_id: str, payload: dict):
    fmt = payload.get("format", "txt")
    include_analytics = payload.get("include_analytics", True)
    include_recording = payload.get("include_recording_link", True)

    result = await transcript_service.export_transcript(
        call_id=call_id,
        format=fmt,
        include_analytics=include_analytics,
        include_recording_link=include_recording,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
