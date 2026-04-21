import asyncpg
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None


async def init_db():
    global _pool
    try:
        _pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=30,
        )
        logger.info("Database connection pool created.")
    except Exception as exc:
        # On Replit, the DB may not be configured yet — warn but don't crash
        logger.warning(
            "Database connection failed: %s\n"
            "Set DATABASE_URL in Replit Secrets (Settings → Secrets).\n"
            "Endpoints that need the DB will return 503 until it's configured.",
            exc,
        )
        _pool = None


async def close_db():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError(
            "Database not available. "
            "Set DATABASE_URL in Replit Secrets and restart the Repl."
        )
    return _pool
