from fastapi import APIRouter, Request
from fastapi.responses import Response

from app.core.database import get_pool
from app.services.ai_service import SSRAIService
from app.services.whatsapp_service import WhatsAppService
from app.utils.language import detect_language

router = APIRouter()
ai_service = SSRAIService()
wa_service = WhatsAppService()


@router.post("/incoming")
async def handle_incoming_whatsapp(request: Request):
    """Twilio WhatsApp webhook"""
    form = await request.form()
    parsed = wa_service.parse_incoming(dict(form))

    from_number = parsed["from_number"]
    message_body = parsed["body"]
    language = detect_language(message_body)

    pool = get_pool()

    # Get or create conversation for this WhatsApp number
    async with pool.acquire() as conn:
        conv = await conn.fetchrow(
            """
            SELECT id FROM conversations
            WHERE channel = 'whatsapp' AND passenger_phone = $1
              AND status = 'active'
            ORDER BY created_at DESC
            LIMIT 1
            """,
            from_number,
        )

        if conv:
            conv_id = str(conv["id"])
        else:
            row = await conn.fetchrow(
                "INSERT INTO conversations (channel, language, passenger_phone) VALUES ('whatsapp', $1, $2) RETURNING id",
                language, from_number,
            )
            conv_id = str(row["id"])

        # Fetch recent history
        history = await conn.fetch(
            """
            SELECT role, content FROM messages
            WHERE conversation_id = $1
            ORDER BY created_at DESC
            LIMIT 10
            """,
            conv_id,
        )

    messages = [{"role": r["role"], "content": r["content"]} for r in reversed(history)]
    messages.append({"role": "user", "content": message_body})

    ai_result = await ai_service.generate_response(messages=messages, language=language)

    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO messages (conversation_id, role, content, language) VALUES ($1, 'user', $2, $3)",
            conv_id, message_body, language,
        )
        await conn.execute(
            "INSERT INTO messages (conversation_id, role, content, language, tokens_used) VALUES ($1, 'assistant', $2, $3, $4)",
            conv_id, ai_result["response"], language, ai_result["tokens_used"],
        )

    if ai_result.get("escalation_needed"):
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE conversations SET status = 'escalated' WHERE id = $1", conv_id
            )
            ai_result["response"] += "\n\nI'm connecting you with our customer service team. They will follow up shortly."

    await wa_service.send_message(to_number=from_number, message=ai_result["response"])

    # Return 200 OK with empty TwiML (Twilio requires valid XML response)
    return Response(
        content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        media_type="application/xml",
    )
