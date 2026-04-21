# Testing Guide

## Backend Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

### Test Coverage

| Module | Tests |
|--------|-------|
| Intent classification | Language detection, entity extraction |
| Language detection | EN/FR/CR/HI detection |
| Escalation logic | Trigger detection, priority |
| AI service | Output parsing, prompt building |
| Voice endpoints | TwiML generation, webhook handling |
| Flight/Booking | Mock data responses |

### Running specific tests

```bash
pytest tests/test_ai_service.py -v
pytest tests/test_voice_integration.py -v -k "test_flight_found"
```

---

## Voice Integration Tests

```bash
# Ensure backend is running
python scripts/test_voice.py
```

This simulates the complete voice call flow:
1. Health check
2. Flight lookup (MK014)
3. Booking lookup (ABC123)
4. Incoming Twilio call webhook
5. Bland.ai call_ended webhook

---

## Manual QA Scenarios

### Scenario 1: Flight Status (English)
1. Open chat widget at `/chat`
2. Type: "What time does flight MK014 depart?"
3. Expected: Departure time 23:50, Gate B5

### Scenario 2: PNR Lookup (French)
1. Switch language to Français
2. Type: "Mon numéro de réservation est ABC123"
3. Expected: Booking details in French

### Scenario 3: Escalation Trigger
1. Type: "I want to cancel my flight and get a refund"
2. Expected: Escalation message + human handoff

### Scenario 4: Vegetarian Meal Request
1. Type: "I need a vegetarian meal for my flight"
2. Expected: Request for PNR to process VGML request

### Scenario 5: Wheelchair Assistance
1. Type: "My mother needs wheelchair assistance"
2. Expected: WCHR/WCHS/WCHC explanation + PNR request

---

## Load Testing

```bash
# Install locust
pip install locust

# Run load test
locust -f tests/locustfile.py --host=http://localhost:8000
```

Target: 100 concurrent users, <5s response time.

---

## KPI Validation

Track these metrics after go-live:
- **Automation Rate:** Check `/api/v1/analytics/dashboard`
- **Response Time:** Monitor via Sentry Performance
- **NPS:** Post-interaction survey score
- **Escalation Rate:** `human_escalated / total_conversations`
