from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "SSR Airport AI"
    APP_ENV: str = "development"
    API_BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"
    SECRET_KEY: str = "change-me-in-production-32-chars-min"
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/ssr_ai"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # Anthropic
    ANTHROPIC_API_KEY: str = ""

    # Bland.ai
    BLAND_AI_API_KEY: str = ""

    # Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_SSR_NUMBER: str = "+230603800"
    TWILIO_WHATSAPP_NUMBER: str = "+14155238886"
    SSR_HUMAN_AGENTS_NUMBER: str = ""

    # SSR Systems
    FIDS_API_URL: str = "https://fids.ssr-airport.mu/api"
    FIDS_API_KEY: str = ""
    BOOKING_SYSTEM_URL: str = "https://booking.airmauritius.com/api"
    BOOKING_SYSTEM_API_KEY: str = ""
    CISCO_IPCC_WEBHOOK_URL: str = ""

    # Monitoring
    SENTRY_DSN: str = ""
    LOGTAIL_TOKEN: str = ""

    # Feature flags
    VOICE_AI_ENABLED: bool = True
    WHATSAPP_ENABLED: bool = True
    EMAIL_AI_ENABLED: bool = False

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


settings = Settings()
