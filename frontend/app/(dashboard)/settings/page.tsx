"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    whatsappEnabled: true,
    emailEnabled: false,
    escalationThreshold: 0.7,
    maxTokens: 1000,
    defaultLanguage: "en",
  });

  const handleToggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">System configuration and feature flags</p>
      </div>

      {/* Feature Flags */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Feature Flags</h2>

        {[
          { key: "voiceEnabled", label: "Voice AI (Bland.ai)", desc: "Enable phone call AI assistance" },
          { key: "whatsappEnabled", label: "WhatsApp", desc: "Enable WhatsApp AI messaging" },
          { key: "emailEnabled", label: "Email AI", desc: "Enable email AI responses (coming soon)" },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 text-sm">{label}</p>
              <p className="text-gray-400 text-xs">{desc}</p>
            </div>
            <button
              onClick={() => handleToggle(key)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings[key as keyof typeof settings] ? "bg-brand-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings[key as keyof typeof settings] ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        ))}
      </section>

      {/* AI Configuration */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">AI Configuration</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Tokens per Response
          </label>
          <input
            type="number"
            value={settings.maxTokens}
            onChange={(e) => setSettings((p) => ({ ...p, maxTokens: parseInt(e.target.value) }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Escalation Threshold: {settings.escalationThreshold}
          </label>
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.05"
            value={settings.escalationThreshold}
            onChange={(e) => setSettings((p) => ({ ...p, escalationThreshold: parseFloat(e.target.value) }))}
            className="w-full accent-brand-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>More Escalations</span>
            <span>Fewer Escalations</span>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}
