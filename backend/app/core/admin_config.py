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
    "agent_name": "Priya",
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

# ── Voice persona database ────────────────────────────────────────────────────
# Each persona pairs a common Mauritian name with a Bland.ai voice ID.
# Names span the island's communities: Indo-Mauritian, Creole, Franco-Mauritian.
# Female voices: luna, lily, maya, sophie
# Male voices:   nat, ryan, derek, luke
_VOICE_PERSONAS: list[dict] = [
    # ── Female ──────────────────────────────────────────────────────────────
    {"name": "Priya",   "voice": "luna",   "gender": "female"},  # Indo-Mauritian
    {"name": "Nisha",   "voice": "lily",   "gender": "female"},  # Indo-Mauritian
    {"name": "Kavya",   "voice": "maya",   "gender": "female"},  # Indo-Mauritian
    {"name": "Anisha",  "voice": "sophie", "gender": "female"},  # Indo-Mauritian
    {"name": "Divya",   "voice": "luna",   "gender": "female"},  # Indo-Mauritian
    {"name": "Asha",    "voice": "lily",   "gender": "female"},  # Indo-Mauritian
    {"name": "Jade",    "voice": "maya",   "gender": "female"},  # Creole/Franco-Mauritian
    {"name": "Chloé",   "voice": "sophie", "gender": "female"},  # Franco-Mauritian
    {"name": "Emma",    "voice": "luna",   "gender": "female"},  # Creole
    {"name": "Layla",   "voice": "lily",   "gender": "female"},  # cross-community
    # ── Male ────────────────────────────────────────────────────────────────
    {"name": "Rohan",   "voice": "nat",    "gender": "male"},    # Indo-Mauritian
    {"name": "Aryan",   "voice": "ryan",   "gender": "male"},    # Indo-Mauritian
    {"name": "Nikhil",  "voice": "derek",  "gender": "male"},    # Indo-Mauritian
    {"name": "Dev",     "voice": "luke",   "gender": "male"},    # Indo-Mauritian
    {"name": "Raj",     "voice": "nat",    "gender": "male"},    # Indo-Mauritian
    {"name": "Kevin",   "voice": "ryan",   "gender": "male"},    # Creole
    {"name": "Dylan",   "voice": "derek",  "gender": "male"},    # Creole
    {"name": "Antoine", "voice": "luke",   "gender": "male"},    # Franco-Mauritian
    {"name": "Lucas",   "voice": "nat",    "gender": "male"},    # Franco-Mauritian
    {"name": "Ryan",    "voice": "ryan",   "gender": "male"},    # cross-community
]


def get_config() -> dict:
    with _lock:
        return dict(_store)


def update_config(updates: dict) -> dict:
    with _lock:
        _store.update(updates)
        return dict(_store)


def get_voice_persona() -> dict:
    """
    Return a random voice persona (name + voice_id) matching the gender preference.
    Each call gets a different agent identity, keeping the experience varied.
    """
    with _lock:
        gender = _store.get("voice_gender", "random")

    if gender == "male":
        pool = [p for p in _VOICE_PERSONAS if p["gender"] == "male"]
    elif gender == "female":
        pool = [p for p in _VOICE_PERSONAS if p["gender"] == "female"]
    else:
        pool = _VOICE_PERSONAS

    return dict(random.choice(pool))


def get_voice_id() -> str:
    """Convenience wrapper — returns just the voice ID for backward compat."""
    return get_voice_persona()["voice"]


def list_personas() -> list[dict]:
    """Return the full persona catalogue (for admin UI display)."""
    return [dict(p) for p in _VOICE_PERSONAS]
