"use client";

import { useState } from "react";
import { Search, Phone, Clock, User, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const MOCK_CALLS = [
  {
    id: "b1c2d3e4-0001",
    caller: "+230 5712 3456",
    duration: 145,
    status: "completed",
    language: "EN",
    escalated: false,
    sentiment: "positive",
    summary: "Inquired about flight MK014 departure time and gate",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "b1c2d3e4-0002",
    caller: "+230 5678 9012",
    duration: 312,
    status: "completed",
    language: "EN",
    escalated: true,
    sentiment: "negative",
    summary: "Requested flight cancellation and refund — escalated to human agent",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "b1c2d3e4-0003",
    caller: "+230 5823 4567",
    duration: 98,
    status: "completed",
    language: "FR",
    escalated: false,
    sentiment: "neutral",
    summary: "Checked status of MK042 — on time, gate A8",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

const sentimentColors: Record<string, string> = {
  positive: "bg-green-100 text-green-700",
  neutral: "bg-gray-100 text-gray-700",
  negative: "bg-red-100 text-red-700",
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CallsPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_CALLS.filter(
    (c) =>
      c.caller.includes(search) ||
      c.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
        <p className="text-gray-500 text-sm mt-1">Voice call history and transcripts</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by number or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 font-medium text-gray-600">Caller</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Time</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Duration</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Lang</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Sentiment</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Summary</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((call) => (
              <tr key={call.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${call.escalated ? "bg-red-400" : "bg-green-400"}`} />
                    <span className="font-medium text-gray-900">{call.caller}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {format(new Date(call.created_at), "HH:mm")}
                </td>
                <td className="px-6 py-4 text-gray-500">{formatDuration(call.duration)}</td>
                <td className="px-6 py-4">
                  <span className="bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded font-medium">
                    {call.language}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sentimentColors[call.sentiment]}`}>
                    {call.sentiment}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{call.summary}</td>
                <td className="px-6 py-4">
                  <button className="text-brand-500 hover:text-brand-700 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No calls found matching your search
          </div>
        )}
      </div>
    </div>
  );
}
