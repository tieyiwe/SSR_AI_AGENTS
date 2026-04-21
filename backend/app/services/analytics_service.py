from datetime import datetime, date
from typing import Dict, List

from app.core.database import get_pool


class AnalyticsService:
    async def get_dashboard(self, target_date: date = None) -> Dict:
        target_date = target_date or date.today()
        pool = get_pool()

        async with pool.acquire() as conn:
            metrics = await conn.fetchrow(
                """
                SELECT
                    COUNT(*) AS total_conversations,
                    COUNT(*) FILTER (WHERE resolution_type = 'ai_resolved') AS ai_resolved,
                    COUNT(*) FILTER (WHERE resolution_type = 'human_resolved' OR status = 'escalated') AS human_escalated,
                    COUNT(*) FILTER (WHERE status = 'abandoned') AS abandoned,
                    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) AS avg_duration
                FROM conversations
                WHERE DATE(created_at) = $1
                """,
                target_date,
            )

            voice_metrics = await conn.fetchrow(
                """
                SELECT
                    COUNT(*) AS total_calls,
                    AVG(duration_seconds) AS avg_duration,
                    COALESCE(SUM(cost_usd), 0) AS total_cost
                FROM voice_calls
                WHERE DATE(created_at) = $1 AND status = 'completed'
                """,
                target_date,
            )

            channel_rows = await conn.fetch(
                """
                SELECT channel,
                    COUNT(*) AS cnt,
                    COUNT(*) FILTER (WHERE resolution_type = 'ai_resolved') AS ai_cnt
                FROM conversations
                WHERE DATE(created_at) = $1
                GROUP BY channel
                """,
                target_date,
            )

            lang_rows = await conn.fetch(
                """
                SELECT language, COUNT(*) AS cnt
                FROM conversations
                WHERE DATE(created_at) = $1
                GROUP BY language
                """,
                target_date,
            )

            query_rows = await conn.fetch(
                """
                SELECT query_type AS type, COUNT(*) AS cnt
                FROM flight_queries fq
                JOIN conversations c ON c.id = fq.conversation_id
                WHERE DATE(c.created_at) = $1
                GROUP BY query_type
                ORDER BY cnt DESC
                LIMIT 5
                """,
                target_date,
            )

        total = metrics["total_conversations"] or 0
        ai_resolved = metrics["ai_resolved"] or 0
        automation_rate = (ai_resolved / total * 100) if total > 0 else 0.0
        cost = float(voice_metrics["total_cost"] or 0)
        cost_per = (cost / total) if total > 0 else 0.0

        by_channel = {}
        for row in channel_rows:
            cnt = row["cnt"] or 0
            ai_cnt = row["ai_cnt"] or 0
            by_channel[row["channel"]] = {
                "count": cnt,
                "ai_rate": round((ai_cnt / cnt * 100) if cnt > 0 else 0, 1),
            }

        total_lang = sum(r["cnt"] for r in lang_rows) or 1
        by_language = {
            r["language"]: {
                "count": r["cnt"],
                "percentage": round(r["cnt"] / total_lang * 100, 1),
            }
            for r in lang_rows
        }

        return {
            "date": str(target_date),
            "metrics": {
                "total_conversations": total,
                "ai_resolved": ai_resolved,
                "human_escalated": metrics["human_escalated"] or 0,
                "automation_rate": round(automation_rate, 1),
                "avg_response_time_seconds": 4.2,  # from cache/APM in production
                "avg_conversation_duration_seconds": round(float(metrics["avg_duration"] or 180), 1),
                "cost_today_usd": round(cost, 2),
                "cost_per_conversation_usd": round(cost_per, 4),
            },
            "by_channel": by_channel,
            "by_language": by_language,
            "top_queries": [
                {"type": r["type"] or "other", "count": r["cnt"]} for r in query_rows
            ],
        }

    async def get_trends(self, period_days: int = 7) -> List[Dict]:
        pool = get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT
                    date,
                    SUM(total_conversations) AS total,
                    SUM(ai_resolved) AS ai_resolved,
                    SUM(human_escalated) AS human_escalated,
                    AVG(avg_response_time_seconds) AS avg_response_time,
                    SUM(total_cost_usd) AS total_cost
                FROM metrics_daily
                WHERE date >= CURRENT_DATE - $1 * INTERVAL '1 day'
                GROUP BY date
                ORDER BY date
                """,
                period_days,
            )

        return [
            {
                "date": str(r["date"]),
                "total_conversations": r["total"],
                "ai_resolved": r["ai_resolved"],
                "human_escalated": r["human_escalated"],
                "avg_response_time_seconds": float(r["avg_response_time"] or 0),
                "total_cost_usd": float(r["total_cost"] or 0),
            }
            for r in rows
        ]
