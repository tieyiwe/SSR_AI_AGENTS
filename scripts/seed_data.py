#!/usr/bin/env python3
"""
Seed the database with mock data for development
Usage: python scripts/seed_data.py
"""

import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ssr_user:ssr_password@localhost:5432/ssr_ai")


async def seed():
    print(f"Connecting to: {DATABASE_URL}")
    conn = await asyncpg.connect(DATABASE_URL)

    print("Applying schema...")
    with open("database/schema.sql") as f:
        await conn.execute(f.read())

    print("Seeding mock data...")
    with open("database/seeds/mock_data.sql") as f:
        await conn.execute(f.read())

    # Verify
    count = await conn.fetchval("SELECT COUNT(*) FROM conversations")
    print(f"  Conversations: {count}")

    count = await conn.fetchval("SELECT COUNT(*) FROM voice_calls")
    print(f"  Voice calls: {count}")

    count = await conn.fetchval("SELECT COUNT(*) FROM metrics_daily")
    print(f"  Daily metrics: {count}")

    await conn.close()
    print("Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
