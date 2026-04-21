import anthropic
import json
import os
from datetime import datetime
from typing import Dict, List, Optional
from zoneinfo import ZoneInfo

from app.core.config import settings


MAURITIUS_TZ = ZoneInfo("Indian/Mauritius")


class SSRAIService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-sonnet-4-20250514"
        self.max_tokens = 1000

    async def generate_response(
        self,
        messages: List[Dict],
        language: str = "en",
        context: Optional[Dict] = None,
    ) -> Dict:
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

    def _build_system_prompt(
        self, language: str, context: Optional[Dict], now: datetime
    ) -> str:
        lang_name = self._get_language_name(language)

        prompt = f"""You are the AI Assistant for SSR International Airport (Sir Seewoosagur Ramgoolam International Airport) in Mauritius, operated by Air Mauritius.

CURRENT CONTEXT:
- Date: {now.strftime('%Y-%m-%d')}
- Time: {now.strftime('%H:%M')} (Indian/Mauritius timezone, UTC+4)
- Language: {lang_name}

YOUR ROLE:
Assist passengers with:
1. Flight status and schedules
2. Booking confirmations and PNR lookups
3. Special service requests (meals, wheelchair, assistance)
4. Airport information (gates, check-in, facilities)
5. Travel policies and procedures

AIRPORT LAYOUT:
- Check-in Hall A: Air Mauritius flights (Desks 1-24)
- Check-in Hall B: Other airlines (Desks 25-54)
- Gates A1-A12: Africa & Asia destinations
- Gates B1-B12: Europe & Middle East destinations

FACILITIES:
- ATOL Lounge: Open to all passengers ($25)
- Premium Lounge: Economy class passengers ($35)
- Amédée Maingard Lounge: Business class (complimentary)
- Free WiFi throughout terminal
- Duty-free, prayer rooms, children's play area, nursing rooms

BAGGAGE ALLOWANCE:
- Economy: 23kg (1 piece) + 7kg carry-on
- Business: 32kg (2 pieces) + 7kg carry-on

SPECIAL MEAL CODES:
VGML=Vegetarian, VLML=Vegan, MOML=Muslim/Halal, HNML=Hindu, KSML=Kosher, DBML=Diabetic, GFML=Gluten-free, CHML=Child meal
Must be requested ≥24 hours before departure.

WHEELCHAIR SERVICES:
- WCHR: Can walk short distances (request ≥48h before)
- WCHS: Cannot climb stairs (request ≥48h before)
- WCHC: Complete assistance required (request ≥48h before)

RESPONSE GUIDELINES:
- Be concise and specific (gate numbers, desk numbers, times)
- Confirm critical info (flight numbers, dates, PNR)
- Respond in passenger's language
- If uncertain, acknowledge and offer to escalate

ESCALATION (set "escalate": true) WHEN:
- Booking modification, cancellation, or upgrade requested
- Payment or refund requested
- Complaints or service issues
- Medical emergency or urgent assistance
- Unable to answer confidently after clarification
- Passenger explicitly requests human agent

RESPONSE FORMAT — always append this JSON block:
```json
{{
    "intent": "flight_status|booking_lookup|pnr_servicing|airport_info|complaint|general_inquiry",
    "entities": {{"flight": "MK014", "pnr": "ABC123"}},
    "suggestions": ["Ask about gate", "Check baggage allowance"],
    "escalate": false,
    "escalation_reason": null
}}
```"""

        if context:
            if context.get("previous_queries"):
                prompt += f"\n\nPASSENGER HISTORY:\n{json.dumps(context['previous_queries'], indent=2)}"
            if context.get("verified_pnr"):
                prompt += f"\n\nVERIFIED BOOKING: {context['verified_pnr']}"

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
            json_str = content[start + 7 : end].strip()
            return json.loads(json_str)
        except Exception:
            return {}

    def _strip_json_block(self, content: str) -> str:
        start = content.rfind("```json")
        if start == -1:
            return content.strip()
        return content[:start].strip()
