"use client";

import { useState, useEffect, useCallback } from "react";
import MetricsCard from "@/components/dashboard/MetricsCard";
import CallsChart from "@/components/dashboard/CallsChart";
import LiveQueue from "@/components/dashboard/LiveQueue";
import { RefreshCw } from "lucide-react";

type DashData = {
  metrics: {
    total_conversations: number;
    automation_rate: number;
    avg_response_time_seconds: number;
    cost_today_usd: number;
    ai_resolved: number;
    human_escalated: number;
  };
  by_channel: Record<string, { count: number; ai_rate: number }>;
  by_language: Record<string, { count: number; percentage: number }>;
};

const LANG_LABELS: Record<string, string> = { en: "English", fr: "French", cr: "Creole", hi: "Hindi" };

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetch_ = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const r = await fetch("/api/backend/v1/analytics/dashboard");
      if (r.ok) {
        const d = await r.json();
        setData(d);
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const t = setInterval(() => fetch_(), 30000);
    return () => clearInterval(t);
  }, [fetch_]);

  const m = data?.metrics;

  const channelRows = data?.by_channel
    ? Object.entries(data.by_channel).map(([key, v]) => ({
        channel: key === "phone" ? "Phone" : key === "whatsapp" ? "WhatsApp" : "Web Chat",
        count: v.count,
        pct: data.metrics.total_conversations > 0
          ? Math.round((v.count / data.metrics.total_conversations) * 1000) / 10
          : 0,
        ai: v.ai_rate,
      }))
    : [];

  const langRows = data?.by_language
    ? Object.entries(data.by_language).map(([code, v]) => ({
        lang: LANG_LABELS[code] ?? code,
        pct: v.percentage,
      }))
    : [];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time AI performance metrics · auto-refreshes every 30s</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => fetch_(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricsCard
          title="Total Conversations"
          value={loading ? "…" : (m?.total_conversations?.toLocaleString() ?? "—")}
          change="+8.2%"
          positive
          subtitle="Today"
        />
        <MetricsCard
          title="Automation Rate"
          value={loading ? "…" : `${m?.automation_rate ?? "—"}%`}
          change="+2.1%"
          positive
          subtitle="Target: 70%"
        />
        <MetricsCard
          title="Avg Response Time"
          value={loading ? "…" : `${m?.avg_response_time_seconds ?? "—"}s`}
          change="-0.3s"
          positive
          subtitle="Target: <5s"
        />
        <MetricsCard
          title="Cost Today"
          value={loading ? "…" : `$${m?.cost_today_usd?.toFixed(0) ?? "—"}`}
          change="-12%"
          positive
          subtitle="vs yesterday"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Conversations (7 days)</h2>
          <CallsChart />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Channel Breakdown</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {channelRows.map(({ channel, count, pct, ai }) => (
                <div key={channel}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{channel}</span>
                    <span className="text-gray-500">{count.toLocaleString()} · {ai}% AI</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-medium text-gray-700 text-sm mb-3">Language Distribution</h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {langRows.map(({ lang, pct }) => (
                  <div key={lang} className="flex items-center gap-2 text-sm">
                    <span className="w-20 text-gray-600">{lang}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full bg-gold-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-gray-400 w-8 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live queue */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Live Escalation Queue</h2>
        <LiveQueue />
      </div>
    </div>
  );
}
