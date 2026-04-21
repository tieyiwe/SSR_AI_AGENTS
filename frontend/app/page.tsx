import Link from "next/link";
import { Plane, MessageCircle, Phone, Globe, CheckCircle } from "lucide-react";

const PHONE_NUMBER = "+230 603 8000";
const PHONE_TEL    = "tel:+2306038000";
const WA_NUMBER    = "14155238886";
const WA_MSG       = encodeURIComponent("Hello Priya, I need assistance at SSR Airport.");

// What Priya can help with — grouped by category
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
      "PNR / booking lookup",
      "Ticket change requests",
      "Seat selection assistance",
      "Upgrade eligibility check",
    ],
  },
  {
    category: "🍽️ Special Services",
    items: [
      "Special meal requests (VGML, KSML, etc.)",
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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex flex-col safe-top">
      <div className="flex-1 flex flex-col items-center px-5 py-10 text-white text-center">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Plane className="w-9 h-9 text-gold-400" />
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">SSR Airport AI</h1>
            <p className="text-brand-200 text-sm">Air Mauritius · Available 24/7</p>
          </div>
        </div>

        {/* Priya intro */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border-4 border-white/20 flex items-center justify-center shadow-xl text-2xl font-bold">
            P
          </div>
          <div>
            <h2 className="text-xl font-bold">Meet Priya</h2>
            <p className="text-brand-200 text-sm">Your personal airport AI assistant</p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 text-xs font-medium">Online now</span>
          </div>
        </div>

        <p className="text-brand-100 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
          Priya handles your airport and travel needs instantly — in your language, around the clock.
        </p>

        {/* ── What Priya can do ─────────────────────────────────── */}
        <div className="w-full max-w-3xl mb-10 text-left">
          <h3 className="text-center text-sm font-semibold text-brand-200 uppercase tracking-widest mb-5">
            What Priya can do for you
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CAPABILITIES.map(({ category, items }) => (
              <div
                key={category}
                className="bg-white/8 backdrop-blur border border-white/15 rounded-2xl p-4"
              >
                <p className="text-sm font-semibold text-white mb-3">{category}</p>
                <ul className="space-y-1.5">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs text-brand-100 leading-relaxed">
                      <CheckCircle className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-brand-300 mt-4">
            Can&apos;t resolve something? Priya escalates to a human agent immediately.
          </p>
        </div>

        {/* ── Contact channels ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl mb-8">

          <Link
            href="/chat"
            className="bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur rounded-2xl p-5 transition-all border border-white/20 text-left group hover:scale-105 active:scale-100"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center mb-3">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-sm mb-1">Web Chat</h3>
            <p className="text-brand-200 text-xs leading-relaxed">
              Chat with Priya right here in your browser — no app needed.
            </p>
            <span className="mt-3 inline-block text-xs font-semibold text-gold-400 group-hover:underline">
              Start chatting →
            </span>
          </Link>

          <a
            href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500/20 hover:bg-green-500/30 active:bg-green-500/40 backdrop-blur rounded-2xl p-5 transition-all border border-green-400/30 text-left group hover:scale-105 active:scale-100"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center mb-3">
              <WhatsAppIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-sm mb-1">WhatsApp</h3>
            <p className="text-brand-200 text-xs leading-relaxed">
              Message Priya on WhatsApp anytime — from anywhere in the world.
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-green-300 group-hover:underline">Open WhatsApp →</span>
            </div>
          </a>

          <a
            href={PHONE_TEL}
            className="bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur rounded-2xl p-5 transition-all border border-white/20 text-left group hover:scale-105 active:scale-100"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center mb-3">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-sm mb-1">Call Us</h3>
            <p className="text-brand-200 text-xs leading-relaxed">
              Tap to call — Priya will assist you over the phone, 24 hours a day.
            </p>
            <p className="mt-3 text-xs font-bold text-gold-400 group-hover:underline">
              <span className="sm:hidden">Tap to call →</span>
              <span className="hidden sm:inline">{PHONE_NUMBER} →</span>
            </p>
          </a>
        </div>

        {/* ── Language badges ───────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap justify-center mb-8">
          <Globe className="w-4 h-4 text-brand-300" />
          <span className="text-brand-300 text-xs">Available in:</span>
          {["🇬🇧 English", "🇫🇷 Français", "🇲🇺 Kreol", "🇮🇳 हिन्दी"].map(lang => (
            <span key={lang} className="text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1 text-brand-100">
              {lang}
            </span>
          ))}
        </div>

        {/* ── Stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
          {[
            { value: "70%",  label: "Automation Rate" },
            { value: "<5s",  label: "Response Time" },
            { value: "4",    label: "Languages" },
            { value: "24/7", label: "Availability" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-gold-400">{value}</div>
              <div className="text-brand-200 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center safe-bottom">
        <p className="text-brand-400 text-xs">
          SSR International Airport · Mauritius
          <span className="mx-2">·</span>
          <a href="/login" className="hover:text-brand-300 transition-colors">Staff access</a>
        </p>
      </footer>
    </main>
  );
}
