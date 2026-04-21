import json
import re
from datetime import datetime
from typing import Dict, List, Optional
from zoneinfo import ZoneInfo

from app.core.config import settings

MAURITIUS_TZ = ZoneInfo("Indian/Mauritius")

# ── Mock flight data (mirrors fids_service.py) ───────────────────────────────

_FLIGHTS = {
    "MK014": {
        "status": "On Time", "destination": "Paris (CDG)",
        "departure": "23:50", "gate": "B5", "check_in": "Hall A, Desks 12-18",
    },
    "MK042": {
        "status": "On Time", "destination": "Singapore (SIN)",
        "departure": "01:30", "gate": "A8", "check_in": "Hall A, Desks 1-6",
    },
    "MK026": {
        "status": "Delayed (45 min)", "destination": "London (LHR)",
        "departure": "11:15 (was 10:30)", "gate": "B3", "check_in": "Hall A, Desks 7-12",
    },
    "MK010": {
        "status": "On Time", "destination": "Dubai (DXB)",
        "departure": "08:20", "gate": "A4", "check_in": "Hall A, Desks 1-6",
    },
}

_BOOKINGS = {
    "ABC123": {
        "passenger": "John Doe", "flight": "MK014",
        "date": "25 April 2026", "class": "Economy",
        "seat": "12A", "meal": "Standard", "baggage": "23 kg",
    },
    "XYZ789": {
        "passenger": "Marie Dupont", "flight": "MK026",
        "date": "22 April 2026", "class": "Business",
        "seat": "3B", "meal": "Vegetarian (VGML)", "baggage": "32 kg",
    },
}

# ── Rule-based mock response engine ──────────────────────────────────────────

def _mock_response(message: str, language: str) -> Dict:
    """
    Keyword-driven demo responses — used when ANTHROPIC_API_KEY is not set.
    Returns the same dict shape as the real AI service.
    """
    ml = message.lower()

    # Detect flight number
    flight_match = re.search(r"\b([A-Z]{2}\d{3,4})\b", message.upper())
    pnr_match = re.search(r"\b([A-Z]{3}\d{3}|[A-Z0-9]{6})\b", message.upper())

    # ── Flight status ─────────────────────────────────────────
    if flight_match and any(w in ml for w in ("flight", "depart", "status", "gate", "when", "time", "delay", "vol", "vuelo")):
        fn = flight_match.group(1)
        info = _FLIGHTS.get(fn)
        if info:
            resp = (
                f"Flight **{fn}** to {info['destination']}:\n"
                f"- Status: {info['status']}\n"
                f"- Departure: {info['departure']}\n"
                f"- Gate: {info['gate']}\n"
                f"- Check-in: {info['check_in']}\n\n"
                f"Is there anything else I can help you with?"
            )
        else:
            resp = (
                f"I couldn't find real-time data for flight {fn} right now. "
                "Please check the departure board in the terminal or visit the Air Mauritius desk."
            )
        return _build_result(resp, "flight_status", {"flight_number": fn},
                             ["Ask about gate", "Check baggage allowance"])

    # ── PNR / Booking lookup ──────────────────────────────────
    if pnr_match and any(w in ml for w in ("booking", "reservation", "pnr", "reference", "confirm", "réservation")):
        pnr = pnr_match.group(1)
        info = _BOOKINGS.get(pnr)
        if info:
            resp = (
                f"Booking **{pnr}** — {info['passenger']}:\n"
                f"- Flight: {info['flight']} on {info['date']}\n"
                f"- Class: {info['class']}, Seat {info['seat']}\n"
                f"- Meal: {info['meal']}\n"
                f"- Baggage: {info['baggage']}\n\n"
                f"Would you like to request a special service or change anything?"
            )
            suggestions = ["Request special meal", "Ask about wheelchair", "Check flight status"]
        else:
            resp = (
                f"I wasn't able to retrieve booking **{pnr}** in demo mode. "
                "Once the booking system is connected, full PNR details will appear here."
            )
            suggestions = []
        return _build_result(resp, "booking_lookup", {"pnr": pnr}, suggestions)

    # ── Meal request ──────────────────────────────────────────
    if any(w in ml for w in ("meal", "food", "vegetarian", "vegan", "halal", "kosher", "diabetic", "gluten", "repas")):
        resp = (
            "I can help with special meal requests. Here are the available codes:\n\n"
            "- **VGML** — Vegetarian\n"
            "- **VLML** — Vegan\n"
            "- **MOML** — Muslim / Halal\n"
            "- **HNML** — Hindu\n"
            "- **KSML** — Kosher\n"
            "- **DBML** — Diabetic\n"
            "- **GFML** — Gluten-free\n"
            "- **CHML** — Child meal\n\n"
            "Requests must be made **at least 24 hours before departure**. "
            "Please share your PNR reference so I can process this for you."
        )
        return _build_result(resp, "pnr_servicing", {}, ["Share my PNR", "Check my booking"])

    # ── Wheelchair / assistance ───────────────────────────────
    if any(w in ml for w in ("wheelchair", "assistance", "mobility", "disabled", "fauteuil")):
        resp = (
            "Wheelchair and mobility assistance is available in three categories:\n\n"
            "- **WCHR** — Can walk short distances, needs wheelchair for longer\n"
            "- **WCHS** — Cannot climb stairs\n"
            "- **WCHC** — Requires complete assistance\n\n"
            "Please request **at least 48 hours before departure**. "
            "Could you share your booking reference (PNR) so I can arrange this?"
        )
        return _build_result(resp, "pnr_servicing", {}, ["Share my PNR"])

    # ── Baggage ───────────────────────────────────────────────
    if any(w in ml for w in ("baggage", "luggage", "bag", "bagage", "suitcase", "allowance")):
        resp = (
            "**Air Mauritius baggage allowance:**\n\n"
            "- Economy class: 23 kg (1 piece) + 7 kg carry-on\n"
            "- Business class: 32 kg (2 pieces) + 7 kg carry-on\n\n"
            "Excess baggage can be pre-purchased online at a discounted rate. "
            "Do you need help with anything else?"
        )
        return _build_result(resp, "airport_info", {}, ["Check my booking", "Ask about check-in"])

    # ── Check-in ──────────────────────────────────────────────
    if any(w in ml for w in ("check", "check-in", "checkin", "desk", "enregistrement")):
        resp = (
            "**Check-in at SSR International Airport:**\n\n"
            "- **Hall A** (Desks 1–24) — Air Mauritius flights\n"
            "- **Hall B** (Desks 25–54) — All other airlines\n\n"
            "Check-in opens **3 hours** before departure and closes **60 minutes** before. "
            "Which flight are you checking in for?"
        )
        return _build_result(resp, "airport_info", {}, ["Ask about my flight", "Lounge info"])

    # ── Lounge ───────────────────────────────────────────────
    if any(w in ml for w in ("lounge", "salon")):
        resp = (
            "**Lounges at SSR Airport:**\n\n"
            "- **Amédée Maingard Lounge** — Business class passengers (complimentary)\n"
            "- **Premium Lounge** — Economy passengers ($35)\n"
            "- **ATOL Lounge** — Open to all passengers ($25)\n\n"
            "All lounges offer Wi-Fi, hot meals, and shower facilities. "
            "Would you like directions?"
        )
        return _build_result(resp, "airport_info", {}, ["Check baggage allowance"])

    # ── Escalation triggers ───────────────────────────────────
    if any(w in ml for w in ("cancel", "refund", "change date", "upgrade", "complaint", "supervisor", "manager")):
        resp = (
            "I understand — this request needs to be handled by our customer service team.\n\n"
            "I'm transferring you now. Please hold.\n\n"
            "📞 **Air Mauritius:** +230 207 7070\n"
            "🕐 Available 24/7"
        )
        return _build_result(resp, "complaint", {}, [], escalate=True,
                             escalation_reason=f"Customer requested: {message[:60]}")

    # ── Wi-Fi / facilities ────────────────────────────────────
    if any(w in ml for w in ("wifi", "wi-fi", "internet", "prayer", "nursing", "children", "smoking", "atm")):
        resp = (
            "**Terminal facilities at SSR Airport:**\n\n"
            "- Free Wi-Fi throughout the terminal\n"
            "- Prayer rooms on departures level\n"
            "- Children's play area near Gate A\n"
            "- Nursing/baby rooms on arrivals and departures levels\n"
            "- ATMs and currency exchange in arrivals hall\n"
            "- Duty-free shops in international departures\n\n"
            "Can I help you with anything else?"
        )
        return _build_result(resp, "airport_info", {}, [])

    # ── Greeting ─────────────────────────────────────────────
    if any(w in ml for w in ("hello", "hi", "bonjour", "bonzour", "namaste", "helo")):
        now = datetime.now(MAURITIUS_TZ)
        greeting = "Good morning" if now.hour < 12 else ("Good afternoon" if now.hour < 17 else "Good evening")
        resp = (
            f"{greeting}! I'm the SSR Airport AI Assistant for Air Mauritius. "
            "I can help you with:\n\n"
            "- ✈️ Flight status and gate information\n"
            "- 📋 Booking and PNR lookups\n"
            "- 🍽️ Special meal requests\n"
            "- ♿ Wheelchair and assistance\n"
            "- 🏢 Airport facilities and check-in\n\n"
            "How can I help you today?"
        )
        return _build_result(resp, "general_inquiry", {},
                             ["Check flight MK014", "Look up booking ABC123", "Request vegetarian meal"])

    # ── Default ───────────────────────────────────────────────
    resp = (
        "I'm here to help with your Air Mauritius journey. You can ask me about:\n\n"
        "- Flight status (e.g. *\"Status of MK014\"*)\n"
        "- Your booking (e.g. *\"Look up PNR ABC123\"*)\n"
        "- Special meals, wheelchair assistance\n"
        "- Check-in desks, gates, lounges\n\n"
        "What would you like to know?"
    )
    return _build_result(resp, "general_inquiry", {},
                         ["Check flight MK014", "Look up booking ABC123", "Airport facilities"])


def _build_result(
    response: str,
    intent: str,
    entities: Dict,
    suggestions: List[str],
    escalate: bool = False,
    escalation_reason: Optional[str] = None,
) -> Dict:
    return {
        "response": response,
        "suggestions": suggestions,
        "escalation_needed": escalate,
        "escalation_reason": escalation_reason,
        "intent": intent,
        "entities": entities,
        "tokens_used": 0,
    }


# ── Real AI service (used when ANTHROPIC_API_KEY is set) ─────────────────────

class SSRAIService:
    def __init__(self):
        self._client = None
        self.model = "claude-sonnet-4-20250514"
        self.max_tokens = 1000

    @property
    def client(self):
        if self._client is None:
            import anthropic
            self._client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._client

    async def generate_response(
        self,
        messages: List[Dict],
        language: str = "en",
        context: Optional[Dict] = None,
    ) -> Dict:
        # Demo mode — no API key needed
        if not settings.ANTHROPIC_API_KEY:
            user_message = next(
                (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
            )
            return _mock_response(user_message, language)

        now = datetime.now(MAURITIUS_TZ)
        system_prompt = self._build_system_prompt(language, context, now)

        response = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            system=system_prompt,
            messages=messages,
        )

        content = response.content[0].text
        structured = self._parse_structured_output(content)
        clean_response = self._strip_json_block(content)

        return {
            "response": clean_response,
            "suggestions": structured.get("suggestions", []),
            "escalation_needed": structured.get("escalate", False),
            "escalation_reason": structured.get("escalation_reason"),
            "intent": structured.get("intent"),
            "entities": structured.get("entities", {}),
            "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
        }

    def _build_system_prompt(self, language: str, context, now: datetime) -> str:
        lang_name = self._get_language_name(language)
        prompt = f"""You are the AI Assistant for SSR International Airport (Sir Seewoosagur Ramgoolam International Airport) in Mauritius, operated by Air Mauritius.

CURRENT CONTEXT:
- Date: {now.strftime('%Y-%m-%d')}
- Time: {now.strftime('%H:%M')} (Indian/Mauritius timezone, UTC+4)
- Language: {lang_name}

YOUR ROLE:
Assist passengers with flight status, bookings, special service requests, airport info, and travel policies.

AIRPORT LAYOUT:
- Check-in Hall A: Air Mauritius flights (Desks 1-24)
- Check-in Hall B: Other airlines (Desks 25-54)
- Gates A1-A12: Africa & Asia | Gates B1-B12: Europe & Middle East

BAGGAGE: Economy 23 kg + 7 kg carry-on | Business 32 kg (2 pieces) + 7 kg carry-on

SPECIAL MEALS (≥24h before): VGML Vegetarian, VLML Vegan, MOML Halal, HNML Hindu, KSML Kosher, DBML Diabetic, GFML Gluten-free, CHML Child

WHEELCHAIR (≥48h before): WCHR distances, WCHS no stairs, WCHC full assistance

ESCALATE (set "escalate": true) for: booking changes, cancellations, refunds, complaints, payments, medical emergencies, or when passenger requests human agent.

Always end with:
```json
{{"intent": "flight_status|booking_lookup|pnr_servicing|airport_info|complaint|general_inquiry", "entities": {{}}, "suggestions": [], "escalate": false, "escalation_reason": null}}
```"""
        if context and context.get("verified_pnr"):
            prompt += f"\n\nVERIFIED BOOKING: {context['verified_pnr']}"
        return prompt

    def _get_language_name(self, code: str) -> str:
        return {"en": "English", "fr": "French (Français)", "cr": "Mauritian Creole (Kreol Morisien)", "hi": "Hindi (हिन्दी)"}.get(code, "English")

    def _parse_structured_output(self, content: str) -> Dict:
        try:
            start = content.rfind("```json")
            if start == -1:
                return {}
            end = content.rfind("```", start + 7)
            if end == -1:
                return {}
            return json.loads(content[start + 7 : end].strip())
        except Exception:
            return {}

    def _strip_json_block(self, content: str) -> str:
        start = content.rfind("```json")
        return content[:start].strip() if start != -1 else content.strip()
