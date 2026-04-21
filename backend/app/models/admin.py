from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class AgentConfig(BaseModel):
    agent_name: str = "Priya"
    voice_gender: str = "random"                    # male | female | random
    escalation_threshold: float = Field(0.7, ge=0.0, le=1.0)
    system_prompt_override: Optional[str] = None
    language_instructions: Dict[str, str] = {"en": "", "fr": "", "cr": "", "hi": ""}
    max_tokens: int = Field(1000, ge=100, le=4000)
    model: str = "claude-sonnet-4-20250514"
    enable_tool_use: bool = True


class LanguageTestRequest(BaseModel):
    message: str
    language: str = "en"


class LanguageTestResponse(BaseModel):
    input_message: str
    language: str
    detected_language: str
    response: str
    suggestions: List[str]
    intent: str
    escalation_needed: bool
    tokens_used: int


class ToolConnectorStatus(BaseModel):
    name: str
    label: str
    description: str
    status: str                         # mock | connected | unconfigured | error
    requires_config: List[str] = []
    last_tested: Optional[str] = None
    test_result: Optional[str] = None


class SystemStatus(BaseModel):
    database: str
    ai_service: str
    voice_service: str
    whatsapp_service: str
    api_keys: Dict[str, bool]
    version: str
    environment: str


class InteractionGrade(BaseModel):
    conversation_id: str
    grade: int = Field(..., ge=1, le=5)   # 1–5 stars
    task_completed: bool
    feedback: Optional[str] = None


class AdminAnalytics(BaseModel):
    total_graded: int
    avg_grade: float
    task_completion_rate: float
    grade_distribution: Dict[str, int]   # "1"–"5" → count
    by_channel: Dict[str, Dict]          # channel → {count, avg_grade}
    by_language: Dict[str, Dict]         # lang   → {count, avg_grade}
    recent_feedback: List[Dict]
    top_issues: List[Dict]
