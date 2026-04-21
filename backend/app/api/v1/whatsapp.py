from fastapi import APIRouter, Request
from fastapi.responses import Response

from app.core.config import settings
from app.services.ai_service import SSRAIService
from app.utils.language import detect_language

router = APIRouter()
ai_service = SSRAIService()

_OK_XML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'


def _is_db_available() -> bool:
    try:
        from app.core.database import get_pool
        get_pool()
        return True
    except RuntimeError:
        return False


@router.post("/incoming")
async def handle_incoming_whatsapp(request: Request):
    """Twilio WhatsApp webhook"""
    if not settings.TWILIO_ACCOUNT_SID:
        # WhatsApp not configured — acknowledge without processing
        return Response(content=_OK_XML, media_type="application/xml")

    form = await request.form()
    from app.services.whatsapp_service import WhatsAppService
    wa_service = WhatsAppService()
    parsed = wa_service.parse_incoming(dict(form))

    from_number = parsed["from_number"]
    message_body = parsed["body"]
    language = detect_language(message_body)

    db_ok = _is_db_available()

    if db_ok:
        from app.core.database import get_pool
        pool = get_pool()
        async with pool.acquire() as conn:
            conv = await conn.fetchrow(
                "SELECT id FROM conversations WHERE channel='whatsapp' AND passenger_phone=$1"
                " AND status='active' ORDER BY created_at DESC LIMIT 1",
                from_number,
            )
            if conv:
                conv_id = str(conv["id"])
            else:
                row = await conn.fetchrow(
                    "INSERT INTO conversations (channel, language, passenger_phone)"
                    " VALUES ('whatsapp',$1,$2) RETURNING id",
                    language, from_number,
                )
                conv_id = str(row["id"])

            history = await conn.fetch(
                "SELECT role, content FROM messages WHERE conversation_id=$1"
                " ORDER BY created_at DESC LIMIT 10",
                conv_id,
            )
        messages = [{"role": r["role"], "content": r["content"]} for r in reversed(history)]
    else:
        # No DB — stateless single-turn response
        conv_id = "no-db"
        messages = []

    messages.append({"role": "user", "content": message_body})
    ai_result = await ai_service.generate_response(messages=messages, language=language)
    reply = ai_result["response"]

    if db_ok:
        from app.core.database import get_pool
        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO messages (conversation_id, role, content, language) VALUES ($1,'user',$2,$3)",
                conv_id, message_body, language,
            )
            await conn.execute(
                "INSERT INTO messages (conversation_id, role, content, language, tokens_used)"
                " VALUES ($1,'assistant',$2,$3,$4)",
                conv_id, reply, language, ai_result["tokens_used"],
            )
        if ai_result.get("escalation_needed"):
            async with pool.acquire() as conn:
                await conn.execute(
                    "UPDATE conversations SET status='escalated' WHERE id=$1", conv_id
                )
            reply += "\n\nConnecting you with our customer service team."

    await wa_service.send_message(to_number=from_number, message=reply)
    return Response(content=_OK_XML, media_type="application/xml")
