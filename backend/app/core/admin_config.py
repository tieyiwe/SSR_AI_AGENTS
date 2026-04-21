"""
Runtime admin configuration store.

Lives in process memory for the duration of the server lifetime.
All settings here are overridable from the Admin UI without restart.
Replace _store access with DB reads/writes once DATABASE_URL is configured.
"""
import random
import threading

_lock = threading.Lock()

_store: dict = {
    "agent_name": "Aida",
    "voice_gender": "random",           # male | female | random
    "escalation_threshold": 0.7,
    "system_prompt_override": None,     # None = use built-in optimised default
    "language_instructions": {
        "en": "",   # Additional EN instructions appended to system prompt
        "fr": "",   # Additional FR instructions
        "cr": "",   # Additional Creole instructions
        "hi": "",   # Additional Hindi instructions
    },
    "max_tokens": 1000,
    "model": "claude-sonnet-4-20250514",
    "enable_tool_use": True,            # Use Anthropic tool_use when API key present
}

# ── Bland.ai voice IDs ────────────────────────────────────────────────────────
_MALE_VOICES = ["nat", "ryan", "derek", "luke"]
_FEMALE_VOICES = ["luna", "lily", "maya", "sophie"]


def get_config() -> dict:
    with _lock:
        return dict(_store)


def update_config(updates: dict) -> dict:
    with _lock:
        _store.update(updates)
        return dict(_store)


def get_voice_id() -> str:
    """Return a Bland.ai voice ID based on the configured gender preference."""
    with _lock:
        gender = _store.get("voice_gender", "random")
    if gender == "male":
        return random.choice(_MALE_VOICES)
    elif gender == "female":
        return random.choice(_FEMALE_VOICES)
    # random — full pool so callers get different experiences each time
    return random.choice(_MALE_VOICES + _FEMALE_VOICES)
