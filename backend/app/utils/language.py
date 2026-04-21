from typing import Optional


FRENCH_INDICATORS = ["bonjour", "merci", "vol", "réservation", "billet", "aide", "comment", "pouvez", "voudrais", "heure", "départ", "arrivée"]
CREOLE_INDICATORS = ["bonzour", "mersi", "ki", "mo", "zot", "nou", "sa", "kouma", "eski", "kifer", "avion", "lerop"]
HINDI_INDICATORS = ["नमस्ते", "धन्यवाद", "उड़ान", "बुकिंग", "मदद", "हमारा", "कृपया", "आपका"]


def detect_language(text: str) -> str:
    tl = text.lower()

    # Check Hindi (Unicode range)
    hindi_chars = sum(1 for c in text if "ऀ" <= c <= "ॿ")
    if hindi_chars > 2:
        return "hi"

    # Check Creole before French (shares some words)
    creole_hits = sum(1 for w in CREOLE_INDICATORS if w in tl)
    if creole_hits >= 2:
        return "cr"

    french_hits = sum(1 for w in FRENCH_INDICATORS if w in tl)
    if french_hits >= 2:
        return "fr"

    return "en"


def get_language_name(code: str) -> str:
    return {
        "en": "English",
        "fr": "French",
        "cr": "Mauritian Creole",
        "hi": "Hindi",
    }.get(code, "English")
