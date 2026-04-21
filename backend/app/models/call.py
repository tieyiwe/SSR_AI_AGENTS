from pydantic import BaseModel
from typing import Optional, List


class TranscriptSegment(BaseModel):
    segment_number: int
    speaker: str
    text: str
    start_time: float
    end_time: float
    confidence: Optional[float] = None


class TranscriptData(BaseModel):
    full_text: str
    word_count: int
    confidence_score: Optional[float] = None
    segments: List[TranscriptSegment] = []


class CallAnalytics(BaseModel):
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
    dead_air_seconds: Optional[int] = None
    agent_talk_percentage: Optional[float] = None
    questions_asked: Optional[int] = None
    issue_resolved: Optional[bool] = None
    complaint_detected: Optional[bool] = None


class VoiceCallDetail(BaseModel):
    call_id: str
    call_sid: Optional[str] = None
    caller_number: str
    duration_seconds: Optional[int] = None
    created_at: str
    language_detected: Optional[str] = None
    transcript: Optional[TranscriptData] = None
    analytics: Optional[CallAnalytics] = None
    recording_url: Optional[str] = None
    escalated: bool = False


class TranscriptSearchResult(BaseModel):
    call_id: str
    call_sid: Optional[str] = None
    created_at: str
    caller_number: str
    excerpt: str
    relevance_score: float = 0.0


class TranscriptSearchResponse(BaseModel):
    total: int
    results: List[TranscriptSearchResult]
    page: int = 1
    per_page: int = 20


class EscalationRequest(BaseModel):
    call_sid: str
    reason: str
    priority: str = "normal"


class EscalationResponse(BaseModel):
    escalated: bool
    queue_position: int
    estimated_wait_minutes: int
