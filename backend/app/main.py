from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sentry_sdk

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.v1 import chat, voice, flights, bookings, analytics, whatsapp, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=0.1,
        environment=settings.APP_ENV,
    )

app = FastAPI(
    title="SSR Airport AI API",
    description="AI-powered passenger assistance for SSR International Airport, Mauritius",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow all origins in development (covers Replit workspace URLs),
# restrict to explicit list in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.allow_all_origins else settings.CORS_ORIGINS,
    allow_credentials=not settings.allow_all_origins,  # credentials require explicit origins
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(voice.router, prefix="/api/v1/voice", tags=["Voice"])
app.include_router(flights.router, prefix="/api/v1/flights", tags=["Flights"])
app.include_router(bookings.router, prefix="/api/v1/bookings", tags=["Bookings"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(whatsapp.router, prefix="/api/v1/whatsapp", tags=["WhatsApp"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "SSR Airport AI",
        "version": "1.0.0",
        "env": settings.APP_ENV,
    }


@app.get("/")
async def root():
    return {
        "service": "SSR Airport AI API",
        "docs": "/docs",
        "health": "/health",
    }
