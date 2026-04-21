# SSR Airport AI — API Reference

Base URL: `https://api.ssr-ai.tiblogics.com` (prod) | `http://localhost:8000` (dev)

Interactive docs: `{base_url}/docs`

---

## Authentication

Most endpoints are public (webhook-friendly). Admin/dashboard endpoints require a Bearer token:

```http
Authorization: Bearer <token>
```

---

## Chat

### POST /api/v1/chat/message

Send a message and receive an AI response.

**Request:**
```json
{
  "message": "What time does flight MK014 depart?",
  "language": "en",
  "channel": "web",
  "conversation_id": null,
  "passenger_context": { "phone": "+230XXXXXXXX" }
}
```

**Response:**
```json
{
  "conversation_id": "uuid",
  "response": "Flight MK014 to Paris CDG departs at 23:50...",
  "suggestions": ["Ask about gate", "Check baggage"],
  "language": "en",
  "escalated": false,
  "escalation_reason": null,
  "intent": "flight_status",
  "tokens_used": 245
}
```

### GET /api/v1/chat/conversation/{id}

Retrieve conversation history.

### GET /api/v1/chat/history?phone=+230XXXXXXXX

List conversations for a passenger.

---

## Voice

### POST /api/v1/voice/incoming

Twilio webhook — incoming call. Returns TwiML.

### POST /api/v1/voice/status

Twilio status callback for call events.

### POST /api/v1/voice/bland-webhook

Bland.ai event webhook (call_ended, transfer, etc.).

### POST /api/v1/voice/escalate

```json
{ "call_sid": "CA...", "reason": "date_change_request", "priority": "high" }
```

### GET /api/v1/voice/transcripts/{call_id}

Full transcript with segments and analytics.

### GET /api/v1/voice/transcripts/search?query=MK014

Full-text search across all call transcripts.

### GET /api/v1/voice/transcripts/caller/{phone}

All transcripts for a specific caller.

### POST /api/v1/voice/transcripts/{id}/export

Export transcript as `pdf`, `txt`, `json`, or `docx`.

### GET /api/v1/voice/transcripts/analytics/summary?period=7d

Aggregate transcript analytics.

---

## Flights

### GET /api/v1/flights/{flight_number}

Real-time flight information.

**Response:**
```json
{
  "flight_number": "MK014",
  "airline": "Air Mauritius",
  "status": "On Time",
  "departure": { "airport": "MRU", "scheduled": "23:50", "gate": "B5" },
  "arrival": { "airport": "CDG", "scheduled": "07:15+1" }
}
```

### GET /api/v1/flights/?from=MRU&to=CDG&date=2026-04-25

Search flights by route and date.

---

## Bookings

### GET /api/v1/bookings/{pnr}

Look up a booking by PNR.

### POST /api/v1/bookings/{pnr}/services

Request a special service.

```json
{ "service_type": "special_meal", "service_code": "VGML", "notes": "Vegetarian" }
```

---

## Analytics

### GET /api/v1/analytics/dashboard?date=2026-04-21

Real-time dashboard metrics including automation rate, channel breakdown, language distribution.

### GET /api/v1/analytics/trends?period=7d

Historical trend data.

---

## WhatsApp

### POST /api/v1/whatsapp/incoming

Twilio WhatsApp webhook. Processes incoming messages and replies.

---

## Health

### GET /health

Returns `{"status": "ok"}` when the API is running.
