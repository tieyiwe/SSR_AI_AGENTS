-- SSR Airport AI — Mock Data for Development & Testing

-- ============================================================
-- CONVERSATIONS
-- ============================================================

INSERT INTO conversations (id, channel, language, passenger_phone, status, resolution_type, sentiment, created_at) VALUES
('a1b2c3d4-0001-0001-0001-000000000001', 'phone', 'en', '+23057123456', 'resolved', 'ai_resolved', 'positive', NOW() - INTERVAL '2 hours'),
('a1b2c3d4-0002-0002-0002-000000000002', 'whatsapp', 'fr', '+23058234567', 'resolved', 'ai_resolved', 'neutral', NOW() - INTERVAL '3 hours'),
('a1b2c3d4-0003-0003-0003-000000000003', 'web', 'en', NULL, 'escalated', 'escalated', 'negative', NOW() - INTERVAL '1 hour'),
('a1b2c3d4-0004-0004-0004-000000000004', 'phone', 'cr', '+23059345678', 'resolved', 'ai_resolved', 'positive', NOW() - INTERVAL '4 hours'),
('a1b2c3d4-0005-0005-0005-000000000005', 'whatsapp', 'en', '+23054456789', 'active', NULL, 'neutral', NOW() - INTERVAL '15 minutes');

-- ============================================================
-- MESSAGES
-- ============================================================

INSERT INTO messages (conversation_id, role, content, language, tokens_used) VALUES
('a1b2c3d4-0001-0001-0001-000000000001', 'user', 'What time does flight MK014 depart tonight?', 'en', 12),
('a1b2c3d4-0001-0001-0001-000000000001', 'assistant', 'Flight MK014 to Paris CDG departs tonight at 23:50 from Gate B5. Check-in is open at Hall A, Desks 12-18. The flight is currently showing on time. Is there anything else I can help you with?', 'en', 58),
('a1b2c3d4-0002-0002-0002-000000000002', 'user', 'Je voudrais savoir le statut de mon vol MK042', 'fr', 14),
('a1b2c3d4-0002-0002-0002-000000000002', 'assistant', 'Le vol MK042 à destination de Singapour est prévu à 01:30 et est actuellement à l''heure. La porte d''embarquement sera annoncée 2 heures avant le départ. Y a-t-il autre chose que je puisse faire pour vous?', 'fr', 72),
('a1b2c3d4-0005-0005-0005-000000000005', 'user', 'Can I request a vegetarian meal for my flight?', 'en', 11),
('a1b2c3d4-0005-0005-0005-000000000005', 'assistant', 'Yes, I can help with that! To request a vegetarian meal (VGML), I will need your booking reference (PNR). Please note that special meal requests must be made at least 24 hours before departure. Could you please share your PNR number?', 'en', 55);

-- ============================================================
-- VOICE CALLS
-- ============================================================

INSERT INTO voice_calls (
    id, conversation_id, twilio_call_sid, bland_call_id, caller_number,
    direction, status, duration_seconds, language_detected, escalated,
    transcript, transcript_word_count, transcript_confidence_score, cost_usd,
    created_at, ended_at
) VALUES
(
    'b1c2d3e4-0001-0001-0001-000000000001',
    'a1b2c3d4-0001-0001-0001-000000000001',
    'CA0001aabbccdd0001',
    'bland_0001',
    '+23057123456',
    'inbound', 'completed', 145, 'en', false,
    'Assistant: Hello, Air Mauritius SSR Airport AI Assistant speaking. How may I help you today? Caller: What time does flight MK014 depart? Assistant: Flight MK014 to Paris CDG departs tonight at 23:50 from Gate B5. Caller: Great, thank you! Assistant: You are welcome, have a pleasant journey!',
    48, 94.5, 0.36,
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '145 seconds'
),
(
    'b1c2d3e4-0002-0002-0002-000000000002',
    'a1b2c3d4-0003-0003-0003-000000000003',
    'CA0002aabbccdd0002',
    'bland_0002',
    '+23056789012',
    'inbound', 'completed', 312, 'en', true,
    'Assistant: Hello, Air Mauritius SSR Airport AI Assistant. How may I help? Caller: I want to cancel my flight and get a full refund. Assistant: I understand you would like to cancel your booking. This requires our customer service team. Let me transfer you now. Caller: Fine, please hurry.',
    52, 91.2, 0.78,
    NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour' + INTERVAL '312 seconds'
);

-- ============================================================
-- TRANSCRIPT SEGMENTS
-- ============================================================

INSERT INTO call_transcript_segments (voice_call_id, segment_number, speaker, text, start_time_seconds, end_time_seconds, confidence_score) VALUES
('b1c2d3e4-0001-0001-0001-000000000001', 1, 'assistant', 'Hello, Air Mauritius SSR Airport AI Assistant speaking. How may I help you today?', 0.0, 3.2, 98.5),
('b1c2d3e4-0001-0001-0001-000000000001', 2, 'caller', 'What time does flight MK014 depart?', 3.5, 5.8, 92.3),
('b1c2d3e4-0001-0001-0001-000000000001', 3, 'assistant', 'Flight MK014 to Paris CDG departs tonight at 23:50 from Gate B5.', 6.0, 10.4, 97.8),
('b1c2d3e4-0001-0001-0001-000000000001', 4, 'caller', 'Great, thank you!', 10.8, 12.0, 95.1),
('b1c2d3e4-0001-0001-0001-000000000001', 5, 'assistant', 'You are welcome, have a pleasant journey!', 12.3, 14.8, 99.0);

-- ============================================================
-- TRANSCRIPT ANALYTICS
-- ============================================================

INSERT INTO transcript_analytics (
    voice_call_id, overall_sentiment, sentiment_score,
    dead_air_seconds, talk_over_count, agent_talk_percentage,
    questions_asked, apologies_count, thanks_count,
    escalation_keywords, complaint_detected, issue_category, resolution_achieved
) VALUES
(
    'b1c2d3e4-0001-0001-0001-000000000001',
    'positive', 0.78,
    1, 0, 62.5,
    1, 0, 2,
    '{}', false, 'flight_status', true
),
(
    'b1c2d3e4-0002-0002-0002-000000000002',
    'negative', -0.45,
    3, 1, 55.0,
    0, 0, 0,
    '{"cancel", "refund"}', true, 'refund', false
);

-- ============================================================
-- FLIGHT QUERIES
-- ============================================================

INSERT INTO flight_queries (conversation_id, flight_number, airline, query_type, response_data) VALUES
('a1b2c3d4-0001-0001-0001-000000000001', 'MK014', 'Air Mauritius', 'status', '{"status": "On Time", "gate": "B5", "departure": "23:50"}'),
('a1b2c3d4-0002-0002-0002-000000000002', 'MK042', 'Air Mauritius', 'status', '{"status": "On Time", "gate": "A8", "departure": "01:30"}');

-- ============================================================
-- ESCALATION QUEUE
-- ============================================================

INSERT INTO escalation_queue (conversation_id, priority, reason, status) VALUES
('a1b2c3d4-0003-0003-0003-000000000003', 'high', 'Passenger requesting flight cancellation and refund', 'pending');

-- ============================================================
-- DAILY METRICS (last 7 days)
-- ============================================================

INSERT INTO metrics_daily (date, channel, language, total_conversations, ai_resolved, human_escalated, abandoned, avg_response_time_seconds, positive_sentiment, neutral_sentiment, negative_sentiment, total_cost_usd) VALUES
(CURRENT_DATE, 'phone', 'en', 850, 620, 195, 35, 4.2, 490, 280, 80, 223.20),
(CURRENT_DATE, 'phone', 'fr', 580, 410, 145, 25, 4.5, 310, 210, 60, 152.40),
(CURRENT_DATE, 'whatsapp', 'en', 180, 155, 20, 5, 2.1, 130, 40, 10, 47.25),
(CURRENT_DATE, 'web', 'en', 95, 65, 25, 5, 1.8, 55, 30, 10, 17.10),
(CURRENT_DATE - 1, 'phone', 'en', 920, 660, 220, 40, 4.3, 530, 300, 90, 241.80),
(CURRENT_DATE - 1, 'phone', 'fr', 610, 430, 155, 25, 4.4, 325, 225, 60, 160.20),
(CURRENT_DATE - 2, 'phone', 'en', 780, 570, 175, 35, 4.1, 450, 250, 80, 204.60);
