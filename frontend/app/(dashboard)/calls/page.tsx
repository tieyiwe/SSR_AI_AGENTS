"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Phone, Clock, Download, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { format } from "date-fns";

type Conversation = {
  id: string;
  channel: string;
  language: string;
  status: string;
  passenger_phone: string | null;
  created_at: string;
  message_count: number;
  // enriched fields (may be absent)
  duration?: number;
  sentiment?: "positive" | "neutral" | "negative";
  summary?: string;
  escalated?: boolean;
};

const sentimentColors: Record<string, string> = {
  positive: "bg-green-100 text-green-700",
  neutral:  "bg-gray-100 text-gray-700",
  negative: "bg-red-100 text-red-700",
};

const CHANNEL_ICON: Record<string, string> = {
  phone: "📞", whatsapp: "💬", web: "🌐",
};

const LANG_LABELS: Record<string, string> = { en: "EN", fr: "FR", cr: "CR", hi: "HI" };

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function exportCSV(rows: Conversation[]) {
  const headers = ["ID", "Channel", "Language", "Status", "Phone", "Created At", "Messages", "Duration", "Sentiment", "Escalated"];
  const lines = [
    headers.join(","),
    ...rows.map(c => [
      c.id,
      c.channel,
      c.language,
      c.status,
      c.passenger_phone ?? "",
      c.created_at,
      c.message_count,
      c.duration ?? "",
      c.sentiment ?? "",
      c.escalated ? "yes" : "no",
    ].map(v => `"${v}"`).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aass-conversations-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CallsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: "50" });
    if (channelFilter !== "all") params.set("channel", channelFilter);
    const r = await fetch(`/api/backend/v1/admin/conversations?${params}`);
    if (r.ok) {
      const d = await r.json();
      setConversations(d.conversations ?? []);
      setTotal(d.total ?? 0);
    }
    setLoading(false);
  }, [channelFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const sl = search.toLowerCase();
    return (
      (c.passenger_phone ?? "").toLowerCase().includes(sl) ||
      c.id.toLowerCase().includes(sl) ||
      c.channel.toLowerCase().includes(sl) ||
      (c.summary ?? "").toLowerCase().includes(sl)
    );
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
          <p className="text-gray-500 text-sm mt-1">
            All channels · {total.toLocaleString()} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load()}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 px-3 py-2 rounded-lg border border-gray-200 hover:border-brand-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 text-sm text-white bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 px-3 py-2 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by phone, ID, or keyword…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "phone", "whatsapp", "web"].map(ch => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
                channelFilter === ch
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
              }`}
            >
              {ch === "all" ? "All channels" : `${CHANNEL_ICON[ch] ?? ""} ${ch}`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 font-medium text-gray-600">Contact</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Channel</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Time</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Lang</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Messages</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No conversations found
                </td>
              </tr>
            ) : (
              filtered.map(conv => (
                <>
                  <tr
                    key={conv.id}
                    onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          conv.status === "resolved" ? "bg-green-400" : conv.status === "escalated" ? "bg-red-400" : "bg-blue-400"
                        }`} />
                        <span className="font-medium text-gray-900 text-xs">
                          {conv.passenger_phone ?? conv.id.slice(0, 12) + "…"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {CHANNEL_ICON[conv.channel] ?? ""} {conv.channel}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {conv.created_at ? format(new Date(conv.created_at), "HH:mm, dd MMM") : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded font-medium">
                        {LANG_LABELS[conv.language] ?? conv.language?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        conv.status === "resolved" ? "bg-green-100 text-green-700"
                          : conv.status === "escalated" ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {conv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{conv.message_count}</td>
                    <td className="px-5 py-4">
                      {expanded === conv.id
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </td>
                  </tr>
                  {expanded === conv.id && (
                    <tr key={`${conv.id}-detail`} className="bg-gray-50">
                      <td colSpan={7} className="px-5 py-3">
                        <div className="text-xs text-gray-500 space-y-1">
                          <p><span className="font-medium text-gray-700">Conversation ID:</span> {conv.id}</p>
                          {conv.summary && <p><span className="font-medium text-gray-700">Summary:</span> {conv.summary}</p>}
                          {conv.duration !== undefined && (
                            <p><span className="font-medium text-gray-700">Duration:</span> {formatDuration(conv.duration)}</p>
                          )}
                          {conv.sentiment && (
                            <p>
                              <span className="font-medium text-gray-700">Sentiment:</span>{" "}
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${sentimentColors[conv.sentiment]}`}>
                                {conv.sentiment}
                              </span>
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
