"""
Team management API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.team_store import (
    list_members, add_member, update_member, remove_member,
    create_invite, use_invite, list_invites, ROLES,
)

router = APIRouter()


class AddMemberBody(BaseModel):
    name: str
    email: str
    role: str = "agent"


class UpdateMemberBody(BaseModel):
    name: str | None = None
    role: str | None = None
    status: str | None = None


class InviteBody(BaseModel):
    email: str
    role: str = "agent"


class AcceptInviteBody(BaseModel):
    name: str


@router.get("/members")
async def get_members():
    return {"members": list_members()}


@router.post("/members", status_code=201)
async def create_member(body: AddMemberBody):
    if body.role not in ROLES:
        raise HTTPException(400, f"Invalid role. Must be one of: {', '.join(ROLES)}")
    try:
        member = add_member(name=body.name, email=body.email, role=body.role)
    except ValueError as e:
        raise HTTPException(409, str(e))
    return {"ok": True, "member": member}


@router.patch("/members/{member_id}")
async def patch_member(member_id: str, body: UpdateMemberBody):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if "role" in updates and updates["role"] not in ROLES:
        raise HTTPException(400, f"Invalid role. Must be one of: {', '.join(ROLES)}")
    try:
        member = update_member(member_id, updates)
    except KeyError:
        raise HTTPException(404, "Member not found")
    return {"ok": True, "member": member}


@router.delete("/members/{member_id}")
async def delete_member(member_id: str):
    if not remove_member(member_id):
        raise HTTPException(404, "Member not found")
    return {"ok": True}


@router.get("/invites")
async def get_invites():
    return {"invites": list_invites()}


@router.post("/invites", status_code=201)
async def send_invite(body: InviteBody):
    if body.role not in ROLES:
        raise HTTPException(400, f"Invalid role. Must be one of: {', '.join(ROLES)}")
    invite = create_invite(email=body.email, role=body.role)
    # In production: send invite email here with the token link
    invite_link = f"/team/join/{invite['token']}"
    return {"ok": True, "invite": invite, "invite_link": invite_link}


@router.post("/invites/{token}/accept")
async def accept_invite(token: str, body: AcceptInviteBody):
    try:
        member = use_invite(token=token, name=body.name)
    except KeyError:
        raise HTTPException(404, "Invalid or expired invite")
    except ValueError as e:
        raise HTTPException(409, str(e))
    return {"ok": True, "member": member}


@router.get("/roles")
async def get_roles():
    descriptions = {
        "admin":      "Full access — can manage team, config, and all data",
        "supervisor": "Can view all conversations, override escalations, access analytics",
        "agent":      "Can claim and respond to escalated conversations",
        "viewer":     "Read-only access to dashboard and call logs",
    }
    return {"roles": [{"role": r, "description": descriptions[r]} for r in ROLES]}
