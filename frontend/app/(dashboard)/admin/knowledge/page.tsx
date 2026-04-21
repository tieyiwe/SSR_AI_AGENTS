"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Plus, Search, Edit2, Trash2, X, Check,
  Tag, ChevronDown, Loader2,
} from "lucide-react";
import { clsx } from "clsx";

type KBEntry = {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  active: boolean;
  created_at: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  "Flights":          "bg-blue-100 text-blue-700",
  "Bookings":         "bg-purple-100 text-purple-700",
  "Special Services": "bg-amber-100 text-amber-700",
  "Airport Info":     "bg-green-100 text-green-700",
  "Policies":         "bg-red-100 text-red-700",
  "General":          "bg-gray-100 text-gray-700",
};

const EMPTY_FORM = { category: "Flights", question: "", answer: "", keywords: "", active: true };

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [editEntry, setEditEntry] = useState<KBEntry | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (catFilter !== "All") params.set("category", catFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    const r = await fetch(`/api/backend/v1/admin/knowledge?${params}`);
    if (r.ok) {
      const d = await r.json();
      setEntries(d.entries ?? []);
      if (d.categories) setCategories(d.categories);
    }
    setLoading(false);
  }, [catFilter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const saveNew = async () => {
    setSaving(true);
    const body = {
      ...form,
      keywords: form.keywords.split(",").map((k: string) => k.trim()).filter(Boolean),
    };
    const r = await fetch("/api/backend/v1/admin/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      setShowAdd(false);
      setForm(EMPTY_FORM);
      await load();
    }
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    setSaving(true);
    const r = await fetch(`/api/backend/v1/admin/knowledge/${editEntry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: editEntry.category,
        question: editEntry.question,
        answer: editEntry.answer,
        keywords: editEntry.keywords,
        active: editEntry.active,
      }),
    });
    if (r.ok) {
      setEditEntry(null);
      await load();
    }
    setSaving(false);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this knowledge entry?")) return;
    await fetch(`/api/backend/v1/admin/knowledge/${id}`, { method: "DELETE" });
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const allCats = ["All", ...categories];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            Knowledge Base
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            FAQ entries and policy knowledge that Priya references when answering passengers
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditEntry(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions, answers, keywords…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {allCats.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={clsx(
                "text-xs px-3 py-1.5 rounded-full border transition-colors",
                catFilter === c
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-brand-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-800">New Knowledge Entry</h3>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Keywords (comma-separated)</label>
              <input
                value={form.keywords}
                onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                placeholder="e.g. baggage, luggage, weight"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Question</label>
            <input
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              placeholder="e.g. What is the baggage allowance?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Answer</label>
            <textarea
              value={form.answer}
              onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
              rows={3}
              placeholder="Full answer Priya will use when responding to this question…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Cancel
            </button>
            <button
              onClick={saveNew}
              disabled={saving || !form.question.trim() || !form.answer.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save Entry
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No entries found</p>
          <p className="text-sm text-gray-300 mt-1">Try a different search or add a new entry</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div
              key={entry.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              {editEntry?.id === entry.id ? (
                // Edit mode
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                      <select
                        value={editEntry.category}
                        onChange={e => setEditEntry(ev => ev ? { ...ev, category: e.target.value } : ev)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {categories.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Keywords</label>
                      <input
                        value={editEntry.keywords.join(", ")}
                        onChange={e => setEditEntry(ev => ev ? { ...ev, keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean) } : ev)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Question</label>
                    <input
                      value={editEntry.question}
                      onChange={e => setEditEntry(ev => ev ? { ...ev, question: e.target.value } : ev)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Answer</label>
                    <textarea
                      value={editEntry.answer}
                      onChange={e => setEditEntry(ev => ev ? { ...ev, answer: e.target.value } : ev)}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditEntry(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", CATEGORY_COLORS[entry.category] ?? "bg-gray-100 text-gray-700")}>
                          {entry.category}
                        </span>
                        {!entry.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Inactive</span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{entry.question}</p>
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">{entry.answer}</p>
                      {entry.keywords.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Tag className="w-3 h-3 text-gray-400" />
                          {entry.keywords.map(k => (
                            <span key={k} className="text-xs bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-500">
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditEntry(entry); setShowAdd(false); }}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
