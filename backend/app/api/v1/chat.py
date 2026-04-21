import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app.core.database import get_pool
from app.models.conversation import (
    ChatRequest, ChatResponse, ConversationDetail, Language
)
from app.services.ai_service import SSRAIService
from app.utils.language import detect_language
from app.utils.escalation import should_escalate, get_priority

router = APIRouter()
ai_service = SSRAIService()


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    pool = get_pool()
    detected_lang = detect_language(request.message)
    language = request.language.value if request.language else detected_lang

    async with pool.acquire() as conn:
        # Get or create conversation
        if request.conversation_id:
            conv = await conn.fetchrow(
                "SELECT id, language FROM conversations WHERE id = $1",
                request.conversation_id,
            )
            if not conv:
                raise HTTPException(status_code=404, detail="Conversation not found")
            conv_id = str(conv["id"])
        else:
            row = await conn.fetchrow(
                """
                INSERT INTO conversations (channel, language, passenger_phone, passenger_email)
                VALUES ($1, $2, $3, $4)
                RETURNING id
                """,
                request.channel.value,
                language,
                request.passenger_context.phone if request.passenger_context else None,
                request.passenger_context.email if request.passenger_context else None,
            )
            conv_id = str(row["id"])

        # Fetch conversation history
        history = await conn.fetch(
            """
            SELECT role, content FROM messages
            WHERE conversation_id = $1
            ORDER BY created_at
            LIMIT 20
            """,
            conv_id,
        )

    messages = [{"role": r["role"], "content": r["content"]} for r in history]
    messages.append({"role": "user", "content": request.message})

    context = {}
    if request.passenger_context:
        context["phone"] = request.passenger_context.phone

    ai_result = await ai_service.generate_response(
        messages=messages,
        language=language,
        context=context,
    )

    escalated, esc_reason = should_escalate(
        request.message, ai_confidence=1.0
    )
    if ai_result.get("escalation_needed"):
        escalated = True
        esc_reason = ai_result.get("escalation_reason") or esc_reason

    async with pool.acquire() as conn:
        # Save user message
        await conn.execute(
            "INSERT INTO messages (conversation_id, role, content, language) VALUES ($1, $2, $3, $4)",
            conv_id, "user", request.message, language,
        )
        # Save assistant message
        await conn.execute(
            "INSERT INTO messages (conversation_id, role, content, language, tokens_used) VALUES ($1, $2, $3, $4, $5)",
            conv_id, "assistant", ai_result["response"], language, ai_result["tokens_used"],
        )

        if escalated:
            await conn.execute(
                "UPDATE conversations SET status = 'escalated' WHERE id = $1", conv_id
            )
            priority = get_priority(esc_reason or "")
            await conn.execute(
                "INSERT INTO escalation_queue (conversation_id, priority, reason) VALUES ($1, $2, $3)",
                conv_id, priority, esc_reason,
            )

    return ChatResponse(
        conversation_id=conv_id,
        response=ai_result["response"],
        suggestions=ai_result.get("suggestions", []),
        language=Language(language),
        escalated=escalated,
        escalation_reason=esc_reason,
        intent=ai_result.get("intent"),
        tokens_used=ai_result.get("tokens_used", 0),
    )


@router.get("/conversation/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str):
    pool = get_pool()
    async with pool.acquire() as conn:
        conv = await conn.fetchrow(
            "SELECT * FROM conversations WHERE id = $1", conversation_id
        )
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        msgs = await conn.fetch(
            "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at",
            conversation_id,
        )

    return ConversationDetail(
        id=str(conv["id"]),
        channel=conv["channel"],
        language=conv["language"],
        status=conv["status"],
        created_at=conv["created_at"],
        updated_at=conv["updated_at"],
        messages=[
            {
                "id": str(m["id"]),
                "role": m["role"],
                "content": m["content"],
                "language": m["language"],
                "created_at": m["created_at"],
                "tokens_used": m["tokens_used"],
            }
            for m in msgs
        ],
    )


@router.get("/history")
async def get_history(
    phone: Optional[str] = Query(None),
    limit: int = Query(10, le=50),
):
    pool = get_pool()
    async with pool.acquire() as conn:
        if phone:
            rows = await conn.fetch(
                """
                SELECT id, created_at, status, channel
                FROM conversations
                WHERE passenger_phone = $1
                ORDER BY created_at DESC
                LIMIT $2
                """,
                phone, limit,
            )
        else:
            rows = await conn.fetch(
                """
                SELECT id, created_at, status, channel
                FROM conversations
                ORDER BY created_at DESC
                LIMIT $1
                """,
                limit,
            )

    return {
        "conversations": [
            {"id": str(r["id"]), "created_at": r["created_at"].isoformat(), "status": r["status"], "channel": r["channel"]}
            for r in rows
        ]
    }
