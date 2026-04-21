from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class Channel(str, Enum):
    phone = "phone"
    whatsapp = "whatsapp"
    web = "web"
    mobile = "mobile"
    email = "email"


class Language(str, Enum):
    en = "en"
    fr = "fr"
    cr = "cr"
    hi = "hi"


class ConversationStatus(str, Enum):
    active = "active"
    escalated = "escalated"
    resolved = "resolved"
    abandoned = "abandoned"


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class PassengerContext(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=2000)
    language: Language = Language.en
    channel: Channel = Channel.web
    passenger_context: Optional[PassengerContext] = None


class ChatResponse(BaseModel):
    conversation_id: str
    response: str
    suggestions: List[str] = []
    language: Language
    escalated: bool = False
    escalation_reason: Optional[str] = None
    intent: Optional[str] = None
    tokens_used: int = 0


class Message(BaseModel):
    id: str
    role: MessageRole
    content: str
    language: Optional[Language] = None
    created_at: datetime
    tokens_used: Optional[int] = None


class ConversationDetail(BaseModel):
    id: str
    channel: Channel
    language: Language
    status: ConversationStatus
    messages: List[Message] = []
    created_at: datetime
    updated_at: datetime
