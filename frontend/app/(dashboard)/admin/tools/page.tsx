"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Play, CheckCircle, XCircle, AlertCircle, Plug, Plus } from "lucide-react";
import { clsx } from "clsx";

const BASE = "/api/backend";

type ToolStatus = {
  name: string;
  label: string;
  description: string;
  status: "connected" | "unconfigured" | "mock" | "error";
  requires_config: string[];
};

type TestResult = {
  ok: boolean;
  result?: unknown;
  error?: string;
  tested_at?: string;
};

const STATUS_CONFIG = {
  connected:    { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle, label: "Connected" },
  unconfigured: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle, label: "Unconfigured" },
  mock:         { color: "bg-blue-100 text-blue-700 border-blue-200",   icon: AlertCircle, label: "Mock Mode" },
  error:        { color: "bg-red-100 text-red-700 border-red-200",      icon: XCircle,     label: "Error" },
};

const SAMPLE_PARAMS: Record<string, Record<string, string>> = {
  get_flight_status:    { flight_number: "MK014" },
  get_booking_info:     { pnr: "ABC123" },
  request_special_service: { pnr: "ABC123", service_code: "VGML" },
  get_airport_info:     { topic: "lounge" },
  escalate_to_human:    { reason: "Customer requested human", priority: "normal" },
};

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [expandedSchema, setExpandedSchema] = useState<string | null>(null);
  const [customParams, setCustomParams] = useState<Record<string, string>>({});

  const loadTools = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/v1/admin/tools`);
      const data = await r.json();
      setTools(data.tools || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadTools(); }, []);

  const testTool = async (toolName: string) => {
    setTesting(toolName);
    try {
      let params: Record<string, string> = SAMPLE_PARAMS[toolName] || {};
      if (customParams[toolName]) {
        try { params = JSON.parse(customParams[toolName]); } catch { /* keep defaults */ }
      }
      const r = await fetch(`${BASE}/v1/admin/tools/${toolName}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const result = await r.json();
      setTestResults(prev => ({ ...prev, [toolName]: result }));
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : "Unknown error";
      setTestResults(prev => ({ ...prev, [toolName]: { ok: false, error: err } }));
    } finally { setTesting(null); }
  };

  const connected = tools.filter(t => t.status === "connected").length;
  const unconfigured = tools.filter(t => t.status === "unconfigured").length;

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service Connectors</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tool registry for agent integrations. Add API keys in Replit Secrets to activate connectors.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Tools", value: tools.length, color: "text-gray-900" },
          { label: "Connected", value: connected, color: "text-green-600" },
          { label: "Need Config", value: unconfigured, color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={clsx("text-2xl font-bold mt-1", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* How to connect */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Plug className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Connecting a real service</p>
            <p className="text-xs text-blue-700 mt-1">
              Add the required API key(s) to <strong>Replit Secrets</strong> (or your <code>.env</code> file).
              The connector will automatically switch from demo to live mode on next request.
              No code changes needed — new connectors can be added in{" "}
              <code className="bg-blue-100 px-1 rounded">backend/app/services/agent_tools.py</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Tool cards */}
      {loading ? (
        <div className="text-sm text-gray-400">Loading connectors…</div>
      ) : (
        <div className="space-y-4">
          {tools.map(tool => {
            const cfg = STATUS_CONFIG[tool.status] || STATUS_CONFIG.mock;
            const Icon = cfg.icon;
            const result = testResults[tool.name];
            const isExpanded = expandedSchema === tool.name;

            return (
              <div key={tool.name} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{tool.label}</span>
                        <span className={clsx(
                          "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium",
                          cfg.color
                        )}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{tool.description}</p>
                      <code className="text-xs text-gray-400 mt-1 inline-block">{tool.name}</code>

                      {tool.requires_config.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {tool.requires_config.map(key => (
                            <span key={key} className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-gray-500 font-mono">
                              {key}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedSchema(isExpanded ? null : tool.name)}
                        className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {isExpanded ? "Hide" : "Schema"}
                      </button>
                      <button
                        onClick={() => testTool(tool.name)}
                        disabled={testing === tool.name}
                        className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-brand-700 transition-colors"
                      >
                        {testing === tool.name
                          ? <><RefreshCw className="w-3 h-3 animate-spin" /> Testing…</>
                          : <><Play className="w-3 h-3" /> Test</>
                        }
                      </button>
                    </div>
                  </div>

                  {/* Custom params */}
                  <div className="mt-3">
                    <input
                      className="w-full border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-400 bg-gray-50"
                      placeholder={`Test params (JSON) — default: ${JSON.stringify(SAMPLE_PARAMS[tool.name] || {})}`}
                      value={customParams[tool.name] || ""}
                      onChange={e => setCustomParams(prev => ({ ...prev, [tool.name]: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Schema viewer */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Anthropic Tool Schema</p>
                    <pre className="text-xs text-gray-600 overflow-auto">
                      {JSON.stringify(SAMPLE_PARAMS[tool.name] || {}, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Test result */}
                {result && (
                  <div className={clsx(
                    "border-t p-4",
                    result.ok ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {result.ok
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        : <XCircle className="w-3.5 h-3.5 text-red-500" />
                      }
                      <span className="text-xs font-medium text-gray-700">
                        {result.ok ? "Test passed" : "Test failed"}
                      </span>
                      {result.tested_at && (
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(result.tested_at).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <pre className="text-xs text-gray-600 overflow-auto max-h-40">
                      {result.ok
                        ? JSON.stringify(result.result, null, 2)
                        : result.error}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add future connector placeholder */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
        <Plus className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-500">Add a New Connector</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          Subclass <code>ServiceConnector</code> in{" "}
          <code>backend/app/services/agent_tools.py</code> and register it.
          Supports any REST API, webhook, or internal service.
        </p>
      </div>
    </div>
  );
}
