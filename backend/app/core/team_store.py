"""
In-memory team member store.
Replace with DB persistence once DATABASE_URL is configured.
"""
import threading
import secrets
import string
from datetime import datetime, timezone

_lock = threading.Lock()

# member_id -> member dict
_members: dict = {}

# invite_token -> {email, role, created_at, expires_at}
_invites: dict = {}

ROLES = {"admin", "agent", "supervisor", "viewer"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _token(n: int = 24) -> str:
    return "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(n))


def list_members() -> list[dict]:
    with _lock:
        return sorted(_members.values(), key=lambda m: m["created_at"])


def get_member(member_id: str) -> dict | None:
    with _lock:
        return _members.get(member_id)


def add_member(name: str, email: str, role: str = "agent") -> dict:
    with _lock:
        # prevent duplicate email
        for m in _members.values():
            if m["email"].lower() == email.lower():
                raise ValueError(f"Email {email} already in use")
        mid = _token(16)
        member = {
            "id": mid,
            "name": name,
            "email": email,
            "role": role,
            "status": "active",
            "created_at": _now(),
            "last_active": None,
        }
        _members[mid] = member
        return dict(member)


def update_member(member_id: str, updates: dict) -> dict:
    with _lock:
        if member_id not in _members:
            raise KeyError(member_id)
        allowed = {"name", "role", "status"}
        for k, v in updates.items():
            if k in allowed:
                _members[member_id][k] = v
        return dict(_members[member_id])


def remove_member(member_id: str) -> bool:
    with _lock:
        return bool(_members.pop(member_id, None))


def create_invite(email: str, role: str = "agent") -> dict:
    with _lock:
        token = _token(32)
        invite = {
            "token": token,
            "email": email,
            "role": role,
            "created_at": _now(),
            "used": False,
        }
        _invites[token] = invite
        return dict(invite)


def get_invite(token: str) -> dict | None:
    with _lock:
        return _invites.get(token)


def use_invite(token: str, name: str) -> dict:
    """Accept an invite and create the member account."""
    with _lock:
        invite = _invites.get(token)
        if not invite:
            raise KeyError("Invalid invite token")
        if invite["used"]:
            raise ValueError("Invite already used")
        invite["used"] = True

    return add_member(name=name, email=invite["email"], role=invite["role"])


def list_invites() -> list[dict]:
    with _lock:
        return [dict(i) for i in _invites.values() if not i["used"]]
