import json
import re
from datetime import datetime
from typing import Dict, List, Optional
from zoneinfo import ZoneInfo

from app.core.config import settings

MAURITIUS_TZ = ZoneInfo("Indian/Mauritius")

# ── Mock flight/booking data (mirrors fids_service.py) ───────────────────────

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
    """Keyword-driven demo responses — used when ANTHROPIC_API_KEY is not set."""
    ml = message.lower()
    flight_match = re.search(r"\b([A-Z]{2}\d{3,4})\b", message.upper())
    pnr_match = re.search(r"\b([A-Z]{3}\d{3}|[A-Z0-9]{6})\b", message.upper())

    # Flight status
    if flight_match and any(w in ml for w in ("flight", "depart", "status", "gate", "when",
                                               "time", "delay", "vol", "vuelo", "avion")):
        fn = flight_match.group(1)
        info = _FLIGHTS.get(fn)
        if info:
            resp = (
                f"Flight **{fn}** to {info['destination']}:\n"
                f"- Status: **{info['status']}**\n"
                f"- Departure: **{info['departure']}**\n"
                f"- Gate: **{info['gate']}**\n"
                f"- Check-in: {info['check_in']}\n\n"
                "Is there anything else I can help you with?"
            )
        else:
            resp = (
                f"I couldn't find real-time data for flight **{fn}**. "
                "Please check the departure board or visit the Air Mauritius desk."
            )
        return _build_result(resp, "flight_status", {"flight_number": fn},
                             ["Check baggage allowance", "Find my check-in desk", "Lounge access"])

    # PNR / Booking lookup
    if pnr_match and any(w in ml for w in ("booking", "reservation", "pnr", "reference",
                                            "confirm", "réservation", "rezervasion")):
        pnr = pnr_match.group(1)
        info = _BOOKINGS.get(pnr)
        if info:
            resp = (
                f"Booking **{pnr}** — {info['passenger']}:\n"
                f"- Flight: **{info['flight']}** on {info['date']}\n"
                f"- Class: **{info['class']}**, Seat **{info['seat']}**\n"
                f"- Meal: {info['meal']}\n"
                f"- Baggage: {info['baggage']}\n\n"
                "Would you like to request a special service or check your flight status?"
            )
            suggestions = ["Request special meal", "Wheelchair assistance", "Check flight status"]
        else:
            resp = (
                f"I wasn't able to retrieve booking **{pnr}** in demo mode. "
                "Once the booking system is connected, full PNR details will appear here."
            )
            suggestions = ["Try ABC123 or XYZ789 as demo PNRs"]
        return _build_result(resp, "booking_lookup", {"pnr": pnr}, suggestions)

    # Meal request
    if any(w in ml for w in ("meal", "food", "vegetarian", "vegan", "halal", "kosher",
                              "diabetic", "gluten", "repas", "manze", "halaal")):
        resp = (
            "I can arrange a special meal for your flight. Available options:\n\n"
            "- **VGML** — Vegetarian\n"
            "- **VLML** — Vegan\n"
            "- **MOML** — Muslim / Halal\n"
            "- **HNML** — Hindu\n"
            "- **KSML** — Kosher\n"
            "- **DBML** — Diabetic\n"
            "- **GFML** — Gluten-free\n"
            "- **CHML** — Child meal\n\n"
            "Requests must be made **at least 24 hours before departure**. "
            "Please share your PNR reference and I'll update your booking right away."
        )
        return _build_result(resp, "pnr_servicing", {},
                             ["Share my PNR", "Check my booking", "What is my PNR?"])

    # Wheelchair / mobility assistance
    if any(w in ml for w in ("wheelchair", "assistance", "mobility", "disabled",
                              "fauteuil", "handicap", "roulant")):
        resp = (
            "Mobility assistance is available in three categories:\n\n"
            "- **WCHR** — Can walk short distances, needs wheelchair in terminal\n"
            "- **WCHS** — Cannot climb stairs, needs lift\n"
            "- **WCHC** — Requires full assistance throughout\n\n"
            "Please request **at least 48 hours before departure**. "
            "Could you share your booking reference (PNR) so I can arrange this?"
        )
        return _build_result(resp, "pnr_servicing", {}, ["Share my PNR", "Learn about airport facilities"])

    # Baggage
    if any(w in ml for w in ("baggage", "luggage", "bag", "bagage", "suitcase", "allowance", "kilo", "kg")):
        resp = (
            "**Air Mauritius baggage allowance:**\n\n"
            "| Class | Hold | Carry-on |\n"
            "|-------|------|----------|\n"
            "| Economy | 23 kg (1 piece) | 7 kg |\n"
            "| Business | 32 kg (2 pieces) | 7 kg |\n\n"
            "Excess baggage can be pre-purchased online at a discounted rate. "
            "Shall I help you with anything else?"
        )
        return _build_result(resp, "airport_info", {},
                             ["Check-in desks", "Ask about my booking", "Special meals"])

    # Check-in
    if any(w in ml for w in ("check", "check-in", "checkin", "desk", "counter", "enregistrement")):
        resp = (
            "**Check-in at SSR International Airport:**\n\n"
            "- **Hall A** (Desks 1–24) — Air Mauritius flights\n"
            "- **Hall B** (Desks 25–54) — All other airlines\n\n"
            "- Opens **3 hours** before departure\n"
            "- Closes **60 minutes** before departure\n"
            "- Online check-in opens 30 hours before on airmauritius.com\n\n"
            "Which flight are you checking in for?"
        )
        return _build_result(resp, "airport_info", {},
                             ["Check my flight status", "Ask about baggage", "Lounge info"])

    # Lounge
    if any(w in ml for w in ("lounge", "salon", "business class")):
        resp = (
            "**Lounges at SSR Airport:**\n\n"
            "- **Amédée Maingard Lounge** — Business class passengers (complimentary)\n"
            "- **Premium Lounge** — Economy passengers ($35 per person)\n"
            "- **ATOL Lounge** — All passengers ($25 per person)\n\n"
            "All lounges offer complimentary Wi-Fi, hot meals, beverages, and shower facilities. "
            "Would you like directions?"
        )
        return _build_result(resp, "airport_info", {},
                             ["Check baggage allowance", "Ask about check-in"])

    # Escalation triggers
    if any(w in ml for w in ("cancel", "refund", "change date", "upgrade", "complaint",
                              "supervisor", "manager", "compensation", "complain")):
        resp = (
            "I completely understand, and I want to make sure you get the best help possible. "
            "This request needs to be handled by our customer service team who have full access "
            "to manage bookings and process requests.\n\n"
            "Let me connect you right away:\n\n"
            "📞 **Air Mauritius:** +230 207 7070\n"
            "💬 **WhatsApp:** +230 603 8000\n"
            "🕐 Available 24/7"
        )
        return _build_result(resp, "complaint", {}, [], escalate=True,
                             escalation_reason=f"Customer requested: {message[:80]}")

    # Wi-Fi / facilities
    if any(w in ml for w in ("wifi", "wi-fi", "internet", "prayer", "nursing", "children",
                              "smoking", "atm", "currency", "pharmacy", "parking")):
        resp = (
            "**Terminal facilities at SSR International Airport:**\n\n"
            "- 📶 **Free Wi-Fi** throughout the terminal (SSR_FREE_WIFI)\n"
            "- 🕌 **Prayer rooms** — Departures Level 2, near Gate A6\n"
            "- 👶 **Nursing rooms** — Arrivals Level 1 & Departures Level 2\n"
            "- 🧒 **Children's play area** — Near Gate A3\n"
            "- 🏧 **ATMs** — Arrivals hall and Departures Level 1\n"
            "- 💱 **Currency exchange** — Arrivals hall, open 24/7\n"
            "- 💊 **Pharmacy** — Departures Level 1, 05:00–23:00\n"
            "- 🚗 **Parking** — Multi-storey car park, Gate 5\n\n"
            "Can I help with anything else?"
        )
        return _build_result(resp, "airport_info", {}, [])

    # Greeting
    if any(w in ml for w in ("hello", "hi", "bonjour", "bonzour", "namaste", "helo",
                              "salut", "good morning", "good afternoon", "good evening")):
        now = datetime.now(MAURITIUS_TZ)
        if now.hour < 12:
            greeting = "Good morning"
        elif now.hour < 17:
            greeting = "Good afternoon"
        else:
            greeting = "Good evening"
        resp = (
            f"{greeting}! I'm **Aida**, your AI assistant for SSR International Airport. "
            "I'm here to make your journey as smooth as possible.\n\n"
            "I can help you with:\n"
            "- ✈️ Flight status and gate information\n"
            "- 📋 Booking and PNR lookups\n"
            "- 🍽️ Special meal requests\n"
            "- ♿ Wheelchair and mobility assistance\n"
            "- 🏢 Check-in desks, lounges, and facilities\n\n"
            "How can I assist you today?"
        )
        return _build_result(resp, "general_inquiry", {},
                             ["Check flight MK014", "Look up booking ABC123", "Airport facilities"])

    # Default
    resp = (
        "I'm **Aida**, your SSR Airport AI assistant. I'm here to help with your journey.\n\n"
        "Here are some things I can do for you:\n"
        "- **Flight status** — e.g. *\"Status of MK014\"*\n"
        "- **Booking lookup** — e.g. *\"Look up PNR ABC123\"*\n"
        "- **Special services** — meals, wheelchair assistance\n"
        "- **Airport info** — check-in, gates, lounges, facilities\n\n"
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


# ── Optimised system prompt ───────────────────────────────────────────────────

_SYSTEM_PROMPT_TEMPLATE = """You are **Aida**, the AI Customer Experience Assistant for SSR International Airport (Sir Seewoosagur Ramgoolam International Airport), Mauritius — operated by Air Mauritius.

IDENTITY & TONE:
- Warm, empathetic, and professional — you embody Mauritian hospitality
- Always acknowledge feelings before solving problems ("I understand that must be frustrating...")
- Patient and never dismissive; every passenger matters
- Concise but complete — answer in 3–5 sentences unless full detail is needed
- Use the passenger's name if known from their booking

CURRENT CONTEXT:
- Date: {date}
- Time: {time} Mauritius Time (UTC+4)
- Language: {lang_name}
- RESPOND ONLY IN {lang_name}. If the passenger writes in a different language, switch to match them immediately.

CAPABILITIES:
1. Real-time flight status (departure, gate, delays, check-in desk)
2. Booking & PNR lookups (passenger details, seat, class, meal preference, baggage)
3. Special service requests (meal codes ≥24 h, wheelchair codes ≥48 h before departure)
4. Airport facilities (lounges, Wi-Fi, prayer rooms, nursing rooms, ATMs, parking)
5. Travel policies (baggage allowances, check-in windows, boarding procedures)
6. Warm and efficient escalation to human agents

AIRPORT QUICK REFERENCE:
- Check-in Hall A: Air Mauritius (Desks 1–24) | Hall B: All other airlines (Desks 25–54)
- Gates A1–A12: Africa & Asia | Gates B1–B12: Europe & Middle East
- Check-in opens 3 hours before departure and closes 60 minutes before
- Economy baggage: 23 kg + 7 kg carry-on | Business: 32 kg (2 pieces) + 7 kg carry-on

SPECIAL MEALS (≥24 h before departure):
VGML Vegetarian · VLML Vegan · MOML Muslim/Halal · HNML Hindu · KSML Kosher · DBML Diabetic · GFML Gluten-free · CHML Child

WHEELCHAIR ASSISTANCE (≥48 h before departure):
WCHR: Can walk short distances | WCHS: Cannot climb stairs | WCHC: Requires full assistance

ESCALATION — SET "escalate": true WHEN:
- Booking change, cancellation, date change, upgrade, or refund request
- Payment, billing, or compensation issue
- Formal complaint about staff or service quality
- Medical emergency or urgent passenger welfare concern
- Issue unresolved after two attempts
- Passenger explicitly asks for a human agent

ESCALATION PHRASE (adapt to language):
"I completely understand, and I want to make sure you receive the best support. Let me connect you with our customer service team right away — they have full access to your booking and can resolve this for you. Please hold for just a moment."

RESPONSE QUALITY STANDARDS:
- Use bold for key data (flight numbers, times, gates, PNR)
- Use bullet lists for multi-item information
- End each response with a follow-up question or suggested next step
- Never guess or fabricate data — if unsure, say so and offer alternatives{language_extra}

Always end with this JSON block (parsed internally, not displayed to passenger):
```json
{{"intent": "flight_status|booking_lookup|pnr_servicing|airport_info|complaint|general_inquiry", "entities": {{}}, "suggestions": [], "escalate": false, "escalation_reason": null}}
```"""

_LANGUAGE_EXTRAS = {
    "fr": "\n\nFRENCH GUIDANCE: Use formal \"vous\" form. Maintain warmth but professional register.",
    "cr": "\n\nCREOLE GUIDANCE: Use natural Mauritian Creole. Mix Creole with French/English where it flows naturally. \"Bonzour\", \"mersi\", \"mo kapav ede ou\".",
    "hi": "\n\nHINDI GUIDANCE: Use respectful \"आप\" form. Maintain formal yet warm tone. Transliterate key terms where helpful.",
}


# ── Real AI service ───────────────────────────────────────────────────────────

class SSRAIService:
    def __init__(self):
        self._client = None

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
        if not settings.ANTHROPIC_API_KEY:
            user_message = next(
                (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
            )
            return _mock_response(user_message, language)

        from app.core.admin_config import get_config
        cfg = get_config()
        now = datetime.now(MAURITIUS_TZ)
        system_prompt = self._build_system_prompt(language, context, now, cfg)
        model = cfg.get("model", "claude-sonnet-4-20250514")
        max_tokens = cfg.get("max_tokens", 1000)

        if cfg.get("enable_tool_use"):
            return await self._agentic_response(
                messages, system_prompt, model, max_tokens, language
            )

        response = self.client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages,
        )
        content = response.content[0].text
        structured = self._parse_structured_output(content)
        return {
            "response": self._strip_json_block(content),
            "suggestions": structured.get("suggestions", []),
            "escalation_needed": structured.get("escalate", False),
            "escalation_reason": structured.get("escalation_reason"),
            "intent": structured.get("intent"),
            "entities": structured.get("entities", {}),
            "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
        }

    async def _agentic_response(
        self, messages, system_prompt, model, max_tokens, language
    ) -> Dict:
        """
        Agentic loop: let Claude call service connectors (tools) up to 3 times
        before returning a final text response to the passenger.
        """
        from app.services.agent_tools import tool_registry
        tools = tool_registry.get_anthropic_tools()
        working_messages = list(messages)
        total_tokens = 0

        for _ in range(3):  # max 3 tool rounds
            response = self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                system=system_prompt,
                messages=working_messages,
                tools=tools,
            )
            total_tokens += response.usage.input_tokens + response.usage.output_tokens

            if response.stop_reason == "end_turn":
                text = next((b.text for b in response.content if hasattr(b, "text")), "")
                structured = self._parse_structured_output(text)
                return {
                    "response": self._strip_json_block(text),
                    "suggestions": structured.get("suggestions", []),
                    "escalation_needed": structured.get("escalate", False),
                    "escalation_reason": structured.get("escalation_reason"),
                    "intent": structured.get("intent"),
                    "entities": structured.get("entities", {}),
                    "tokens_used": total_tokens,
                }

            if response.stop_reason == "tool_use":
                working_messages.append({"role": "assistant", "content": response.content})
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        result = await tool_registry.execute(block.name, block.input)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result),
                        })
                working_messages.append({"role": "user", "content": tool_results})
            else:
                break

        # Fallback — final completion without tools
        fallback = self.client.messages.create(
            model=model, max_tokens=max_tokens,
            system=system_prompt, messages=working_messages,
        )
        total_tokens += fallback.usage.input_tokens + fallback.usage.output_tokens
        text = fallback.content[0].text
        structured = self._parse_structured_output(text)
        return {
            "response": self._strip_json_block(text),
            "suggestions": structured.get("suggestions", []),
            "escalation_needed": structured.get("escalate", False),
            "escalation_reason": structured.get("escalation_reason"),
            "intent": structured.get("intent"),
            "entities": structured.get("entities", {}),
            "tokens_used": total_tokens,
        }

    def _build_system_prompt(self, language: str, context, now: datetime, cfg: dict) -> str:
        lang_name = self._get_language_name(language)
        extra = _LANGUAGE_EXTRAS.get(language, "")

        custom_instructions = cfg.get("language_instructions", {}).get(language, "")
        if custom_instructions:
            extra += f"\n\nADMIN INSTRUCTIONS ({lang_name.upper()}): {custom_instructions}"

        prompt_template = cfg.get("system_prompt_override") or _SYSTEM_PROMPT_TEMPLATE
        prompt = prompt_template.format(
            date=now.strftime("%Y-%m-%d"),
            time=now.strftime("%H:%M"),
            lang_name=lang_name,
            language_extra=extra,
        )
        if context and context.get("verified_pnr"):
            prompt += f"\n\nVERIFIED BOOKING ON FILE: {context['verified_pnr']}"
        return prompt

    def _get_language_name(self, code: str) -> str:
        return {
            "en": "English",
            "fr": "French (Français)",
            "cr": "Mauritian Creole (Kreol Morisien)",
            "hi": "Hindi (हिन्दी)",
        }.get(code, "English")

    def _parse_structured_output(self, content: str) -> Dict:
        try:
            start = content.rfind("```json")
            if start == -1:
                return {}
            end = content.rfind("```", start + 7)
            if end == -1:
                return {}
            return json.loads(content[start + 7: end].strip())
        except Exception:
            return {}

    def _strip_json_block(self, content: str) -> str:
        start = content.rfind("```json")
        return content[:start].strip() if start != -1 else content.strip()
