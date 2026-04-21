from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Dial, Say
from typing import Dict, Optional

from app.core.config import settings


class TwilioService:
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        self.ssr_number = settings.TWILIO_SSR_NUMBER

    def generate_incoming_twiml(self) -> str:
        response = VoiceResponse()
        response.say(
            "Welcome to Air Mauritius SSR Airport. Connecting you to our AI assistant.",
            voice="alice",
            language="en-GB",
        )
        response.redirect(
            url=f"{settings.API_BASE_URL}/api/v1/voice/route-to-bland",
            method="POST",
        )
        return str(response)

    def generate_transfer_twiml(self, agent_number: str) -> str:
        response = VoiceResponse()
        response.say(
            "Please hold while we connect you to a customer service agent.",
            voice="alice",
            language="en-GB",
        )
        dial = Dial()
        dial.number(agent_number)
        response.append(dial)
        return str(response)

    async def make_outbound_call(self, to_number: str, message: str) -> str:
        call = self.client.calls.create(
            twiml=f"<Response><Say>{message}</Say></Response>",
            to=to_number,
            from_=self.ssr_number,
        )
        return call.sid

    async def send_sms(self, to_number: str, message: str) -> str:
        msg = self.client.messages.create(
            body=message,
            from_=self.ssr_number,
            to=to_number,
        )
        return msg.sid

    async def get_recording_url(self, call_sid: str) -> Optional[str]:
        recordings = self.client.recordings.list(call_sid=call_sid, limit=1)
        if recordings:
            rec = recordings[0]
            return f"https://api.twilio.com{rec.uri.replace('.json', '.mp3')}"
        return None
