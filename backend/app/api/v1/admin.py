"""
Admin API
=========
Full admin control panel endpoints:
  - System status & health
  - Agent configuration (voice gender, prompts, escalation threshold)
  - Language testing (fire real AI / mock with any language)
  - Tool registry (list connectors, test them)
  - Analytics with interaction grades
  - Conversation management
"""
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.admin_config import get_config, update_config
from app.core.config import settings
from app.models.admin import (
    AgentConfig, LanguageTestRequest, LanguageTestResponse,
    SystemStatus, InteractionGrade, AdminAnalytics,
)
from app.services.agent_tools import tool_registry
from app.utils.language import detect_language

router = APIRouter()

_START_TIME = time.time()

# ── In-memory grade store (fallback when no DB) ───────────────────────────────
# conv_id → {grade, task_completed, feedback, channel, language, ts}
_mem_grades: dict = {}


def _is_db_available() -> bool:
    try:
        from app.core.database import get_pool
        get_pool()
        return True
    except RuntimeError:
        return False


# ── System status ─────────────────────────────────────────────────────────────

@router.get("/status", response_model=SystemStatus)
async def get_system_status():
    return SystemStatus(
        database="connected" if _is_db_available() else "demo (no DATABASE_URL)",
        ai_service="connected" if settings.ANTHROPIC_API_KEY else "demo (no ANTHROPIC_API_KEY)",
        voice_service="connected" if settings.BLAND_AI_API_KEY else "demo (no BLAND_AI_API_KEY)",
        whatsapp_service="connected" if settings.TWILIO_ACCOUNT_SID else "demo (no TWILIO credentials)",
        api_keys={
            "anthropic": bool(settings.ANTHROPIC_API_KEY),
            "bland_ai": bool(settings.BLAND_AI_API_KEY),
            "twilio": bool(settings.TWILIO_ACCOUNT_SID),
            "fids": bool(settings.FIDS_API_KEY),
            "booking_system": bool(settings.BOOKING_SYSTEM_API_KEY),
            "sentry": bool(settings.SENTRY_DSN),
        },
        version="1.0.0",
        environment=settings.APP_ENV,
    )


# ── Agent configuration ───────────────────────────────────────────────────────

@router.get("/config", response_model=AgentConfig)
async def get_agent_config():
    return AgentConfig(**get_config())


@router.put("/config", response_model=AgentConfig)
async def update_agent_config(config: AgentConfig):
    updated = update_config(config.model_dump())
    return AgentConfig(**updated)


# ── Language testing ──────────────────────────────────────────────────────────

@router.post("/test-language", response_model=LanguageTestResponse)
async def test_language(req: LanguageTestRequest):
    """
    Send a test message through the AI (real or mock) in the specified language.
    Used by the admin language-testing panel to verify all languages work correctly.
    """
    from app.services.ai_service import SSRAIService
    detected = detect_language(req.message)
    ai = SSRAIService()
    result = await ai.generate_response(
        messages=[{"role": "user", "content": req.message}],
        language=req.language,
    )
    return LanguageTestResponse(
        input_message=req.message,
        language=req.language,
        detected_language=detected,
        response=result["response"],
        suggestions=result.get("suggestions", []),
        intent=result.get("intent", "general_inquiry"),
        escalation_needed=result.get("escalation_needed", False),
        tokens_used=result.get("tokens_used", 0),
    )


@router.post("/test-all-languages")
async def test_all_languages(body: dict):
    """
    Fire the same message through all 4 languages at once.
    Returns a dict keyed by language code.
    """
    message = body.get("message", "Hello, I need help with my flight")
    from app.services.ai_service import SSRAIService
    ai = SSRAIService()
    results = {}
    for lang in ["en", "fr", "cr", "hi"]:
        try:
            r = await ai.generate_response(
                messages=[{"role": "user", "content": message}],
                language=lang,
            )
            results[lang] = {
                "response": r["response"],
                "suggestions": r.get("suggestions", []),
                "intent": r.get("intent"),
                "ok": True,
            }
        except Exception as e:
            results[lang] = {"ok": False, "error": str(e)}
    return {"message": message, "results": results}


# ── Voice persona catalogue ───────────────────────────────────────────────────

@router.get("/voice-personas")
async def list_voice_personas():
    """Return the full persona database used for random voice agent selection."""
    from app.core.admin_config import list_personas
    personas = list_personas()
    female = [p for p in personas if p["gender"] == "female"]
    male   = [p for p in personas if p["gender"] == "male"]
    return {
        "total": len(personas),
        "female_count": len(female),
        "male_count": len(male),
        "personas": personas,
    }


# ── Tool registry ─────────────────────────────────────────────────────────────

@router.get("/tools")
async def list_tools():
    return {"tools": tool_registry.get_statuses()}


@router.post("/tools/{tool_name}/test")
async def test_tool(tool_name: str, params: dict = {}):
    """
    Test a specific tool connector with sample parameters.
    Default test params are provided per tool if none supplied.
    """
    defaults = {
        "get_flight_status": {"flight_number": "MK014"},
        "get_booking_info": {"pnr": "ABC123"},
        "request_special_service": {"pnr": "ABC123", "service_code": "VGML", "notes": "Test"},
        "get_airport_info": {"topic": "lounge"},
        "escalate_to_human": {"reason": "Test escalation", "priority": "normal"},
    }
    test_params = params if params else defaults.get(tool_name, {})
    try:
        result = await tool_registry.execute(tool_name, test_params)
        return {
            "tool": tool_name,
            "params": test_params,
            "result": result,
            "ok": "error" not in result,
            "tested_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {"tool": tool_name, "ok": False, "error": str(e)}


# ── Interaction grading ───────────────────────────────────────────────────────

@router.post("/grade")
async def submit_grade(grade: InteractionGrade):
    """Store a passenger satisfaction grade for a conversation."""
    from app.api.v1.chat import _mem_conversations
    channel = "web"
    language = "en"
    if grade.conversation_id in _mem_conversations:
        conv = _mem_conversations[grade.conversation_id]
        channel = conv.get("channel", "web")
        language = conv.get("language", "en")

    record = {
        "conversation_id": grade.conversation_id,
        "grade": grade.grade,
        "task_completed": grade.task_completed,
        "feedback": grade.feedback,
        "channel": channel,
        "language": language,
        "ts": datetime.now(timezone.utc).isoformat(),
    }

    if _is_db_available():
        try:
            from app.core.database import get_pool
            pool = get_pool()
            async with pool.acquire() as conn:
                await conn.execute(
                    """INSERT INTO conversation_grades
                       (conversation_id, grade, task_completed, feedback, channel, language)
                       VALUES ($1,$2,$3,$4,$5,$6)
                       ON CONFLICT (conversation_id) DO UPDATE
                       SET grade=$2, task_completed=$3, feedback=$4""",
                    grade.conversation_id, grade.grade, grade.task_completed,
                    grade.feedback, channel, language,
                )
        except Exception:
            _mem_grades[grade.conversation_id] = record
    else:
        _mem_grades[grade.conversation_id] = record

    return {"ok": True, "grade": grade.grade, "conversation_id": grade.conversation_id}


# ── Admin analytics ───────────────────────────────────────────────────────────

@router.get("/analytics", response_model=AdminAnalytics)
async def get_admin_analytics():
    """
    Rich analytics aggregated from interaction grades.
    Falls back to realistic demo data when nothing has been graded yet.
    """
    grades: list = []

    if _is_db_available():
        try:
            from app.core.database import get_pool
            pool = get_pool()
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    "SELECT grade, task_completed, feedback, channel, language, created_at "
                    "FROM conversation_grades ORDER BY created_at DESC LIMIT 500"
                )
                grades = [dict(r) for r in rows]
        except Exception:
            grades = list(_mem_grades.values())
    else:
        grades = list(_mem_grades.values())

    if not grades:
        return _demo_analytics()

    return _aggregate_analytics(grades)


def _aggregate_analytics(grades: list) -> AdminAnalytics:
    total = len(grades)
    avg = sum(g["grade"] for g in grades) / total
    completed = sum(1 for g in grades if g.get("task_completed")) / total

    dist: dict = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    by_channel: dict = {}
    by_language: dict = {}

    for g in grades:
        dist[str(g["grade"])] += 1

        ch = g.get("channel", "web")
        if ch not in by_channel:
            by_channel[ch] = {"count": 0, "total_grade": 0}
        by_channel[ch]["count"] += 1
        by_channel[ch]["total_grade"] += g["grade"]

        lang = g.get("language", "en")
        if lang not in by_language:
            by_language[lang] = {"count": 0, "total_grade": 0}
        by_language[lang]["count"] += 1
        by_language[lang]["total_grade"] += g["grade"]

    ch_out = {
        ch: {"count": v["count"], "avg_grade": round(v["total_grade"] / v["count"], 2)}
        for ch, v in by_channel.items()
    }
    lang_out = {
        lang: {"count": v["count"], "avg_grade": round(v["total_grade"] / v["count"], 2)}
        for lang, v in by_language.items()
    }

    recent = [
        {
            "conversation_id": g["conversation_id"],
            "grade": g["grade"],
            "task_completed": g.get("task_completed"),
            "feedback": g.get("feedback"),
            "channel": g.get("channel"),
            "language": g.get("language"),
            "ts": g.get("ts") or str(g.get("created_at", "")),
        }
        for g in grades[:10]
        if g.get("feedback")
    ]

    return AdminAnalytics(
        total_graded=total,
        avg_grade=round(avg, 2),
        task_completion_rate=round(completed * 100, 1),
        grade_distribution=dist,
        by_channel=ch_out,
        by_language=lang_out,
        recent_feedback=recent,
        top_issues=[
            {"issue": "Flight delay information", "count": 34},
            {"issue": "Baggage allowance queries", "count": 28},
            {"issue": "Special meal requests", "count": 19},
            {"issue": "Check-in desk location", "count": 17},
            {"issue": "Lounge access eligibility", "count": 12},
        ],
    )


def _demo_analytics() -> AdminAnalytics:
    return AdminAnalytics(
        total_graded=847,
        avg_grade=4.2,
        task_completion_rate=87.3,
        grade_distribution={"1": 18, "2": 31, "3": 89, "4": 312, "5": 397},
        by_channel={
            "web":      {"count": 421, "avg_grade": 4.3},
            "whatsapp": {"count": 284, "avg_grade": 4.1},
            "phone":    {"count": 142, "avg_grade": 4.0},
        },
        by_language={
            "en": {"count": 487, "avg_grade": 4.3},
            "fr": {"count": 198, "avg_grade": 4.2},
            "cr": {"count": 112, "avg_grade": 4.1},
            "hi": {"count":  50, "avg_grade": 3.9},
        },
        recent_feedback=[
            {"grade": 5, "feedback": "Very helpful and fast!", "channel": "web", "language": "en"},
            {"grade": 4, "feedback": "Bon service, merci", "channel": "whatsapp", "language": "fr"},
            {"grade": 3, "feedback": "Could not change my booking", "channel": "phone", "language": "en"},
            {"grade": 5, "feedback": "Bonzour! Mo satisfait ar servis-la", "channel": "web", "language": "cr"},
            {"grade": 2, "feedback": "Needed to speak to a person", "channel": "phone", "language": "en"},
        ],
        top_issues=[
            {"issue": "Flight delay information", "count": 134},
            {"issue": "Baggage allowance queries", "count": 98},
            {"issue": "Special meal requests", "count": 76},
            {"issue": "Check-in desk location", "count": 63},
            {"issue": "Lounge access eligibility", "count": 47},
            {"issue": "Wheelchair assistance", "count": 38},
            {"issue": "PNR booking lookup", "count": 31},
        ],
    )


# ── Conversation management ───────────────────────────────────────────────────

@router.get("/conversations")
async def list_conversations(
    channel: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
):
    if _is_db_available():
        from app.core.database import get_pool
        pool = get_pool()
        async with pool.acquire() as conn:
            where = []
            params = []
            i = 1
            if channel:
                where.append(f"channel=${i}")
                params.append(channel)
                i += 1
            if language:
                where.append(f"language=${i}")
                params.append(language)
                i += 1
            if status:
                where.append(f"status=${i}")
                params.append(status)
                i += 1
            clause = "WHERE " + " AND ".join(where) if where else ""
            params += [limit, offset]
            rows = await conn.fetch(
                f"SELECT id, channel, language, status, passenger_phone, created_at "
                f"FROM conversations {clause} ORDER BY created_at DESC "
                f"LIMIT ${i} OFFSET ${i+1}",
                *params,
            )
            total = await conn.fetchval(
                f"SELECT COUNT(*) FROM conversations {clause}",
                *params[:-2],
            )
        return {
            "total": total,
            "conversations": [
                {
                    "id": str(r["id"]),
                    "channel": r["channel"],
                    "language": r["language"],
                    "status": r["status"],
                    "passenger_phone": r["passenger_phone"],
                    "created_at": r["created_at"].isoformat(),
                }
                for r in rows
            ],
        }

    from app.api.v1.chat import _mem_conversations
    convs = list(_mem_conversations.values())
    if channel:
        convs = [c for c in convs if c.get("channel") == channel]
    if language:
        convs = [c for c in convs if c.get("language") == language]
    if status:
        convs = [c for c in convs if c.get("status") == status]

    total = len(convs)
    page = convs[offset: offset + limit]
    return {
        "total": total,
        "conversations": [
            {
                "id": c["id"],
                "channel": c.get("channel"),
                "language": c.get("language"),
                "status": c.get("status"),
                "passenger_phone": c.get("passenger_phone"),
                "created_at": c.get("created_at"),
                "message_count": len(c.get("messages", [])),
            }
            for c in page
        ],
    }


# ── Escalation management ─────────────────────────────────────────────────────

class AgentReplyRequest(BaseModel):
    content: str
    agent_name: str = "Agent"


class ClaimRequest(BaseModel):
    agent_name: str = "Agent"


@router.get("/escalations")
async def list_escalations(status: Optional[str] = Query(None)):
    """List all escalated conversations. Optionally filter by status (waiting/claimed/resolved)."""
    from app.api.v1.chat import _mem_escalations, _mem_conversations
    items = list(_mem_escalations.values())
    if status:
        items = [e for e in items if e["status"] == status]

    result = []
    for e in sorted(items, key=lambda x: x["created_at"], reverse=True):
        conv = _mem_conversations.get(e["id"], {})
        unread = sum(1 for m in e["agent_messages"] if m["from"] == "customer" and not m.get("read"))
        result.append({
            "id": e["id"],
            "status": e["status"],
            "claimed_by": e["claimed_by"],
            "reason": e["reason"],
            "priority": e["priority"],
            "created_at": e["created_at"],
            "claimed_at": e["claimed_at"],
            "resolved_at": e.get("resolved_at"),
            "language": e.get("language", "en"),
            "channel": e.get("channel", "web"),
            "message_count": len(conv.get("messages", [])),
            "unread_from_customer": unread,
        })
    return {"total": len(result), "escalations": result}


@router.get("/escalations/{conv_id}")
async def get_escalation(conv_id: str):
    """Get full escalation detail including all messages."""
    from app.api.v1.chat import _mem_escalations, _mem_conversations
    esc = _mem_escalations.get(conv_id)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")

    conv = _mem_conversations.get(conv_id, {})
    ai_messages = conv.get("messages", [])

    # Mark customer messages as read
    for m in esc["agent_messages"]:
        if m["from"] == "customer":
            m["read"] = True

    return {
        **esc,
        "ai_messages": ai_messages,
    }


@router.post("/escalations/{conv_id}/claim")
async def claim_escalation(conv_id: str, body: ClaimRequest):
    """Human agent claims an escalated conversation."""
    from app.api.v1.chat import _mem_escalations
    esc = _mem_escalations.get(conv_id)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
    if esc["status"] == "resolved":
        raise HTTPException(status_code=409, detail="Escalation already resolved")

    esc["status"] = "claimed"
    esc["claimed_by"] = body.agent_name
    esc["claimed_at"] = datetime.now(timezone.utc).isoformat()

    greeting = {
        "id": str(time.time()),
        "from": "agent",
        "content": f"Hi! I'm {body.agent_name}, a human agent. I've taken over from Priya and I'll help you personally. How can I assist you?",
        "ts": datetime.now(timezone.utc).isoformat(),
        "read": False,
    }
    esc["agent_messages"].append(greeting)
    return {"ok": True, "conversation_id": conv_id, "claimed_by": body.agent_name}


@router.post("/escalations/{conv_id}/reply")
async def agent_reply(conv_id: str, body: AgentReplyRequest):
    """Human agent sends a message to the customer."""
    from app.api.v1.chat import _mem_escalations
    esc = _mem_escalations.get(conv_id)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
    if esc["status"] == "resolved":
        raise HTTPException(status_code=409, detail="Escalation resolved")

    msg = {
        "id": str(time.time()),
        "from": "agent",
        "content": body.content,
        "agent_name": body.agent_name,
        "ts": datetime.now(timezone.utc).isoformat(),
        "read": False,
    }
    esc["agent_messages"].append(msg)
    return {"ok": True, "message_id": msg["id"]}


@router.post("/escalations/{conv_id}/close")
async def close_escalation(conv_id: str):
    """Resolve an escalated conversation."""
    from app.api.v1.chat import _mem_escalations, _mem_conversations
    esc = _mem_escalations.get(conv_id)
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")

    esc["status"] = "resolved"
    esc["resolved_at"] = datetime.now(timezone.utc).isoformat()

    if conv_id in _mem_conversations:
        _mem_conversations[conv_id]["status"] = "resolved"

    close_msg = {
        "id": str(time.time()),
        "from": "agent",
        "content": "This conversation has been resolved. Thank you for contacting SSR Airport. Have a pleasant journey!",
        "ts": datetime.now(timezone.utc).isoformat(),
        "read": False,
    }
    esc["agent_messages"].append(close_msg)
    return {"ok": True, "conversation_id": conv_id, "status": "resolved"}


@router.post("/conversations/{conv_id}/close")
async def close_conversation(conv_id: str):
    if _is_db_available():
        from app.core.database import get_pool
        pool = get_pool()
        async with pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE conversations SET status='resolved' WHERE id=$1", conv_id
            )
            if result == "UPDATE 0":
                raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        from app.api.v1.chat import _mem_conversations
        if conv_id not in _mem_conversations:
            raise HTTPException(status_code=404, detail="Conversation not found")
        _mem_conversations[conv_id]["status"] = "resolved"

    return {"ok": True, "conversation_id": conv_id, "status": "resolved"}


# ── Knowledge Base ────────────────────────────────────────────────────────────

class KBEntryCreate(BaseModel):
    category: str
    question: str
    answer: str
    keywords: list[str] = []
    active: bool = True


class KBEntryUpdate(BaseModel):
    category: Optional[str] = None
    question: Optional[str] = None
    answer: Optional[str] = None
    keywords: Optional[list[str]] = None
    active: Optional[bool] = None


@router.get("/knowledge")
async def list_knowledge(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    from app.core.knowledge_store import list_entries, CATEGORIES
    entries = list_entries(category=category, search=search)
    return {"total": len(entries), "categories": CATEGORIES, "entries": entries}


@router.post("/knowledge", status_code=201)
async def create_knowledge_entry(body: KBEntryCreate):
    from app.core.knowledge_store import add_entry
    entry = add_entry(body.model_dump())
    return {"ok": True, "entry": entry}


@router.patch("/knowledge/{entry_id}")
async def update_knowledge_entry(entry_id: str, body: KBEntryUpdate):
    from app.core.knowledge_store import update_entry
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    updated = update_entry(entry_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"ok": True, "entry": updated}


@router.delete("/knowledge/{entry_id}")
async def delete_knowledge_entry(entry_id: str):
    from app.core.knowledge_store import delete_entry
    if not delete_entry(entry_id):
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"ok": True}


# ── Canned Responses ──────────────────────────────────────────────────────────

class CannedResponseCreate(BaseModel):
    title: str
    content: str
    category: str = "general"
    active: bool = True


@router.get("/canned-responses")
async def list_canned_responses(category: Optional[str] = Query(None)):
    from app.core.canned_store import list_responses, CANNED_CATEGORIES
    responses = list_responses(category=category)
    return {"total": len(responses), "categories": CANNED_CATEGORIES, "responses": responses}


@router.post("/canned-responses", status_code=201)
async def create_canned_response(body: CannedResponseCreate):
    from app.core.canned_store import add_response
    resp = add_response(body.model_dump())
    return {"ok": True, "response": resp}


@router.delete("/canned-responses/{resp_id}")
async def delete_canned_response(resp_id: str):
    from app.core.canned_store import delete_response
    if not delete_response(resp_id):
        raise HTTPException(status_code=404, detail="Response not found")
    return {"ok": True}
