-- SSR Airport AI System — PostgreSQL Schema
-- Version 1.0 | April 2026

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Fuzzy text search

-- ============================================================
-- CONVERSATIONS
-- ============================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('phone', 'whatsapp', 'web', 'mobile', 'email')),
    language VARCHAR(5) DEFAULT 'en' CHECK (language IN ('en', 'fr', 'cr', 'hi')),
    passenger_phone VARCHAR(20),
    passenger_email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'escalated', 'resolved', 'abandoned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_type VARCHAR(20) CHECK (resolution_type IN ('ai_resolved', 'human_resolved', 'escalated')),
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_conversations_channel ON conversations(channel);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);
CREATE INDEX idx_conversations_phone ON conversations(passenger_phone);

-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    language VARCHAR(5) CHECK (language IN ('en', 'fr', 'cr', 'hi')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tokens_used INTEGER,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ============================================================
-- VOICE CALLS
-- ============================================================

CREATE TABLE voice_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id),
    twilio_call_sid VARCHAR(100) UNIQUE,
    bland_call_id VARCHAR(100),
    caller_number VARCHAR(20) NOT NULL,
    direction VARCHAR(10) DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'in-progress', 'completed', 'failed', 'no-answer', 'busy')),
    duration_seconds INTEGER,
    recording_url TEXT,
    recording_duration_seconds INTEGER,
    transcript TEXT,
    transcript_url TEXT,
    language_detected VARCHAR(5) CHECK (language_detected IN ('en', 'fr', 'cr', 'hi')),
    escalated BOOLEAN DEFAULT FALSE,
    escalation_reason TEXT,
    cost_usd DECIMAL(10, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',

    -- Transcript metadata
    transcript_generated_at TIMESTAMP WITH TIME ZONE,
    transcript_word_count INTEGER,
    transcript_confidence_score DECIMAL(5, 2),

    -- Full-text search vector (updated via trigger)
    transcript_vector tsvector
);

CREATE INDEX idx_voice_calls_caller ON voice_calls(caller_number);
CREATE INDEX idx_voice_calls_created ON voice_calls(created_at DESC);
CREATE INDEX idx_voice_calls_status ON voice_calls(status);
CREATE INDEX idx_voice_calls_bland_id ON voice_calls(bland_call_id);
CREATE INDEX idx_voice_calls_twilio_sid ON voice_calls(twilio_call_sid);
CREATE INDEX idx_voice_calls_transcript_search ON voice_calls USING GIN(transcript_vector);

-- Trigger to update tsvector on transcript change
CREATE OR REPLACE FUNCTION update_transcript_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.transcript_vector := to_tsvector('english', COALESCE(NEW.transcript, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_transcript_vector
    BEFORE INSERT OR UPDATE OF transcript ON voice_calls
    FOR EACH ROW EXECUTE FUNCTION update_transcript_vector();

-- ============================================================
-- CALL TRANSCRIPT SEGMENTS
-- ============================================================

CREATE TABLE call_transcript_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voice_call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
    segment_number INTEGER NOT NULL,
    speaker VARCHAR(20) NOT NULL CHECK (speaker IN ('caller', 'assistant', 'agent')),
    text TEXT NOT NULL,
    start_time_seconds DECIMAL(10, 2),
    end_time_seconds DECIMAL(10, 2),
    confidence_score DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(voice_call_id, segment_number)
);

CREATE INDEX idx_transcript_segments_call ON call_transcript_segments(voice_call_id);
CREATE INDEX idx_transcript_segments_speaker ON call_transcript_segments(speaker);

-- ============================================================
-- TRANSCRIPT ANALYTICS
-- ============================================================

CREATE TABLE transcript_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voice_call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,

    -- Sentiment
    overall_sentiment VARCHAR(20) CHECK (overall_sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score DECIMAL(5, 2),

    -- Call quality
    dead_air_seconds INTEGER DEFAULT 0,
    talk_over_count INTEGER DEFAULT 0,
    agent_talk_percentage DECIMAL(5, 2),

    -- Key phrases
    questions_asked INTEGER DEFAULT 0,
    apologies_count INTEGER DEFAULT 0,
    thanks_count INTEGER DEFAULT 0,
    escalation_keywords TEXT[],

    -- Issue detection
    complaint_detected BOOLEAN DEFAULT FALSE,
    issue_category VARCHAR(50),
    resolution_achieved BOOLEAN,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(voice_call_id)
);

CREATE INDEX idx_transcript_analytics_sentiment ON transcript_analytics(overall_sentiment);
CREATE INDEX idx_transcript_analytics_complaint ON transcript_analytics(complaint_detected);
CREATE INDEX idx_transcript_analytics_category ON transcript_analytics(issue_category);

-- ============================================================
-- FLIGHT QUERIES
-- ============================================================

CREATE TABLE flight_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id),
    flight_number VARCHAR(10) NOT NULL,
    airline VARCHAR(50),
    query_type VARCHAR(50) CHECK (query_type IN ('status', 'schedule', 'gate', 'delay', 'arrival', 'departure')),
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_flight_queries_number ON flight_queries(flight_number);
CREATE INDEX idx_flight_queries_created ON flight_queries(created_at DESC);

-- ============================================================
-- PNR QUERIES
-- ============================================================

CREATE TABLE pnr_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id),
    pnr VARCHAR(10) NOT NULL,
    query_type VARCHAR(50) CHECK (query_type IN ('lookup', 'meal_request', 'wheelchair', 'date_change', 'cancellation', 'seat_change', 'baggage')),
    passenger_verified BOOLEAN DEFAULT FALSE,
    action_taken VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_pnr_queries_pnr ON pnr_queries(pnr);
CREATE INDEX idx_pnr_queries_created ON pnr_queries(created_at DESC);

-- ============================================================
-- DAILY METRICS
-- ============================================================

CREATE TABLE metrics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    channel VARCHAR(20),
    language VARCHAR(5),

    -- Volume
    total_conversations INTEGER DEFAULT 0,
    ai_resolved INTEGER DEFAULT 0,
    human_escalated INTEGER DEFAULT 0,
    abandoned INTEGER DEFAULT 0,

    -- Performance
    avg_response_time_seconds DECIMAL(10, 2),
    avg_conversation_duration_seconds DECIMAL(10, 2),
    avg_messages_per_conversation DECIMAL(10, 2),

    -- Satisfaction
    positive_sentiment INTEGER DEFAULT 0,
    neutral_sentiment INTEGER DEFAULT 0,
    negative_sentiment INTEGER DEFAULT 0,

    -- Cost
    total_cost_usd DECIMAL(10, 2),
    cost_per_conversation DECIMAL(10, 4),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, channel, language)
);

CREATE INDEX idx_metrics_date ON metrics_daily(date DESC);

-- ============================================================
-- ESCALATION QUEUE
-- ============================================================

CREATE TABLE escalation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
    reason TEXT,
    assigned_to VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

CREATE INDEX idx_escalation_status ON escalation_queue(status);
CREATE INDEX idx_escalation_priority ON escalation_queue(priority);
CREATE INDEX idx_escalation_created ON escalation_queue(created_at DESC);

-- ============================================================
-- SYSTEM CONFIGURATION
-- ============================================================

CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO system_config (key, value, description) VALUES
('ai_model', '"claude-sonnet-4-20250514"', 'Claude model version'),
('max_tokens', '1000', 'Max tokens per AI response'),
('escalation_threshold', '0.7', 'Confidence threshold below which to escalate'),
('supported_languages', '["en", "fr", "cr", "hi"]', 'Supported conversation languages'),
('business_hours', '{"start": "06:00", "end": "23:00", "timezone": "Indian/Mauritius"}', 'Operating hours'),
('voice_enabled', 'true', 'Voice AI feature flag'),
('whatsapp_enabled', 'true', 'WhatsApp feature flag'),
('email_enabled', 'false', 'Email AI feature flag'),
('rate_limit_requests', '100', 'API rate limit per window'),
('rate_limit_window_seconds', '60', 'Rate limit window duration');

-- ============================================================
-- UPDATED_AT TRIGGER (reusable)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
