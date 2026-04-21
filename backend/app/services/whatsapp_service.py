from twilio.rest import Client
from typing import Optional, List

from app.core.config import settings


class WhatsAppService:
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        self.wa_number = f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}"

    async def send_message(
        self,
        to_number: str,
        message: str,
        media_urls: Optional[List[str]] = None,
    ) -> str:
        params = {
            "from_": self.wa_number,
            "to": f"whatsapp:{to_number}",
            "body": message,
        }
        if media_urls:
            params["media_url"] = media_urls

        msg = self.client.messages.create(**params)
        return msg.sid

    def parse_incoming(self, form_data: dict) -> dict:
        return {
            "from_number": form_data.get("From", "").replace("whatsapp:", ""),
            "to_number": form_data.get("To", "").replace("whatsapp:", ""),
            "body": form_data.get("Body", ""),
            "message_sid": form_data.get("MessageSid", ""),
            "num_media": int(form_data.get("NumMedia", 0)),
        }
