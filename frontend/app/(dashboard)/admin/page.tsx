"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle, XCircle, AlertCircle, Bot, Languages, Wrench,
  BarChart3, Star, ThumbsUp, TrendingUp, MessageSquare, Users,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";

const BASE = "/api/backend";

type SystemStatus = {
  database: string; ai_service: string; voice_service: string;
  whatsapp_service: string; api_keys: Record<string, boolean>;
  version: string; environment: string;
};

type AdminAnalytics = {
  total_graded: number; avg_grade: number; task_completion_rate: number;
  grade_distribution: Record<string, number>;
  by_channel: Record<string, { count: number; avg_grade: number }>;
  by_language: Record<string, { count: number; avg_grade: number }>;
  recent_feedback: Array<{ grade: number; feedback: string; channel: string; language: string }>;
  top_issues: Array<{ issue: string; count: number }>;
};

function StatusBadge({ label }: { label: string }) {
  const ok = !label.startsWith("demo") && label === "connected";
  const demo = label.startsWith("demo");
  return (
    <span className={clsx(
      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
      ok && "bg-green-100 text-green-700",
      demo && "bg-amber-100 text-amber-700",
      !ok && !demo && "bg-red-100 text-red-700",
    )}>
      {ok ? <CheckCircle className="w-3 h-3" /> : demo ? <AlertCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {ok ? "Live" : demo ? "Demo" : "Offline"}
    </span>
  );
}

function StarBar({ dist }: { dist: Record<string, number> }) {
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-lime-400", "bg-green-500"];
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((n, i) => {
        const count = dist[String(n)] || 0;
        const pct = Math.round((count / total) * 100);
        return (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-right text-gray-500">{n}★</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div className={clsx("h-2 rounded-full", colors[i])} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right text-gray-400">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

const LANG_LABELS: Record<string, string> = { en: "English", fr: "Français", cr: "Kreol", hi: "हिन्दी" };
const CHAN_LABELS: Record<string, string> = { web: "Instant Chat", whatsapp: "WhatsApp", phone: "Phone" };

export default function AdminPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/v1/admin/status`).then(r => r.json()),
      fetch(`${BASE}/v1/admin/analytics`).then(r => r.json()),
    ]).then(([s, a]) => { setStatus(s); setAnalytics(a); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const quickLinks = [
    { href: "/admin/agents", icon: Bot, label: "Agent Configuration", desc: "Edit instructions, voice gender, escalation" },
    { href: "/admin/languages", icon: Languages, label: "Language Testing", desc: "Validate all 4 languages end-to-end" },
    { href: "/admin/tools", icon: Wrench, label: "Service Connectors", desc: "Manage tool registry and API connections" },
  ];

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage agents, languages, service connectors, and view interaction analytics
        </p>
      </div>

      {/* System status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">System Status</h2>
        {loading ? (
          <div className="text-sm text-gray-400">Loading…</div>
        ) : status ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Database", value: status.database },
              { label: "AI Service", value: status.ai_service },
              { label: "Voice (Bland.ai)", value: status.voice_service },
              { label: "WhatsApp", value: status.whatsapp_service },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">{label}</span>
                <StatusBadge label={value} />
                <span className="text-xs text-gray-400 truncate">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-red-500">Could not reach backend</div>
        )}

        {status && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">API Keys</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(status.api_keys).map(([key, ok]) => (
                <span key={key} className={clsx(
                  "text-xs px-2 py-0.5 rounded-full",
                  ok ? "bg-green-50 text-green-700 border border-green-200"
                     : "bg-gray-50 text-gray-400 border border-gray-200"
                )}>
                  {ok ? "✓" : "○"} {key.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-400 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2 bg-brand-50 rounded-lg">
                <Icon className="w-5 h-5 text-brand-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
            </div>
            <h3 className="font-semibold text-gray-900 mt-3 text-sm">{label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Analytics */}
      {analytics && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: MessageSquare, label: "Total Graded", color: "text-blue-600 bg-blue-50",
                value: analytics.total_graded.toLocaleString(), sub: "interactions rated",
              },
              {
                icon: Star, label: "Avg Rating", color: "text-amber-500 bg-amber-50",
                value: `${analytics.avg_grade} / 5`, sub: "passenger satisfaction",
              },
              {
                icon: ThumbsUp, label: "Task Completion", color: "text-green-600 bg-green-50",
                value: `${analytics.task_completion_rate}%`, sub: "queries resolved",
              },
              {
                icon: TrendingUp, label: "5★ Rate", color: "text-purple-600 bg-purple-50",
                value: `${Math.round((analytics.grade_distribution["5"] / analytics.total_graded) * 100)}%`,
                sub: "top-rated interactions",
              },
            ].map(({ icon: Icon, label, color, value, sub }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className={clsx("p-2 rounded-lg w-fit mb-3", color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Grade distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" /> Rating Distribution
              </h3>
              <StarBar dist={analytics.grade_distribution} />
            </div>

            {/* By channel */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" /> By Channel
              </h3>
              <div className="space-y-2">
                {Object.entries(analytics.by_channel).map(([ch, d]) => (
                  <div key={ch} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{CHAN_LABELS[ch] || ch}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{d.count} chats</span>
                      <span className="font-medium text-gray-900">
                        {"★".repeat(Math.round(d.avg_grade))} {d.avg_grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By language */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm flex items-center gap-2">
                <Languages className="w-4 h-4 text-gray-400" /> By Language
              </h3>
              <div className="space-y-2">
                {Object.entries(analytics.by_language).map(([lang, d]) => (
                  <div key={lang} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{LANG_LABELS[lang] || lang}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{d.count} chats</span>
                      <span className="font-medium text-gray-900">{d.avg_grade} ★</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top issues */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" /> Top Passenger Topics
              </h3>
              <div className="space-y-2">
                {analytics.top_issues.map((issue, i) => {
                  const max = analytics.top_issues[0]?.count || 1;
                  return (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-gray-700">{issue.issue}</span>
                          <span className="text-gray-400 text-xs">{issue.count}</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-brand-500 h-1.5 rounded-full"
                            style={{ width: `${(issue.count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent feedback */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-gray-400" /> Recent Passenger Feedback
              </h3>
              {analytics.recent_feedback.length === 0 ? (
                <p className="text-sm text-gray-400">No feedback yet. Passengers will see a rating prompt after each chat.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.recent_feedback.map((fb, i) => (
                    <div key={i} className="border-b border-gray-50 pb-2 last:border-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-amber-400 text-xs">{"★".repeat(fb.grade)}{"☆".repeat(5 - fb.grade)}</span>
                        <span className="text-xs text-gray-400 capitalize">{fb.channel} · {LANG_LABELS[fb.language] || fb.language}</span>
                      </div>
                      <p className="text-xs text-gray-600 italic">"{fb.feedback}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
