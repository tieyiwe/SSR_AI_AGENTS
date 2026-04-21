"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, UserPlus, Mail, Shield, Trash2, RefreshCw,
  Crown, Eye, Headphones, CheckCircle, Clock, XCircle,
  Copy, Check,
} from "lucide-react";
import { clsx } from "clsx";

const BASE = "/api/backend/v1/team";

type Role = "admin" | "supervisor" | "agent" | "viewer";
type Status = "active" | "suspended";

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  created_at: string;
  last_active: string | null;
}

interface Invite {
  token: string;
  email: string;
  role: Role;
  created_at: string;
  used: boolean;
}

const ROLE_CONFIG: Record<Role, { label: string; icon: typeof Crown; color: string; bg: string }> = {
  admin:      { label: "Admin",      icon: Crown,       color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  supervisor: { label: "Supervisor", icon: Shield,      color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  agent:      { label: "Agent",      icon: Headphones,  color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  viewer:     { label: "Viewer",     icon: Eye,         color: "text-gray-700",   bg: "bg-gray-50 border-gray-200" },
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin:      "Full access — manage team, config, all data",
  supervisor: "View all conversations, override escalations, analytics",
  agent:      "Claim and respond to escalated conversations",
  viewer:     "Read-only access to dashboard and call logs",
};

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.icon;
  return (
    <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", cfg.bg, cfg.color)}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"members" | "invites" | "invite-new">("members");

  // Add member form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("agent");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [lastInviteLink, setLastInviteLink] = useState("");

  const load = useCallback(async () => {
    const [mr, ir] = await Promise.all([
      fetch(`${BASE}/members`).then(r => r.json()),
      fetch(`${BASE}/invites`).then(r => r.json()),
    ]);
    setMembers(mr.members ?? []);
    setInvites(ir.invites ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendInvite = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const r = await fetch(`${BASE}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), role: newRole }),
      });
      const data = await r.json();
      if (!r.ok) { setAddError(data.detail || "Failed to create invite"); return; }
      setLastInviteLink(`${window.location.origin}${data.invite_link}`);
      setNewEmail("");
      await load();
      setTab("invites");
    } finally { setAdding(false); }
  };

  const addDirectly = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const r = await fetch(`${BASE}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), role: newRole }),
      });
      const data = await r.json();
      if (!r.ok) { setAddError(data.detail || "Failed to add member"); return; }
      setNewName(""); setNewEmail("");
      await load();
      setTab("members");
    } finally { setAdding(false); }
  };

  const changeRole = async (id: string, role: Role) => {
    await fetch(`${BASE}/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await load();
  };

  const toggleStatus = async (member: Member) => {
    const status: Status = member.status === "active" ? "suspended" : "active";
    await fetch(`${BASE}/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  const removeMember = async (id: string) => {
    if (!confirm("Remove this team member? They will lose access immediately.")) return;
    await fetch(`${BASE}/members/${id}`, { method: "DELETE" });
    await load();
  };

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading team…</div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" /> Team
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage agents, supervisors, and viewers who have access to the Operations Centre
          </p>
        </div>
        <button
          onClick={() => setTab("invite-new")}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(ROLE_CONFIG) as Role[]).map(role => {
          const cfg = ROLE_CONFIG[role];
          const Icon = cfg.icon;
          return (
            <div key={role} className={clsx("rounded-xl border p-3 flex items-start gap-2", cfg.bg)}>
              <Icon className={clsx("w-4 h-4 mt-0.5 shrink-0", cfg.color)} />
              <div>
                <p className={clsx("text-xs font-semibold", cfg.color)}>{cfg.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{ROLE_DESCRIPTIONS[role]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        {([
          { key: "members",    label: `Members (${members.length})` },
          { key: "invites",    label: `Pending Invites (${invites.length})` },
          { key: "invite-new", label: "Add Member" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              "pb-2 text-sm font-medium transition-colors",
              tab === key
                ? "text-brand-600 border-b-2 border-brand-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Members list */}
      {tab === "members" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {members.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No team members yet</p>
              <button
                onClick={() => setTab("invite-new")}
                className="mt-3 text-sm text-brand-600 hover:underline"
              >
                Invite your first team member →
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={m.role}
                        onChange={e => changeRole(m.id, e.target.value as Role)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
                      >
                        {(Object.keys(ROLE_CONFIG) as Role[]).map(r => (
                          <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={clsx(
                        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                        m.status === "active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {m.status === "active"
                          ? <><CheckCircle className="w-3 h-3" /> Active</>
                          : <><XCircle className="w-3 h-3" /> Suspended</>
                        }
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeMember(m.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Pending invites */}
      {tab === "invites" && (
        <div className="space-y-3">
          {lastInviteLink && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">Invite created! Share this link:</p>
                <div className="flex items-center gap-2 mt-1.5 bg-white border border-green-200 rounded-lg px-3 py-1.5">
                  <code className="text-xs text-gray-700 flex-1 truncate">{lastInviteLink}</code>
                  <CopyButton text={lastInviteLink} />
                </div>
              </div>
            </div>
          )}
          {invites.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <Mail className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No pending invites</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invites.map(inv => {
                    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/team/join/${inv.token}`;
                    return (
                      <tr key={inv.token} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-700">{inv.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><RoleBadge role={inv.role as Role} /></td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(inv.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <code className="text-xs text-gray-400 hidden sm:block max-w-[160px] truncate">{inv.token.slice(0, 12)}…</code>
                            <CopyButton text={link} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / invite form */}
      {tab === "invite-new" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6 max-w-lg">
          <div>
            <h2 className="font-semibold text-gray-900">Add Team Member</h2>
            <p className="text-xs text-gray-500 mt-1">
              Send an invite link, or add them directly if you already know their name.
            </p>
          </div>

          {addError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {addError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name <span className="text-gray-400">(optional for invite)</span></label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Rohan Bissessur"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email Address *</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="colleague@airmauritius.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ROLE_CONFIG) as Role[]).map(r => {
                  const cfg = ROLE_CONFIG[r];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={r}
                      onClick={() => setNewRole(r)}
                      className={clsx(
                        "flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-all",
                        newRole === r ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <Icon className={clsx("w-3.5 h-3.5 mt-0.5 shrink-0", cfg.color)} />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{cfg.label}</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">{ROLE_DESCRIPTIONS[r]}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={sendInvite}
              disabled={adding || !newEmail.trim()}
              className="flex items-center gap-2 px-4 py-2 border border-brand-500 text-brand-600 hover:bg-brand-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            >
              <Mail className="w-3.5 h-3.5" />
              {adding ? "Sending…" : "Send Invite Link"}
            </button>
            <button
              onClick={addDirectly}
              disabled={adding || !newName.trim() || !newEmail.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {adding ? "Adding…" : "Add Directly"}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            <strong>Send Invite Link</strong> — generates a link to share manually (email not sent automatically until you configure SMTP).<br />
            <strong>Add Directly</strong> — adds them immediately without an invite flow.
          </p>
        </div>
      )}
    </div>
  );
}
