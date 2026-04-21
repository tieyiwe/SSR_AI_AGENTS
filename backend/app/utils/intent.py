import re
from typing import Dict


INTENT_KEYWORDS = {
    "flight_status": ["flight", "status", "delayed", "on time", "departure", "arrival", "gate", "terminal", "check in", "depart", "arrive"],
    "booking_lookup": ["booking", "reservation", "pnr", "confirmation", "reference", "my booking", "my flight"],
    "pnr_servicing": ["change", "modify", "meal", "wheelchair", "seat", "assistance", "special request", "vegetarian", "vegan", "halal", "kosher", "diabetic", "gluten"],
    "airport_info": ["lounge", "wifi", "baggage", "facilities", "shops", "restaurants", "prayer room", "smoking", "parking", "atm", "currency"],
    "complaint": ["complaint", "unhappy", "disappointed", "angry", "frustrated", "terrible", "awful", "unacceptable", "problem", "issue"],
    "general_inquiry": ["how", "what", "when", "where", "can i", "is there", "help", "information"],
}


class IntentClassifier:
    def classify(self, message: str) -> str:
        ml = message.lower()
        scores = {
            intent: sum(1 for kw in kws if kw in ml)
            for intent, kws in INTENT_KEYWORDS.items()
        }
        best_score = max(scores.values())
        if best_score == 0:
            return "general_inquiry"
        return max(scores, key=scores.get)

    def extract_entities(self, message: str) -> Dict:
        entities: Dict = {}
        upper = message.upper()

        # Flight number: 2 letters + 3-4 digits (e.g. MK014, EK704)
        flights = re.findall(r"\b([A-Z]{2}\d{3,4})\b", upper)
        if flights:
            entities["flight_number"] = flights[0]

        # PNR: 3 letters + 3 digits (e.g. ABC123) or 6 alphanum
        pnrs = re.findall(r"\b([A-Z]{3}\d{3}|[A-Z0-9]{6})\b", upper)
        if pnrs:
            entities["pnr"] = pnrs[0]

        # Dates
        date_patterns = [
            r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",
            r"\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b",
            r"\b(\d{4}-\d{2}-\d{2})\b",
        ]
        for pat in date_patterns:
            dates = re.findall(pat, message.lower())
            if dates:
                entities["date"] = dates[0]
                break

        return entities
