import httpx
import os
from typing import Dict, List, Optional

from app.core.config import settings


class BlandVoiceService:
    def __init__(self):
        self.api_key = settings.BLAND_AI_API_KEY
        self.base_url = "https://api.bland.ai/v1"

    async def create_call(
        self,
        phone_number: str,
        language: str = "en",
        context: Optional[Dict] = None,
    ) -> Dict:
        payload = {
            "phone_number": phone_number,
            "task": self._build_task_prompt(language, context),
            "voice": "nat",
            "language": self._map_language(language),
            "model": "enhanced",
            "max_duration": 10,
            "record": True,
            "wait_for_greeting": True,
            "transfer_phone_number": settings.SSR_HUMAN_AGENTS_NUMBER,
            "webhook": f"{settings.API_BASE_URL}/api/v1/voice/bland-webhook",
            "tools": self._get_tools(),
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/calls",
                json=payload,
                headers={"Authorization": self.api_key},
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    async def get_call_details(self, bland_call_id: str) -> Dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/calls/{bland_call_id}",
                headers={"Authorization": self.api_key},
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    def _build_task_prompt(self, language: str, context: Optional[Dict]) -> str:
        lang_name = self._get_language_name(language)

        prompt = f"""You are the voice AI assistant for SSR International Airport (Air Mauritius) in Mauritius.

LANGUAGE: Respond in {lang_name}. If caller uses a different language, match it.

CAPABILITIES:
1. Check flight status — use get_flight_status tool
2. Look up bookings — use get_booking_info tool
3. Airport information (gates, lounges, facilities)
4. Special services (meals, wheelchair)
5. Transfer to human agent when needed

TONE: Professional, friendly, patient. Clear pronunciation, moderate pace.

CRITICAL RULES:
- Confirm flight numbers by spelling: "M as in Mike, K as in Kilo, zero-one-four"
- Repeat critical information (gates, times, PNR)
- Keep calls concise (target 2-3 minutes)
- If uncertain, transfer to human

TRANSFER CONDITIONS (say transfer phrase and transfer):
- Booking modification, cancellation, date change
- Payment or refund request
- Complaint or urgent issue
- Unable to understand after asking twice
- Caller requests human agent

GREETING: "Hello, Air Mauritius SSR Airport AI Assistant speaking. How may I help you today?"

TRANSFER PHRASE: "I'll connect you with our customer service team who can better assist you. Please hold."""

        if context and context.get("verified_pnr"):
            prompt += f"\n\nCALLER CONTEXT: Previously verified booking {context['verified_pnr']}"

        return prompt

    def _get_tools(self) -> List[Dict]:
        api_base = settings.API_BASE_URL
        return [
            {
                "name": "get_flight_status",
                "description": "Get real-time flight status by flight number",
                "url": f"{api_base}/api/v1/flights/{{flight_number}}",
                "method": "GET",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "flight_number": {
                            "type": "string",
                            "description": "Flight number e.g. MK014",
                        }
                    },
                    "required": ["flight_number"],
                },
            },
            {
                "name": "get_booking_info",
                "description": "Look up passenger booking by PNR reference",
                "url": f"{api_base}/api/v1/bookings/{{pnr}}",
                "method": "GET",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "pnr": {
                            "type": "string",
                            "description": "6-character booking reference e.g. ABC123",
                        }
                    },
                    "required": ["pnr"],
                },
            },
        ]

    def _map_language(self, code: str) -> str:
        return {"en": "en", "fr": "fr", "cr": "fr", "hi": "hi"}.get(code, "en")

    def _get_language_name(self, code: str) -> str:
        return {
            "en": "English",
            "fr": "French",
            "cr": "Mauritian Creole (use French as fallback)",
            "hi": "Hindi",
        }.get(code, "English")
