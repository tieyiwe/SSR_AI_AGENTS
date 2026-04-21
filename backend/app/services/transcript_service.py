import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional


from app.core.database import get_pool


class TranscriptService:
    async def save_transcript(
        self, call_id: str, bland_call_id: str, transcript_data: Dict
    ) -> Dict:
        full_transcript = transcript_data.get("transcript", "")
        segments = transcript_data.get("concatenated_transcript", [])

        word_count = len(full_transcript.split())
        confidence_score = self._calculate_avg_confidence(segments)

        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE voice_calls
                SET transcript = $1,
                    transcript_generated_at = NOW(),
                    transcript_word_count = $2,
                    transcript_confidence_score = $3
                WHERE bland_call_id = $4
                """,
                full_transcript, word_count, confidence_score, bland_call_id,
            )

            voice_call_id = await conn.fetchval(
                "SELECT id FROM voice_calls WHERE bland_call_id = $1", bland_call_id
            )

            if not voice_call_id:
                return {"error": "Call not found"}

            for idx, segment in enumerate(segments):
                speaker_raw = segment.get("user", "caller")
                speaker = "caller" if speaker_raw.lower() == "user" else "assistant"
                await conn.execute(
                    """
                    INSERT INTO call_transcript_segments
                    (voice_call_id, segment_number, speaker, text,
                     start_time_seconds, end_time_seconds, confidence_score)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (voice_call_id, segment_number) DO NOTHING
                    """,
                    voice_call_id,
                    idx + 1,
                    speaker,
                    segment.get("text", ""),
                    float(segment.get("start", 0)),
                    float(segment.get("end", 0)),
                    float(segment.get("confidence", 0)),
                )

            analytics = self._generate_analytics(full_transcript, segments)
            await conn.execute(
                """
                INSERT INTO transcript_analytics
                (voice_call_id, overall_sentiment, sentiment_score,
                 dead_air_seconds, talk_over_count, agent_talk_percentage,
                 questions_asked, apologies_count, thanks_count,
                 escalation_keywords, complaint_detected, issue_category, resolution_achieved)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (voice_call_id) DO UPDATE SET
                    overall_sentiment = EXCLUDED.overall_sentiment,
                    sentiment_score = EXCLUDED.sentiment_score,
                    resolution_achieved = EXCLUDED.resolution_achieved
                """,
                voice_call_id,
                analytics["sentiment"],
                analytics["sentiment_score"],
                analytics["dead_air_seconds"],
                analytics["talk_over_count"],
                analytics["agent_talk_percentage"],
                analytics["questions_asked"],
                analytics["apologies_count"],
                analytics["thanks_count"],
                analytics["escalation_keywords"],
                analytics["complaint_detected"],
                analytics["issue_category"],
                analytics["resolution_achieved"],
            )

        return {
            "voice_call_id": str(voice_call_id),
            "transcript_saved": True,
            "word_count": word_count,
            "confidence_score": confidence_score,
            "segments_count": len(segments),
        }

    async def get_transcript(self, call_id: str) -> Optional[Dict]:
        pool = get_pool()
        async with pool.acquire() as conn:
            call = await conn.fetchrow(
                """
                SELECT v.id, v.twilio_call_sid, v.caller_number, v.duration_seconds,
                       v.created_at, v.language_detected, v.transcript,
                       v.transcript_word_count, v.transcript_confidence_score,
                       v.recording_url, v.escalated
                FROM voice_calls v
                WHERE v.id = $1
                """,
                call_id,
            )
            if not call:
                return None

            segments = await conn.fetch(
                """
                SELECT segment_number, speaker, text,
                       start_time_seconds, end_time_seconds, confidence_score
                FROM call_transcript_segments
                WHERE voice_call_id = $1
                ORDER BY segment_number
                """,
                call_id,
            )

            analytics = await conn.fetchrow(
                """
                SELECT overall_sentiment, sentiment_score, dead_air_seconds,
                       agent_talk_percentage, questions_asked, complaint_detected,
                       issue_category, resolution_achieved
                FROM transcript_analytics
                WHERE voice_call_id = $1
                """,
                call_id,
            )

        return {
            "call_id": str(call["id"]),
            "call_sid": call["twilio_call_sid"],
            "caller_number": call["caller_number"],
            "duration_seconds": call["duration_seconds"],
            "created_at": call["created_at"].isoformat(),
            "language_detected": call["language_detected"],
            "transcript": {
                "full_text": call["transcript"],
                "word_count": call["transcript_word_count"],
                "confidence_score": float(call["transcript_confidence_score"]) if call["transcript_confidence_score"] else None,
                "segments": [
                    {
                        "segment_number": s["segment_number"],
                        "speaker": s["speaker"],
                        "text": s["text"],
                        "start_time": float(s["start_time_seconds"]),
                        "end_time": float(s["end_time_seconds"]),
                        "confidence": float(s["confidence_score"]) if s["confidence_score"] else None,
                    }
                    for s in segments
                ],
            },
            "analytics": {
                "sentiment": analytics["overall_sentiment"] if analytics else None,
                "sentiment_score": float(analytics["sentiment_score"]) if analytics and analytics["sentiment_score"] else None,
                "dead_air_seconds": analytics["dead_air_seconds"] if analytics else None,
                "agent_talk_percentage": float(analytics["agent_talk_percentage"]) if analytics and analytics["agent_talk_percentage"] else None,
                "questions_asked": analytics["questions_asked"] if analytics else None,
                "issue_resolved": analytics["resolution_achieved"] if analytics else None,
                "complaint_detected": analytics["complaint_detected"] if analytics else None,
            },
            "recording_url": call["recording_url"],
            "escalated": call["escalated"],
        } if call else None

    async def search_transcripts(
        self,
        query: str,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        caller_number: Optional[str] = None,
        sentiment: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Dict:
        pool = get_pool()
        conditions = ["v.transcript IS NOT NULL"]
        params: List = []
        n = 1

        if query:
            conditions.append(f"v.transcript_vector @@ plainto_tsquery('english', ${n})")
            params.append(query)
            n += 1
        if from_date:
            conditions.append(f"v.created_at >= ${n}")
            params.append(from_date)
            n += 1
        if to_date:
            conditions.append(f"v.created_at <= ${n}")
            params.append(to_date)
            n += 1
        if caller_number:
            conditions.append(f"v.caller_number = ${n}")
            params.append(caller_number)
            n += 1
        if sentiment:
            conditions.append(f"ta.overall_sentiment = ${n}")
            params.append(sentiment)
            n += 1

        where = " AND ".join(conditions)

        rank_expr = (
            "ts_rank(v.transcript_vector, plainto_tsquery('english', $1))"
            if query
            else "0"
        )

        async with pool.acquire() as conn:
            total = await conn.fetchval(
                f"""
                SELECT COUNT(*) FROM voice_calls v
                LEFT JOIN transcript_analytics ta ON ta.voice_call_id = v.id
                WHERE {where}
                """,
                *params,
            )

            results = await conn.fetch(
                f"""
                SELECT v.id, v.twilio_call_sid, v.caller_number, v.created_at,
                       v.transcript, v.duration_seconds,
                       {rank_expr} AS relevance_score
                FROM voice_calls v
                LEFT JOIN transcript_analytics ta ON ta.voice_call_id = v.id
                WHERE {where}
                ORDER BY relevance_score DESC, v.created_at DESC
                LIMIT ${n} OFFSET ${n + 1}
                """,
                *params, limit, offset,
            )

        return {
            "total": total,
            "results": [
                {
                    "call_id": str(r["id"]),
                    "call_sid": r["twilio_call_sid"],
                    "created_at": r["created_at"].isoformat(),
                    "caller_number": r["caller_number"],
                    "excerpt": self._generate_excerpt(r["transcript"], query),
                    "relevance_score": float(r["relevance_score"]) if r["relevance_score"] else 0.0,
                }
                for r in results
            ],
            "page": (offset // limit) + 1,
            "per_page": limit,
        }

    async def get_caller_history(self, caller_number: str, limit: int = 10) -> Dict:
        pool = get_pool()
        async with pool.acquire() as conn:
            calls = await conn.fetch(
                """
                SELECT v.id, v.created_at, v.duration_seconds, v.transcript,
                       ta.overall_sentiment, ta.issue_category, ta.resolution_achieved
                FROM voice_calls v
                LEFT JOIN transcript_analytics ta ON ta.voice_call_id = v.id
                WHERE v.caller_number = $1
                ORDER BY v.created_at DESC
                LIMIT $2
                """,
                caller_number, limit,
            )

        return {
            "caller_number": caller_number,
            "total_calls": len(calls),
            "calls": [
                {
                    "call_id": str(c["id"]),
                    "created_at": c["created_at"].isoformat(),
                    "duration_seconds": c["duration_seconds"],
                    "summary": self._generate_summary(c["transcript"]),
                    "transcript_preview": (c["transcript"][:200] + "...") if c["transcript"] and len(c["transcript"]) > 200 else c["transcript"],
                    "sentiment": c["overall_sentiment"],
                    "issue_category": c["issue_category"],
                    "resolved": c["resolution_achieved"],
                }
                for c in calls
            ],
        }

    async def get_analytics_summary(self, period_days: int = 7) -> Dict:
        from_date = datetime.now() - timedelta(days=period_days)
        pool = get_pool()
        async with pool.acquire() as conn:
            summary = await conn.fetchrow(
                """
                SELECT COUNT(*) as total_calls,
                       COUNT(v.transcript) as total_transcripts,
                       AVG(v.transcript_confidence_score) as avg_confidence,
                       COUNT(*) FILTER (WHERE ta.overall_sentiment = 'positive') as positive_count,
                       COUNT(*) FILTER (WHERE ta.overall_sentiment = 'neutral') as neutral_count,
                       COUNT(*) FILTER (WHERE ta.overall_sentiment = 'negative') as negative_count,
                       AVG(v.duration_seconds) as avg_duration
                FROM voice_calls v
                LEFT JOIN transcript_analytics ta ON ta.voice_call_id = v.id
                WHERE v.created_at >= $1
                """,
                from_date,
            )

            top_topics = await conn.fetch(
                """
                SELECT ta.issue_category AS topic, COUNT(*) AS count
                FROM transcript_analytics ta
                JOIN voice_calls v ON v.id = ta.voice_call_id
                WHERE v.created_at >= $1 AND ta.issue_category IS NOT NULL
                GROUP BY ta.issue_category
                ORDER BY count DESC
                LIMIT 10
                """,
                from_date,
            )

        total = summary["total_calls"] or 0
        transcripts = summary["total_transcripts"] or 0
        rate = (transcripts / total * 100) if total > 0 else 0

        return {
            "period": f"{period_days}d",
            "total_calls": total,
            "total_transcripts": transcripts,
            "transcription_success_rate": round(rate, 1),
            "avg_confidence_score": round(float(summary["avg_confidence"]), 1) if summary["avg_confidence"] else None,
            "sentiment_distribution": {
                "positive": summary["positive_count"],
                "neutral": summary["neutral_count"],
                "negative": summary["negative_count"],
            },
            "top_topics": [{"topic": t["topic"], "count": t["count"]} for t in top_topics],
            "avg_call_duration_seconds": round(float(summary["avg_duration"]), 0) if summary["avg_duration"] else None,
        }

    # ── Helpers ──────────────────────────────────────────────

    def _calculate_avg_confidence(self, segments: List[Dict]) -> float:
        if not segments:
            return 0.0
        vals = [s.get("confidence", 0) for s in segments if s.get("confidence")]
        return sum(vals) / len(vals) if vals else 0.0

    def _generate_analytics(self, transcript: str, segments: List[Dict]) -> Dict:
        sentiment, score = self._analyze_sentiment(transcript)
        return {
            "sentiment": sentiment,
            "sentiment_score": score,
            "dead_air_seconds": self._calculate_dead_air(segments),
            "talk_over_count": 0,
            "agent_talk_percentage": self._calculate_agent_talk_pct(segments),
            "questions_asked": len(re.findall(r"\?", transcript)),
            "apologies_count": len(re.findall(r"\b(sorry|apologize|apologies)\b", transcript.lower())),
            "thanks_count": len(re.findall(r"\b(thank|thanks|appreciate)\b", transcript.lower())),
            "escalation_keywords": self._detect_escalation_keywords(transcript),
            "complaint_detected": self._detect_complaint(transcript),
            "issue_category": self._categorize_issue(transcript),
            "resolution_achieved": self._detect_resolution(transcript),
        }

    def _analyze_sentiment(self, text: str):
        pos = ["thank", "great", "perfect", "excellent", "wonderful", "appreciate", "helpful"]
        neg = ["complaint", "unhappy", "disappointed", "angry", "frustrated", "terrible", "awful"]
        tl = text.lower()
        pc = sum(1 for w in pos if w in tl)
        nc = sum(1 for w in neg if w in tl)
        if pc > nc:
            return "positive", min(0.5 + pc * 0.1, 1.0)
        if nc > pc:
            return "negative", max(-0.5 - nc * 0.1, -1.0)
        return "neutral", 0.0

    def _calculate_dead_air(self, segments: List[Dict]) -> int:
        dead = 0
        for i in range(len(segments) - 1):
            gap = segments[i + 1].get("start", 0) - segments[i].get("end", 0)
            if gap > 2:
                dead += gap
        return int(dead)

    def _calculate_agent_talk_pct(self, segments: List[Dict]) -> float:
        agent_time = sum(
            s.get("end", 0) - s.get("start", 0)
            for s in segments
            if s.get("user", "").lower() in ("assistant", "agent")
        )
        total = max((s.get("end", 0) for s in segments), default=1)
        return (agent_time / total * 100) if total > 0 else 0.0

    def _detect_escalation_keywords(self, text: str) -> List[str]:
        kws = ["supervisor", "manager", "complaint", "lawyer", "refund", "cancel", "unacceptable"]
        return [k for k in kws if k in text.lower()]

    def _detect_complaint(self, text: str) -> bool:
        indicators = ["complaint", "unhappy", "disappointed", "unacceptable", "terrible", "awful"]
        return any(i in text.lower() for i in indicators)

    def _categorize_issue(self, text: str) -> str:
        cats = {
            "flight_status": ["flight", "delayed", "on time", "departure", "arrival"],
            "booking": ["booking", "reservation", "pnr", "confirm"],
            "pnr_servicing": ["change", "meal", "wheelchair", "seat", "date"],
            "baggage": ["baggage", "luggage", "lost", "bag"],
            "refund": ["refund", "money back", "reimbursement"],
            "general_info": ["information", "lounge", "terminal", "gate"],
        }
        tl = text.lower()
        scores = {cat: sum(1 for kw in kws if kw in tl) for cat, kws in cats.items()}
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else "other"

    def _detect_resolution(self, text: str) -> bool:
        indicators = ["resolved", "thank you", "perfect", "that helps", "great", "got it"]
        return any(i in text.lower() for i in indicators)

    def _generate_excerpt(self, text: str, query: str, max_length: int = 200) -> str:
        if not text:
            return ""
        if not query:
            return text[:max_length] + ("..." if len(text) > max_length else "")
        pos = text.lower().find(query.lower())
        if pos == -1:
            return text[:max_length] + "..."
        start = max(0, pos - max_length // 2)
        end = min(len(text), pos + max_length // 2)
        excerpt = text[start:end]
        if start > 0:
            excerpt = "..." + excerpt
        if end < len(text):
            excerpt += "..."
        return excerpt

    def _generate_summary(self, transcript: str) -> str:
        if not transcript:
            return "No transcript available"
        first = transcript.split(".")[0] if "." in transcript else transcript[:100]
        return (first[:150] + "...") if len(first) > 150 else first
