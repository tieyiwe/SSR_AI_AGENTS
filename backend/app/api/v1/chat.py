import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.conversation import (
    ChatRequest, ChatResponse, ConversationDetail, Language, Message, MessageRole,
    ConversationStatus, Channel,
)
from app.services.ai_service import SSRAIService
from app.utils.language import detect_language
from app.utils.escalation import should_escalate, get_priority

router = APIRouter()
ai_service = SSRAIService()

# ── In-memory fallback store (used when DATABASE_URL is not set) ─────────────

_mem_conversations: dict = {}   # conv_id -> {meta, messages[]}


def _is_db_available() -> bool:
    try:
        from app.core.database import get_pool
        get_pool()
        return True
    except RuntimeError:
        return False


# ── Memory-backed helpers ─────────────────────────────────────────────────────

def _mem_get_or_create(conv_id: Optional[str], channel: str, language: str,
                        phone: Optional[str], email: Optional[str]) -> str:
    if conv_id and conv_id in _mem_conversations:
        return conv_id
    new_id = str(uuid.uuid4())
    _mem_conversations[new_id] = {
        "id": new_id, "channel": channel, "language": language,
        "passenger_phone": phone, "passenger_email": email,
        "status": "active", "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "messages": [],
    }
    return new_id


def _mem_get_history(conv_id: str) -> list:
    conv = _mem_conversations.get(conv_id, {})
    return conv.get("messages", [])[-20:]


def _mem_add_messages(conv_id: str, user_text: str, assistant_text: str,
                       language: str, tokens: int):
    conv = _mem_conversations.setdefault(conv_id, {"messages": []})
    ts = datetime.now(timezone.utc).isoformat()
    conv["messages"].append({"role": "user", "content": user_text, "created_at": ts})
    conv["messages"].append({"role": "assistant", "content": assistant_text,
                              "created_at": ts, "tokens_used": tokens})


def _mem_escalate(conv_id: str):
    if conv_id in _mem_conversations:
        _mem_conversations[conv_id]["status"] = "escalated"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    detected_lang = detect_language(request.message)
    language = request.language.value if request.language else detected_lang

    db_ok = _is_db_available()
    phone = request.passenger_context.phone if request.passenger_context else None
    email = request.passenger_context.email if request.passenger_context else None

    if db_ok:
        from app.core.database import get_pool
        pool = get_pool()
        async with pool.acquire() as conn:
            if request.conversation_id:
                conv = await conn.fetchrow(
                    "SELECT id FROM conversations WHERE id = $1",
                    request.conversation_id,
                )
                if not conv:
                    raise HTTPException(status_code=404, detail="Conversation not found")
                conv_id = str(conv["id"])
            else:
                row = await conn.fetchrow(
                    "INSERT INTO conversations (channel, language, passenger_phone, passenger_email)"
                    " VALUES ($1, $2, $3, $4) RETURNING id",
                    request.channel.value, language, phone, email,
                )
                conv_id = str(row["id"])

            history = await conn.fetch(
                "SELECT role, content FROM messages WHERE conversation_id = $1"
                " ORDER BY created_at LIMIT 20",
                conv_id,
            )
        messages = [{"role": r["role"], "content": r["content"]} for r in history]
    else:
        conv_id = _mem_get_or_create(
            request.conversation_id, request.channel.value, language, phone, email
        )
        history = _mem_get_history(conv_id)
        messages = [{"role": m["role"], "content": m["content"]} for m in history]

    messages.append({"role": "user", "content": request.message})
    ai_result = await ai_service.generate_response(messages=messages, language=language)

    escalated, esc_reason = should_escalate(request.message)
    if ai_result.get("escalation_needed"):
        escalated = True
        esc_reason = ai_result.get("escalation_reason") or esc_reason

    if db_ok:
        from app.core.database import get_pool
        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO messages (conversation_id, role, content, language) VALUES ($1,'user',$2,$3)",
                conv_id, request.message, language,
            )
            await conn.execute(
                "INSERT INTO messages (conversation_id, role, content, language, tokens_used)"
                " VALUES ($1,'assistant',$2,$3,$4)",
                conv_id, ai_result["response"], language, ai_result["tokens_used"],
            )
            if escalated:
                await conn.execute(
                    "UPDATE conversations SET status='escalated' WHERE id=$1", conv_id
                )
                priority = get_priority(esc_reason or "")
                await conn.execute(
                    "INSERT INTO escalation_queue (conversation_id, priority, reason) VALUES ($1,$2,$3)",
                    conv_id, priority, esc_reason,
                )
    else:
        _mem_add_messages(conv_id, request.message, ai_result["response"],
                          language, ai_result["tokens_used"])
        if escalated:
            _mem_escalate(conv_id)

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
    if _is_db_available():
        from app.core.database import get_pool
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
            id=str(conv["id"]), channel=conv["channel"], language=conv["language"],
            status=conv["status"], created_at=conv["created_at"], updated_at=conv["updated_at"],
            messages=[
                Message(id=str(m["id"]), role=MessageRole(m["role"]), content=m["content"],
                        language=m["language"], created_at=m["created_at"],
                        tokens_used=m["tokens_used"])
                for m in msgs
            ],
        )

    conv = _mem_conversations.get(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    now = datetime.now(timezone.utc)
    return ConversationDetail(
        id=conv["id"], channel=Channel(conv["channel"]), language=Language(conv["language"]),
        status=ConversationStatus(conv["status"]),
        created_at=now, updated_at=now,
        messages=[
            Message(id=str(i), role=MessageRole(m["role"]), content=m["content"],
                    created_at=now, tokens_used=m.get("tokens_used"))
            for i, m in enumerate(conv["messages"])
        ],
    )


@router.get("/history")
async def get_history(
    phone: Optional[str] = Query(None),
    limit: int = Query(10, le=50),
):
    if _is_db_available():
        from app.core.database import get_pool
        pool = get_pool()
        async with pool.acquire() as conn:
            if phone:
                rows = await conn.fetch(
                    "SELECT id, created_at, status, channel FROM conversations"
                    " WHERE passenger_phone=$1 ORDER BY created_at DESC LIMIT $2",
                    phone, limit,
                )
            else:
                rows = await conn.fetch(
                    "SELECT id, created_at, status, channel FROM conversations"
                    " ORDER BY created_at DESC LIMIT $1",
                    limit,
                )
        return {
            "conversations": [
                {"id": str(r["id"]), "created_at": r["created_at"].isoformat(),
                 "status": r["status"], "channel": r["channel"]}
                for r in rows
            ]
        }

    convs = list(_mem_conversations.values())
    if phone:
        convs = [c for c in convs if c.get("passenger_phone") == phone]
    convs = convs[-limit:]
    return {
        "conversations": [
            {"id": c["id"], "created_at": c["created_at"],
             "status": c["status"], "channel": c["channel"]}
            for c in convs
        ]
    }
