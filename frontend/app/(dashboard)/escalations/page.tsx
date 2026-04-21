"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertTriangle, CheckCircle, Clock, User, Send,
  MessageSquare, ArrowRight, Wifi, Zap, Phone, X, Bell,
} from "lucide-react";
import { clsx } from "clsx";

type CannedResponse = {
  id: string;
  title: string;
  content: string;
  category: string;
};

// ── Smooth 3-note chime via Web Audio API ────────────────────────────────────
function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [
      { freq: 523.25, t: 0.00, vol: 0.22 },   // C5
      { freq: 659.25, t: 0.20, vol: 0.25 },   // E5
      { freq: 783.99, t: 0.40, vol: 0.28 },   // G5
    ].forEach(({ freq, t: start, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const now = ctx.currentTime + start;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.start(now);
      osc.stop(now + 0.95);
    });
  } catch { /* audio unavailable */ }
}

// ── Toast notification ────────────────────────────────────────────────────────
type Toast = { id: string; reason: string; channel: string; priority: string };

function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);
  const dismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 250);
  };
  const isVoice = toast.channel === "phone";
  return (
    <div className={clsx(
      "flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-white text-sm",
      "bg-gradient-to-r from-red-600 to-red-500 border-red-400",
      exiting ? "toast-exit" : "toast-enter"
    )}>
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
        {isVoice ? <Phone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-xs uppercase tracking-wide opacity-80">
          New {isVoice ? "Voice" : "Chat"} Escalation
        </p>
        <p className="font-semibold truncate">{toast.reason || "Customer needs assistance"}</p>
      </div>
      <button onClick={dismiss} className="p-1 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function SLATimer({ createdAt, status }: { createdAt: string; status: string }) {
  const [mins, setMins] = useState(() =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  );
  useEffect(() => {
    if (status === "resolved") return;
    const t = setInterval(() => {
      setMins(Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
    }, 30000);
    return () => clearInterval(t);
  }, [createdAt, status]);

  if (status === "resolved") return null;
  const color = mins < 5 ? "text-green-600" : mins < 15 ? "text-amber-600 font-semibold" : "text-red-600 font-bold";
  const display = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return (
    <span className={clsx("flex items-center gap-0.5 text-xs", color)}>
      <Clock className="w-3 h-3" /> {display}
    </span>
  );
}

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
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selected, setSelected] = useState<EscalationDetail | null>(null);
  const [reply, setReply] = useState("");
  const [agentName, setAgentName] = useState("Agent");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [filter, setFilter] = useState<"all" | EscalationStatus>("all");
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [showCanned, setShowCanned] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownIds = useRef<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    fetch("/api/backend/v1/admin/canned-responses")
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setCannedResponses(d.responses ?? []))
      .catch(() => {});
  }, []);

  const dismissToast = (id: string) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  const fetchList = useCallback(async () => {
    try {
      // Always fetch all so we can detect new arrivals regardless of active filter
      const r = await fetch("/api/backend/v1/admin/escalations");
      if (r.ok) {
        const data = await r.json();
        const all: EscalationSummary[] = data.escalations ?? [];

        // Detect brand-new waiting escalations
        const incoming = all.filter(
          e => e.status === "waiting" && !knownIds.current.has(e.id)
        );
        if (incoming.length > 0) {
          if (soundEnabled) playChime();

          // Flash animation on cards
          setNewIds(prev => {
            const next = new Set(prev);
            incoming.forEach(e => next.add(e.id));
            return next;
          });
          // Remove flash after animation (3 × 0.9s)
          setTimeout(() => {
            setNewIds(prev => {
              const next = new Set(prev);
              incoming.forEach(e => next.delete(e.id));
              return next;
            });
          }, 2800);

          // Toast per new escalation
          incoming.forEach(e => {
            const toast: Toast = { id: e.id, reason: e.reason, channel: e.channel, priority: e.priority };
            setToasts(prev => [...prev.slice(-2), toast]); // max 3 toasts
            setTimeout(() => dismissToast(e.id), 9000);

            // Browser notification when tab is in background
            if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
              new Notification(
                `New ${e.channel === "phone" ? "Voice" : "Chat"} Escalation`,
                {
                  body: e.reason || "A customer needs assistance",
                  icon: "/favicon.ico",
                  tag: e.id,
                }
              );
            }
          });
        }

        // Update known-IDs set
        all.forEach(e => knownIds.current.add(e.id));

        // Apply filter for display
        const displayed = filter === "all" ? all : all.filter(e => e.status === filter);
        setEscalations(displayed);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, soundEnabled]);

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
      {/* Toast notifications — float above everything */}
      {toasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastBanner toast={t} onDismiss={() => dismissToast(t.id)} />
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Escalation Queue
            {waitingCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {waitingCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Conversations transferred from Priya for human assistance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(s => !s)}
            title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
            className={clsx(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors",
              soundEnabled
                ? "bg-brand-50 text-brand-600 border-brand-200 hover:bg-brand-100"
                : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
            )}
          >
            <Bell className={clsx("w-3.5 h-3.5", soundEnabled && "animate-pulse")} />
            {soundEnabled ? "Sound on" : "Sound off"}
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Wifi className="w-3.5 h-3.5 text-green-500" />
            Live
          </div>
          <input
            value={agentName}
            onChange={e => setAgentName(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-36 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                      isActive ? "bg-brand-50 border-l-2 border-l-brand-500" : "hover:bg-white",
                      newIds.has(esc.id) && "escalation-new"
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <StatusBadge status={esc.status} />
                      <div className="flex items-center gap-1.5">
                        <SLATimer createdAt={esc.created_at} status={esc.status} />
                        <span className="text-xs text-gray-400">{timeAgo(esc.created_at)}</span>
                      </div>
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
              <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0 space-y-2">
                {/* Quick canned responses */}
                {cannedResponses.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowCanned(!showCanned)}
                      className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      <Zap className="w-3 h-3" />
                      Quick Replies
                      <span className="text-gray-400">({cannedResponses.length})</span>
                    </button>
                    {showCanned && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {cannedResponses.map(cr => (
                          <button
                            key={cr.id}
                            onClick={() => {
                              setReply(cr.content);
                              setShowCanned(false);
                            }}
                            className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 px-2.5 py-1 rounded-full transition-colors"
                          >
                            {cr.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-green-500" />
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
