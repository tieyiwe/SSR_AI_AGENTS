"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertTriangle, CheckCircle, Clock, User, Send, RefreshCw,
  MessageSquare, ArrowRight, Wifi, WifiOff,
} from "lucide-react";
import { clsx } from "clsx";

type EscalationStatus = "waiting" | "claimed" | "resolved";
type Priority = "normal" | "high" | "urgent";

interface EscalationSummary {
  id: string;
  status: EscalationStatus;
  claimed_by: string | null;
  reason: string;
  priority: Priority;
  created_at: string;
  claimed_at: string | null;
  resolved_at: string | null;
  language: string;
  channel: string;
  message_count: number;
  unread_from_customer: number;
}

interface AgentMessage {
  id: string;
  from: "agent" | "customer";
  content: string;
  agent_name?: string;
  ts: string;
  read: boolean;
}

interface EscalationDetail extends EscalationSummary {
  ai_messages: { role: string; content: string; created_at?: string }[];
  agent_messages: AgentMessage[];
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  normal: { label: "Normal", color: "text-gray-500", dot: "bg-gray-400" },
  high:   { label: "High",   color: "text-amber-600", dot: "bg-amber-400" },
  urgent: { label: "Urgent", color: "text-red-600",   dot: "bg-red-500 animate-pulse" },
};

const LANG_LABELS: Record<string, string> = { en: "English", fr: "Français", cr: "Kreol", hi: "हिन्दी" };

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: EscalationStatus }) {
  const cfg = {
    waiting:  { icon: Clock,        label: "Waiting",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
    claimed:  { icon: User,         label: "Claimed",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
    resolved: { icon: CheckCircle,  label: "Resolved", cls: "bg-green-50 text-green-700 border-green-200" },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", cfg.cls)}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<EscalationSummary[]>([]);
  const [selected, setSelected] = useState<EscalationDetail | null>(null);
  const [reply, setReply] = useState("");
  const [agentName, setAgentName] = useState("Agent");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [filter, setFilter] = useState<"all" | EscalationStatus>("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchList = useCallback(async () => {
    try {
      const url = filter === "all"
        ? "/api/backend/v1/admin/escalations"
        : `/api/backend/v1/admin/escalations?status=${filter}`;
      const r = await fetch(url);
      if (r.ok) {
        const data = await r.json();
        setEscalations(data.escalations ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchSelected = useCallback(async (id: string) => {
    const r = await fetch(`/api/backend/v1/admin/escalations/${id}`);
    if (r.ok) {
      const data = await r.json();
      setSelected(data);
    }
  }, []);

  // Poll list every 5s
  useEffect(() => {
    fetchList();
    const t = setInterval(() => {
      fetchList();
      setLastRefresh(Date.now());
    }, 5000);
    return () => clearInterval(t);
  }, [fetchList]);

  // Poll selected conv every 3s for new messages
  useEffect(() => {
    if (!selected) return;
    const t = setInterval(() => fetchSelected(selected.id), 3000);
    return () => clearInterval(t);
  }, [selected?.id, fetchSelected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.agent_messages]);

  const handleSelect = async (esc: EscalationSummary) => {
    await fetchSelected(esc.id);
  };

  const handleClaim = async () => {
    if (!selected) return;
    setClaiming(true);
    try {
      const r = await fetch(`/api/backend/v1/admin/escalations/${selected.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_name: agentName }),
      });
      if (r.ok) await fetchSelected(selected.id);
    } finally {
      setClaiming(false);
    }
  };

  const handleReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    const text = reply.trim();
    setReply("");
    try {
      await fetch(`/api/backend/v1/admin/escalations/${selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, agent_name: agentName }),
      });
      await fetchSelected(selected.id);
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!selected) return;
    await fetch(`/api/backend/v1/admin/escalations/${selected.id}/close`, { method: "POST" });
    await fetchSelected(selected.id);
    await fetchList();
  };

  const waitingCount = escalations.filter(e => e.status === "waiting").length;
  const filtered = filter === "all" ? escalations : escalations.filter(e => e.status === filter);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Escalation Queue
            {waitingCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {waitingCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Conversations transferred from Aida for human assistance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Wifi className="w-3.5 h-3.5 text-green-500" />
            Refreshing every 5s
          </div>
          <input
            value={agentName}
            onChange={e => setAgentName(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-40 focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Your name"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Queue list */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* Filter tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            {(["all", "waiting", "claimed", "resolved"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "flex-1 py-2 text-xs font-medium capitalize transition-colors",
                  filter === f
                    ? "text-brand-600 border-b-2 border-brand-600"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {f}
                {f === "waiting" && waitingCount > 0 && (
                  <span className="ml-1 bg-red-100 text-red-600 text-xs px-1 rounded-full">
                    {waitingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-400">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No escalations</p>
                <p className="text-xs text-gray-300 mt-1">Queue is clear</p>
              </div>
            ) : (
              filtered.map(esc => {
                const pc = PRIORITY_CONFIG[esc.priority];
                const isActive = selected?.id === esc.id;
                return (
                  <button
                    key={esc.id}
                    onClick={() => handleSelect(esc)}
                    className={clsx(
                      "w-full text-left px-4 py-3 border-b border-gray-100 transition-colors",
                      isActive ? "bg-brand-50 border-l-2 border-l-brand-500" : "hover:bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <StatusBadge status={esc.status} />
                      <span className="text-xs text-gray-400">{timeAgo(esc.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium line-clamp-2 mt-1">
                      {esc.reason || "General assistance request"}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={clsx("flex items-center gap-1 text-xs", pc.color)}>
                        <span className={clsx("w-1.5 h-1.5 rounded-full", pc.dot)} />
                        {pc.label}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{LANG_LABELS[esc.language] || esc.language}</span>
                      {esc.unread_from_customer > 0 && (
                        <>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 rounded-full font-medium">
                            {esc.unread_from_customer} new
                          </span>
                        </>
                      )}
                    </div>
                    {esc.claimed_by && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3" /> {esc.claimed_by}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Conversation view */}
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Select a conversation</p>
              <p className="text-sm text-gray-300 mt-1">
                Click an escalation from the queue to view and respond
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Conv header */}
            <div className="border-b border-gray-200 bg-white px-5 py-3 flex items-center justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="text-xs text-gray-400">{LANG_LABELS[selected.language]} · {selected.channel}</span>
                  {selected.priority !== "normal" && (
                    <span className={clsx("text-xs font-semibold", PRIORITY_CONFIG[selected.priority].color)}>
                      {PRIORITY_CONFIG[selected.priority].label} priority
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selected.reason || "No specific reason provided"} · Started {timeAgo(selected.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                {selected.status === "waiting" && (
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    {claiming ? "Claiming…" : "Claim Conversation"}
                  </button>
                )}
                {selected.status === "claimed" && (
                  <button
                    onClick={handleClose}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* AI conversation history */}
              {selected.ai_messages.length > 0 && (
                <>
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                      AI Conversation History
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  {selected.ai_messages.map((m, i) => (
                    <div key={i} className={clsx("flex gap-2 items-end", m.role === "user" ? "flex-row-reverse" : "")}>
                      <div className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        m.role === "user" ? "bg-gray-300 text-gray-600" : "bg-brand-100 text-brand-700"
                      )}>
                        {m.role === "user" ? "P" : "A"}
                      </div>
                      <div className={clsx(
                        "max-w-[70%] px-3 py-2 rounded-2xl text-sm",
                        m.role === "user"
                          ? "bg-gray-100 text-gray-800 rounded-br-sm"
                          : "bg-brand-50 text-brand-900 rounded-bl-sm border border-brand-100"
                      )}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-amber-200" />
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Transferred to Human Agent
                    </span>
                    <div className="flex-1 h-px bg-amber-200" />
                  </div>
                </>
              )}

              {/* Human agent messages */}
              {selected.agent_messages.map(m => (
                <div key={m.id} className={clsx("flex gap-2 items-end", m.from === "customer" ? "" : "flex-row-reverse")}>
                  <div className={clsx(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    m.from === "customer" ? "bg-gray-300 text-gray-600" : "bg-green-100 text-green-700"
                  )}>
                    {m.from === "customer" ? "P" : "H"}
                  </div>
                  <div className={clsx(
                    "max-w-[70%] space-y-0.5",
                    m.from === "customer" ? "" : "items-end flex flex-col"
                  )}>
                    {m.from === "agent" && (
                      <p className="text-xs text-gray-400 px-1">{m.agent_name || "Agent"}</p>
                    )}
                    <div className={clsx(
                      "px-3 py-2 rounded-2xl text-sm",
                      m.from === "customer"
                        ? "bg-gray-100 text-gray-800 rounded-bl-sm"
                        : "bg-green-50 text-green-900 rounded-br-sm border border-green-200"
                    )}>
                      {m.content}
                    </div>
                    <p className={clsx("text-xs text-gray-400 px-1", m.from === "agent" ? "text-right" : "")}>
                      {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}

              {selected.status === "waiting" && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
                    <Clock className="w-4 h-4 animate-spin" />
                    Customer is waiting — claim this conversation to start responding
                  </div>
                </div>
              )}

              {selected.status === "resolved" && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    Conversation resolved
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Reply input — only shown when claimed */}
            {selected.status === "claimed" && (
              <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
                <div className="flex gap-3 items-end">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                    placeholder="Type a reply to the customer… (Enter to send)"
                    rows={2}
                    className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-32"
                  />
                  <button
                    onClick={handleReply}
                    disabled={!reply.trim() || sending}
                    className="bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 text-white rounded-xl p-3 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  Customer sees your messages in real-time via polling
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
