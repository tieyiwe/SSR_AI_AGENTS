from pydantic_settings import BaseSettings
from typing import List, Optional
import os


def _parse_cors_origins(raw: str) -> List[str]:
    """Parse comma-separated CORS origins, stripping whitespace."""
    return [o.strip() for o in raw.split(",") if o.strip()]


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "SSR Airport AI"
    APP_ENV: str = "development"

    # Replit sets REPL_SLUG and REPL_OWNER — derive public URL automatically
    REPL_SLUG: str = ""
    REPL_OWNER: str = ""

    # These are computed in the property below if not explicitly set
    API_BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"

    SECRET_KEY: str = "change-me-in-production-32-chars-min"

    # CORS — comma-separated list. Wildcard "*" allowed in development.
    CORS_ORIGINS_RAW: str = "http://localhost:3000,http://localhost:8000"

    # Database — override with Supabase URL via Replit Secret
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/ssr_ai"

    # Redis — fully optional; leave blank to disable
    REDIS_URL: Optional[str] = None

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
        # Also accept CORS_ORIGINS as alias (legacy)
        extra = "ignore"

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """
        Build allowed origins list.
        - In development: always include localhost variants + Replit wildcard
        - Reads CORS_ORIGINS_RAW env var for explicit overrides
        """
        origins = _parse_cors_origins(self.CORS_ORIGINS_RAW)

        # Always permit localhost for local dev
        defaults = [
            "http://localhost:3000",
            "http://localhost:8000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:8000",
        ]
        for d in defaults:
            if d not in origins:
                origins.append(d)

        # Auto-add Replit public URLs when running inside a Repl
        if self.REPL_SLUG and self.REPL_OWNER:
            replit_urls = [
                f"https://{self.REPL_SLUG}.{self.REPL_OWNER}.repl.co",
                f"https://{self.REPL_SLUG}--{self.REPL_OWNER}.replit.app",
                # Webview URL (dev mode)
                f"https://{self.REPL_SLUG}-{self.REPL_OWNER}.replit.dev",
            ]
            for url in replit_urls:
                if url not in origins:
                    origins.append(url)

        return origins

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def allow_all_origins(self) -> bool:
        """In development allow all origins to avoid CORS friction."""
        return not self.is_production


settings = Settings()
