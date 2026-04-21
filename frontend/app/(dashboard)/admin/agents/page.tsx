"use client";

import { useEffect, useState } from "react";
import { Bot, Mic, Save, Play, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { clsx } from "clsx";

const BASE = "/api/backend";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "cr", label: "Kreol Morisien", flag: "🇲🇺" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

const VOICE_OPTIONS = [
  { value: "random", label: "Random (varies per call)", desc: "Best for passenger variety" },
  { value: "male", label: "Always Male", desc: "Consistent male voice" },
  { value: "female", label: "Always Female", desc: "Consistent female voice" },
];

type Config = {
  agent_name: string;
  voice_gender: string;
  escalation_threshold: number;
  system_prompt_override: string | null;
  language_instructions: Record<string, string>;
  max_tokens: number;
  model: string;
  enable_tool_use: boolean;
};

type TestResult = { response: string; suggestions: string[]; intent: string; escalation_needed: boolean } | null;

export default function AgentsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeLang, setActiveLang] = useState("en");
  const [testMessage, setTestMessage] = useState("Hello, I need help with my flight MK014");
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [testing, setTesting] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/v1/admin/config`)
      .then(r => r.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/v1/admin/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } finally { setSaving(false); }
  };

  const testAgent = async () => {
    setTesting(true); setTestResult(null);
    try {
      const r = await fetch(`${BASE}/v1/admin/test-language`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testMessage, language: activeLang }),
      });
      const data = await r.json();
      setTestResult(data);
    } finally { setTesting(false); }
  };

  const resetPrompt = () => {
    if (!config) return;
    setConfig({ ...config, system_prompt_override: null });
  };

  if (!config) return (
    <div className="p-8 text-sm text-gray-400">Loading agent configuration…</div>
  );

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customise Aida's behaviour, voice, escalation settings, and per-language instructions
        </p>
      </div>

      {/* Basic settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Bot className="w-4 h-4 text-brand-600" /> Agent Identity
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Agent Name</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={config.agent_name}
              onChange={e => setConfig({ ...config, agent_name: e.target.value })}
              placeholder="Aida"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">AI Model</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={config.model}
              onChange={e => setConfig({ ...config, model: e.target.value })}
            >
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Recommended)</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Faster)</option>
              <option value="claude-opus-4-7">Claude Opus 4.7 (Most Capable)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Max Response Tokens ({config.max_tokens})
            </label>
            <input
              type="range" min={200} max={2000} step={100}
              value={config.max_tokens}
              onChange={e => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>200 (concise)</span><span>2000 (detailed)</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Escalation Threshold ({Math.round(config.escalation_threshold * 100)}%)
            </label>
            <input
              type="range" min={0.3} max={1.0} step={0.05}
              value={config.escalation_threshold}
              onChange={e => setConfig({ ...config, escalation_threshold: parseFloat(e.target.value) })}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>Escalate more</span><span>Escalate less</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="tool-use"
            checked={config.enable_tool_use}
            onChange={e => setConfig({ ...config, enable_tool_use: e.target.checked })}
            className="accent-brand-600"
          />
          <label htmlFor="tool-use" className="text-sm text-gray-700">
            Enable tool use (let AI call service connectors for real-time data)
          </label>
        </div>
      </div>

      {/* Voice gender */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Mic className="w-4 h-4 text-brand-600" /> Voice Gender (Phone / Bland.ai)
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Choose how the voice AI presents itself on phone calls. "Random" selects a different voice
          each call so passengers get varied experiences.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VOICE_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => setConfig({ ...config, voice_gender: value })}
              className={clsx(
                "text-left p-4 rounded-xl border-2 transition-all",
                config.voice_gender === value
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Language-specific instructions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Per-Language Instructions</h2>
        <p className="text-xs text-gray-500 mb-4">
          Additional instructions appended to the system prompt for a specific language.
          Leave blank to use the optimised defaults.
        </p>
        <div className="flex gap-2 mb-4 flex-wrap">
          {LANGUAGES.map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => setActiveLang(code)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                activeLang === code
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {flag} {label}
            </button>
          ))}
        </div>
        <textarea
          rows={4}
          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          placeholder={`Additional instructions for ${LANGUAGES.find(l => l.code === activeLang)?.label}…`}
          value={config.language_instructions[activeLang] || ""}
          onChange={e => setConfig({
            ...config,
            language_instructions: { ...config.language_instructions, [activeLang]: e.target.value },
          })}
        />
      </div>

      {/* System prompt override (collapsed by default) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <button
          className="flex items-center justify-between w-full text-left"
          onClick={() => setShowPrompt(!showPrompt)}
        >
          <div>
            <h2 className="font-semibold text-gray-900">System Prompt Override</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {config.system_prompt_override ? "Custom prompt active" : "Using optimised default prompt"}
            </p>
          </div>
          {showPrompt ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showPrompt && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ Overriding the system prompt replaces the entire optimised Aida prompt. Leave blank to use the default.
            </p>
            <textarea
              rows={12}
              className="w-full border border-gray-200 rounded-lg p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-400 resize-y"
              placeholder="Leave blank to use the default optimised prompt…"
              value={config.system_prompt_override || ""}
              onChange={e => setConfig({ ...config, system_prompt_override: e.target.value || null })}
            />
            {config.system_prompt_override && (
              <button onClick={resetPrompt} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500">
                <RotateCcw className="w-3 h-3" /> Reset to default prompt
              </button>
            )}
          </div>
        )}
      </div>

      {/* Live test */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Test Agent Response</h2>
        <div className="flex gap-2 mb-3 flex-wrap">
          {LANGUAGES.map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => setActiveLang(code)}
              className={clsx(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                activeLang === code ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {flag} {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            value={testMessage}
            onChange={e => setTestMessage(e.target.value)}
            placeholder="Type a test message…"
            onKeyDown={e => e.key === "Enter" && testAgent()}
          />
          <button
            onClick={testAgent}
            disabled={testing || !testMessage.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand-700 transition-colors"
          >
            <Play className="w-3 h-3" /> {testing ? "Testing…" : "Test"}
          </button>
        </div>

        {testResult && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="bg-white border border-gray-200 rounded px-2 py-0.5">Intent: {testResult.intent}</span>
              {testResult.escalation_needed && (
                <span className="bg-red-50 border border-red-200 text-red-600 rounded px-2 py-0.5">🔺 Escalation triggered</span>
              )}
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{testResult.response}</p>
            {testResult.suggestions?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {testResult.suggestions.map((s, i) => (
                  <span key={i} className="text-xs bg-brand-50 text-brand-700 rounded-full px-3 py-1">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
