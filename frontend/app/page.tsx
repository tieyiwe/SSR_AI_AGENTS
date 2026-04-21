"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Plane, MessageCircle, Phone, Globe, CheckCircle } from "lucide-react";

const PHONE_NUMBER = "+230 603 8000";
const PHONE_TEL    = "tel:+2306038000";
const WA_NUMBER    = "14155238886";
const WA_MSG       = encodeURIComponent("Hello Priya, I need assistance at SSR Airport.");

const CAPABILITIES = [
  {
    category: "✈️ Flights",
    items: [
      "Real-time flight status & gate updates",
      "Departure & arrival times",
      "Flight delay or cancellation info",
      "Connecting flight guidance",
    ],
  },
  {
    category: "🎫 Bookings",
    items: [
      "PNR / booking reference lookup",
      "Ticket change requests",
      "Seat selection assistance",
      "Upgrade eligibility check",
    ],
  },
  {
    category: "🍽️ Special Services",
    items: [
      "Special meal requests (VGML, KSML…)",
      "Wheelchair & mobility assistance",
      "Unaccompanied minor arrangements",
      "Medical equipment on board",
    ],
  },
  {
    category: "🏢 Airport Info",
    items: [
      "Check-in desk locations & hours",
      "Lounge access & eligibility",
      "Baggage allowance & rules",
      "Duty-free, shops & facilities",
    ],
  },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const LANG_OPTIONS = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English",  flag: "🇬🇧" },
  { code: "cr", label: "Kreol",    flag: "🇲🇺" },
  { code: "hi", label: "हिन्दी",   flag: "🇮🇳" },
];

function useLanguage() {
  const [lang, setLang] = useState("fr");
  useEffect(() => {
    const stored = localStorage.getItem("aass_lang");
    if (stored) setLang(stored);
  }, []);
  const choose = (code: string) => {
    setLang(code);
    localStorage.setItem("aass_lang", code);
  };
  return { lang, choose };
}

export default function HomePage() {
  const { lang, choose } = useLanguage();
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex flex-col safe-top">
      <div className="flex-1 flex flex-col px-5 py-8 text-white max-w-5xl mx-auto w-full">

        {/* ── Top bar: logo ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <Plane className="w-8 h-8 text-gold-400 shrink-0" />
          <div>
            <h1 className="text-xs font-bold leading-tight tracking-widest uppercase text-brand-100">
              SSR-Airport Advanced Assisting System
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-black text-white tracking-tight">AASS</span>
              <span className="text-brand-300 text-xs">· Air Mauritius · 24/7</span>
            </div>
          </div>
        </div>

        {/* ── Main two-column layout ────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1">

          {/* LEFT: Agent card + contact channels */}
          <div className="lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4">

            {/* Priya card */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border-4 border-white/25 flex items-center justify-center shadow-xl text-3xl font-bold mx-auto mb-4">
                P
              </div>
              <h2 className="text-lg font-bold">Priya</h2>
              <p className="text-brand-200 text-sm mt-0.5">AASS · Your Airport Assistant</p>
              <div className="flex items-center justify-center gap-1.5 mt-3 bg-green-500/20 border border-green-400/30 rounded-full px-3 py-1 w-fit mx-auto">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-300 text-xs font-medium">Online now</span>
              </div>
              <p className="text-brand-200 text-xs mt-4 leading-relaxed">
                Instant help with flights, bookings, special requests, and airport info — in your language.
              </p>
            </div>

            {/* Contact channels */}
            <div className="space-y-2.5">
              <Link
                href={`/chat?lang=${lang}`}
                className="flex items-center gap-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 rounded-2xl px-5 py-4 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">Web Chat</p>
                  <p className="text-brand-200 text-xs">Chat in your browser now</p>
                </div>
                <span className="text-brand-200 text-lg group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>

              <a
                href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-green-600/80 hover:bg-green-600 active:bg-green-700 rounded-2xl px-5 py-4 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">WhatsApp</p>
                  <p className="text-green-200 text-xs">Message from anywhere</p>
                </div>
                <span className="text-green-200 text-lg group-hover:translate-x-0.5 transition-transform">→</span>
              </a>

              <a
                href={PHONE_TEL}
                className="flex items-center gap-4 bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-2xl px-5 py-4 transition-all group border border-white/20"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">Call Us</p>
                  <p className="text-brand-200 text-xs">
                    <span className="sm:hidden">Tap to call now</span>
                    <span className="hidden sm:inline">{PHONE_NUMBER}</span>
                  </p>
                </div>
                <span className="text-brand-200 text-lg group-hover:translate-x-0.5 transition-transform">→</span>
              </a>
            </div>

            {/* Language selector */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-brand-300 shrink-0" />
                <span className="text-brand-300 text-xs">Choose your language:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {LANG_OPTIONS.map(({ code, label, flag }) => (
                  <button
                    key={code}
                    onClick={() => choose(code)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      lang === code
                        ? "bg-white text-brand-800 border-white font-semibold"
                        : "bg-white/10 text-brand-100 border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {flag} {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Capability list */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-semibold text-brand-200 uppercase tracking-widest mb-4">
                Everything Priya can help with
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CAPABILITIES.map(({ category, items }) => (
                  <div
                    key={category}
                    className="bg-white/8 backdrop-blur border border-white/15 rounded-2xl p-4"
                  >
                    <p className="text-sm font-bold text-white mb-3">{category}</p>
                    <ul className="space-y-2">
                      {items.map(item => (
                        <li key={item} className="flex items-start gap-2.5 text-xs text-brand-100 leading-relaxed">
                          <CheckCircle className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-brand-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              Can&apos;t resolve something? Priya transfers you to a human agent immediately.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-auto">
              {[
                { value: "70%",  label: "Automation" },
                { value: "<5s",  label: "Response time" },
                { value: "4",    label: "Languages" },
                { value: "24/7", label: "Available" },
              ].map(({ value, label }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gold-400">{value}</div>
                  <div className="text-brand-200 text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center safe-bottom border-t border-white/10">
        <p className="text-brand-400 text-xs">
          SSR International Airport · Mauritius
          <span className="mx-2">·</span>
          <a href="/login" className="hover:text-brand-300 transition-colors">Staff access</a>
        </p>
      </footer>
    </main>
  );
}
