"use client";

import { useState } from "react";
import { Play, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { clsx } from "clsx";

const BASE = "/api/backend";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", sample: "Hello, what is the status of flight MK014?" },
  { code: "fr", label: "Français", flag: "🇫🇷", sample: "Bonjour, quel est le statut du vol MK014 ?" },
  { code: "cr", label: "Kreol Morisien", flag: "🇲🇺", sample: "Bonzour, ki status lavion MK014 ?" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳", sample: "नमस्ते, उड़ान MK014 की स्थिति क्या है?" },
];

type LangResult = {
  ok: boolean;
  response?: string;
  suggestions?: string[];
  intent?: string;
  detected_language?: string;
  escalation_needed?: boolean;
  error?: string;
};

type AllResults = Record<string, LangResult>;

type SingleResult = {
  input_message: string;
  language: string;
  detected_language: string;
  response: string;
  suggestions: string[];
  intent: string;
  escalation_needed: boolean;
  tokens_used: number;
} | null;

export default function LanguagesPage() {
  const [message, setMessage] = useState("Hello, what is the status of flight MK014?");
  const [allResults, setAllResults] = useState<AllResults | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);

  const [singleLang, setSingleLang] = useState("en");
  const [singleMsg, setSingleMsg] = useState("");
  const [singleResult, setSingleResult] = useState<SingleResult>(null);
  const [loadingSingle, setLoadingSingle] = useState(false);

  const testAll = async () => {
    setLoadingAll(true); setAllResults(null);
    try {
      const r = await fetch(`${BASE}/v1/admin/test-all-languages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await r.json();
      setAllResults(data.results);
    } finally { setLoadingAll(false); }
  };

  const testSingle = async (lang: string, msg: string) => {
    setLoadingSingle(true); setSingleResult(null); setSingleLang(lang);
    try {
      const r = await fetch(`${BASE}/v1/admin/test-language`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, language: lang }),
      });
      setSingleResult(await r.json());
    } finally { setLoadingSingle(false); }
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Language Testing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Validate that all 4 languages produce correct, natural responses end-to-end
        </p>
      </div>

      {/* Test all languages */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Side-by-Side Comparison</h2>
        <p className="text-xs text-gray-500 mb-4">
          Fire one message through all languages simultaneously and compare the AI responses.
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type a test message in any language…"
          />
          <button
            onClick={testAll}
            disabled={loadingAll || !message.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand-700 transition-colors"
          >
            {loadingAll
              ? <><RefreshCw className="w-3 h-3 animate-spin" /> Testing…</>
              : <><Play className="w-3 h-3" /> Test All Languages</>
            }
          </button>
        </div>

        {allResults && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {LANGUAGES.map(({ code, label, flag }) => {
              const r = allResults[code];
              return (
                <div key={code} className={clsx(
                  "rounded-xl border p-4 space-y-2",
                  r?.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                )}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-800">{flag} {label}</span>
                    {r?.ok
                      ? <CheckCircle className="w-4 h-4 text-green-600" />
                      : <XCircle className="w-4 h-4 text-red-500" />
                    }
                  </div>
                  {r?.ok ? (
                    <>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.response}</p>
                      {r.suggestions && r.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {r.suggestions.map((s, i) => (
                            <span key={i} className="text-xs bg-white border border-green-200 text-green-700 rounded-full px-2 py-0.5">{s}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 text-xs text-gray-400 pt-1">
                        <span>Intent: {r.intent}</span>
                        {r.escalation_needed && <span className="text-red-500">⚠ Escalation</span>}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-red-600">Error: {r?.error}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-language quick tests */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Per-Language Quick Tests</h2>
        <p className="text-xs text-gray-500 mb-5">
          Click any sample message to test it, or type your own in the input below.
        </p>

        <div className="space-y-5">
          {LANGUAGES.map(({ code, label, flag, sample }) => (
            <div key={code} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-800">{flag} {label}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{code}</span>
              </div>

              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  defaultValue={sample}
                  id={`input-${code}`}
                  placeholder={`Test message in ${label}…`}
                />
                <button
                  onClick={() => {
                    const el = document.getElementById(`input-${code}`) as HTMLInputElement;
                    testSingle(code, el?.value || sample);
                  }}
                  disabled={loadingSingle && singleLang === code}
                  className="px-3 py-2 bg-brand-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-brand-700 transition-colors"
                >
                  {loadingSingle && singleLang === code ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                </button>
              </div>

              {singleResult && singleLang === code && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>Detected: <strong>{singleResult.detected_language}</strong></span>
                    <span>Intent: <strong>{singleResult.intent}</strong></span>
                    {singleResult.tokens_used > 0 && <span>{singleResult.tokens_used} tokens</span>}
                    {singleResult.escalation_needed && (
                      <span className="text-red-500 font-medium">⚠ Escalation triggered</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{singleResult.response}</p>
                  {singleResult.suggestions?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {singleResult.suggestions.map((s, i) => (
                        <span key={i} className="text-xs bg-brand-50 text-brand-700 rounded-full px-3 py-1">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Language detection tester */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Language Detection Tester</h2>
        <p className="text-xs text-gray-500 mb-4">
          Type any message and see which language the system auto-detects.
        </p>
        <div className="space-y-2">
          {[
            { text: "Bonjour, je voudrais savoir le statut de mon vol", expected: "fr" },
            { text: "Bonzour, mo bizin konn status mo lavion", expected: "cr" },
            { text: "नमस्ते, मुझे अपनी उड़ान की जानकारी चाहिए", expected: "hi" },
            { text: "Hello, I need help with my booking reference ABC123", expected: "en" },
          ].map(({ text, expected }, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
              <button
                onClick={() => testSingle(expected, text)}
                className="shrink-0 px-2 py-1 bg-brand-600 text-white rounded text-xs hover:bg-brand-700"
              >
                Test
              </button>
              <span className="flex-1 text-gray-600 italic">"{text}"</span>
              <span className="shrink-0 text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded px-2 py-0.5">
                → {expected}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
