from pydantic import BaseModel
from typing import Optional, Dict, List


class ChannelMetric(BaseModel):
    count: int
    ai_rate: float


class LanguageMetric(BaseModel):
    count: int
    percentage: float


class QueryType(BaseModel):
    type: str
    count: int


class DashboardMetrics(BaseModel):
    total_conversations: int
    ai_resolved: int
    human_escalated: int
    automation_rate: float
    avg_response_time_seconds: float
    avg_conversation_duration_seconds: float
    cost_today_usd: float
    cost_per_conversation_usd: float


class DashboardResponse(BaseModel):
    date: str
    metrics: DashboardMetrics
    by_channel: Dict[str, ChannelMetric]
    by_language: Dict[str, LanguageMetric]
    top_queries: List[QueryType]


class TranscriptAnalyticsSummary(BaseModel):
    period: str
    total_calls: int
    total_transcripts: int
    transcription_success_rate: float
    avg_confidence_score: Optional[float]
    sentiment_distribution: Dict[str, int]
    top_topics: List[Dict]
    avg_call_duration_seconds: Optional[float]
