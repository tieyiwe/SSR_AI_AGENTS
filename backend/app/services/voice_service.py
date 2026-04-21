import httpx
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
        voice_id: Optional[str] = None,
        agent_name: Optional[str] = None,
    ) -> Dict:
        from app.core.admin_config import get_voice_persona
        # Pick a fresh random persona for every call unless caller supplied overrides
        persona = get_voice_persona()
        voice = voice_id or persona["voice"]
        name  = agent_name or persona["name"]

        payload = {
            "phone_number": phone_number,
            "task": self._build_task_prompt(language, context, agent_name=name),
            "voice": voice,
            "language": self._map_language(language),
            "model": "enhanced",
            "max_duration": 10,
            "record": True,
            "wait_for_greeting": True,
            "transfer_phone_number": settings.SSR_HUMAN_AGENTS_NUMBER,
            "webhook": f"{settings.API_BASE_URL}/api/v1/voice/bland-webhook",
            "tools": self._get_tools(),
            "interruption_threshold": 120,
            "temperature": 0.7,
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

    def _build_task_prompt(
        self,
        language: str,
        context: Optional[Dict],
        agent_name: str = "Priya",
    ) -> str:
        from app.core.admin_config import get_config
        cfg = get_config()
        lang_name = self._get_language_name(language)
        lang_extra = cfg.get("language_instructions", {}).get(language, "")

        # Build language-specific greeting variants so the intro feels natural
        greetings = {
            "en": f"Hello! My name is {agent_name}, and I'm calling from SSR International Airport on behalf of Air Mauritius. How may I assist you today?",
            "fr": f"Bonjour ! Je m'appelle {agent_name}, et j'appelle de l'Aéroport International SSR pour Air Mauritius. Comment puis-je vous aider aujourd'hui ?",
            "cr": f"Bonzour ! Mo appel {agent_name}, mo pe apel depi Aeropor Internasional SSR pou Air Mauritius. Ki manier mo kapav ede ou zordi ?",
            "hi": f"नमस्ते! मेरा नाम {agent_name} है, और मैं Air Mauritius की ओर से SSR अंतर्राष्ट्रीय हवाई अड्डे से बोल रही/रहा हूँ। मैं आपकी किस तरह मदद कर सकता/सकती हूँ?",
        }

        # Auto-detect mode: greet in French (Mauritius default), then switch to caller's language
        auto_detect = language in ("auto", "")
        if auto_detect:
            greeting_line = greetings["fr"]
            language_block = (
                "LANGUAGE DETECTION (MANDATORY):\n"
                "Begin your greeting in French as Mauritius default. "
                "After the caller's first words, IMMEDIATELY identify their language from: "
                "English, French, Mauritian Creole (Kreol), or Hindi. "
                "Switch to and maintain that language for the entire call. "
                "If unsure, ask: 'Which language do you prefer — English, Français, Kreol, ou हिन्दी?'"
            )
        else:
            greeting_line = greetings.get(language, greetings["fr"])
            language_block = (
                f"LANGUAGE: Respond in {lang_name}. "
                "If the caller uses a different language, switch and match them immediately."
            )

        prompt = f"""You are {agent_name}, a voice AI assistant for SSR International Airport (Air Mauritius), Mauritius.

MANDATORY FIRST ACTION — SELF-INTRODUCTION:
When the call connects, IMMEDIATELY say this exact greeting (do NOT skip or modify it):
"{greeting_line}"
This introduction must happen before anything else, every single call, no exceptions.

{language_block}

IDENTITY & TONE:
- Warm, professional, and patient — embody Mauritian hospitality
- Speak clearly at a moderate pace; avoid filler words
- Acknowledge emotions before solving problems
- Use the caller's name if confirmed from their booking

CAPABILITIES:
1. Real-time flight status — use get_flight_status tool
2. Booking / PNR lookup — use get_booking_info tool
3. Airport information (gates, lounges, check-in, facilities)
4. Special services (meals ≥24 h, wheelchair ≥48 h before departure)
5. Transfer to human agent when required

PHONETIC PROTOCOL:
- Confirm flight numbers phonetically: "M as in Mike, K as in Kilo, zero-one-four"
- Repeat critical data (gates, times, PNR) once for confirmation
- Spell out PNR codes letter by letter

VOICE GUIDELINES:
- Keep calls focused; target 2–3 minutes for routine queries
- Pause briefly after delivering information to allow caller to respond
- If the caller is distressed, lower your pace and increase empathy

ESCALATION — transfer immediately when:
- Booking modification, cancellation, date change, or upgrade request
- Payment, refund, or compensation request
- Formal complaint about staff or service
- Caller cannot be understood after two attempts
- Caller explicitly requests a human agent

ESCALATION PHRASE: "I completely understand. Let me connect you with our customer service team right away — they have full authority to help you with this. Please hold for just a moment."

CLOSING: "Thank you for calling SSR International Airport. Have a wonderful journey! My name was {agent_name} — don't hesitate to call again."
"""

        if lang_extra:
            prompt += f"\n\nADMIN INSTRUCTIONS: {lang_extra}"
        if context and context.get("verified_pnr"):
            prompt += f"\n\nCALLER CONTEXT: Verified booking reference on file: {context['verified_pnr']}"

        return prompt

    def _get_tools(self) -> List[Dict]:
        api_base = settings.API_BASE_URL
        return [
            {
                "name": "get_flight_status",
                "description": "Get real-time flight status, gate, and departure time",
                "url": f"{api_base}/api/v1/flights/{{flight_number}}",
                "method": "GET",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "flight_number": {
                            "type": "string",
                            "description": "IATA flight number e.g. MK014",
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
        # "auto" and "" default to French (Mauritius default)
        return {"en": "en", "fr": "fr", "cr": "fr", "hi": "hi", "auto": "fr"}.get(code, "fr")

    def _get_language_name(self, code: str) -> str:
        return {
            "en": "English",
            "fr": "French (Français)",
            "cr": "Mauritian Creole (use French as fallback, mix naturally)",
            "hi": "Hindi (हिन्दी)",
            "auto": "auto-detected",
        }.get(code, "French (Français)")
