from typing import Optional, Tuple

ESCALATION_TRIGGERS = [
    "cancel", "cancellation", "refund", "money back", "date change",
    "upgrade", "complaint", "supervisor", "manager", "lawyer", "sue",
    "lost luggage", "stranded", "emergency", "medical", "wheelchair now",
    "unacceptable", "terrible service",
]

URGENT_TRIGGERS = ["emergency", "medical", "stranded", "child", "missing"]


def should_escalate(message: str, ai_confidence: float = 1.0, threshold: float = 0.7) -> Tuple[bool, Optional[str]]:
    ml = message.lower()

    for trigger in ESCALATION_TRIGGERS:
        if trigger in ml:
            is_urgent = any(u in ml for u in URGENT_TRIGGERS)
            priority = "urgent" if is_urgent else "high"
            return True, f"{trigger} — priority: {priority}"

    if ai_confidence < threshold:
        return True, f"Low AI confidence ({ai_confidence:.0%})"

    return False, None


def get_priority(reason: str) -> str:
    if not reason:
        return "normal"
    rl = reason.lower()
    if any(u in rl for u in URGENT_TRIGGERS):
        return "urgent"
    if any(h in rl for h in ["cancel", "refund", "complaint", "date change"]):
        return "high"
    return "normal"
