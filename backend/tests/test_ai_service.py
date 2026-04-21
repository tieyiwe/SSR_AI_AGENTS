import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.ai_service import SSRAIService
from app.utils.intent import IntentClassifier
from app.utils.language import detect_language
from app.utils.escalation import should_escalate


class TestIntentClassifier:
    def setup_method(self):
        self.clf = IntentClassifier()

    def test_flight_status_intent(self):
        assert self.clf.classify("What time does flight MK014 depart?") == "flight_status"

    def test_booking_lookup_intent(self):
        assert self.clf.classify("My booking reference is ABC123") == "booking_lookup"

    def test_pnr_servicing_intent(self):
        assert self.clf.classify("I need a vegetarian meal for my flight") == "pnr_servicing"

    def test_complaint_intent(self):
        assert self.clf.classify("I am very disappointed with the service") == "complaint"

    def test_extract_flight_number(self):
        entities = self.clf.extract_entities("What is the status of MK014?")
        assert entities.get("flight_number") == "MK014"

    def test_extract_pnr(self):
        entities = self.clf.extract_entities("My PNR is ABC123")
        assert entities.get("pnr") == "ABC123"


class TestLanguageDetection:
    def test_detects_english(self):
        assert detect_language("What time does my flight depart?") == "en"

    def test_detects_french(self):
        assert detect_language("Bonjour, je voudrais savoir l'heure de mon vol") == "fr"

    def test_detects_creole(self):
        assert detect_language("Bonzour, ki ler mo avion pou partir?") == "cr"

    def test_detects_hindi(self):
        assert detect_language("नमस्ते, मेरी उड़ान कब है?") == "hi"

    def test_defaults_to_english(self):
        assert detect_language("hello ok") == "en"


class TestEscalation:
    def test_escalates_cancellation(self):
        escalate, reason = should_escalate("I want to cancel my flight")
        assert escalate is True
        assert reason is not None

    def test_escalates_refund(self):
        escalate, reason = should_escalate("I need a full refund")
        assert escalate is True

    def test_no_escalation_normal_query(self):
        escalate, reason = should_escalate("What time does MK014 depart?")
        assert escalate is False

    def test_escalates_low_confidence(self):
        escalate, reason = should_escalate("Some query", ai_confidence=0.4)
        assert escalate is True

    def test_no_escalation_high_confidence(self):
        escalate, reason = should_escalate("Normal question", ai_confidence=0.9)
        assert escalate is False


class TestSSRAIService:
    def setup_method(self):
        self.service = SSRAIService()

    def test_parse_structured_output_valid(self):
        content = """Here is the information.

```json
{"intent": "flight_status", "entities": {"flight": "MK014"}, "suggestions": [], "escalate": false, "escalation_reason": null}
```"""
        result = self.service._parse_structured_output(content)
        assert result["intent"] == "flight_status"
        assert result["entities"]["flight"] == "MK014"
        assert result["escalate"] is False

    def test_parse_structured_output_missing(self):
        result = self.service._parse_structured_output("No JSON here")
        assert result == {}

    def test_strip_json_block(self):
        content = """Flight MK014 departs at 23:50.

```json
{"intent": "flight_status"}
```"""
        stripped = self.service._strip_json_block(content)
        assert "```json" not in stripped
        assert "Flight MK014 departs" in stripped

    def test_get_language_name(self):
        assert self.service._get_language_name("en") == "English"
        assert self.service._get_language_name("fr") == "French (Français)"
        assert self.service._get_language_name("cr") == "Mauritian Creole (Kreol Morisien)"
        assert self.service._get_language_name("hi") == "Hindi (हिन्दी)"
