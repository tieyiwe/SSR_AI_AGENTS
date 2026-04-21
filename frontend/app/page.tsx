import Link from "next/link";
import { Plane, MessageCircle, Phone, Globe } from "lucide-react";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-white text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Plane className="w-10 h-10 text-gold-400" />
          <div className="text-left">
            <h1 className="text-3xl font-bold leading-tight">SSR Airport AI</h1>
            <p className="text-brand-200 text-sm">Air Mauritius · Available 24/7</p>
          </div>
        </div>

        {/* Priya introduction */}
        <div className="mt-6 mb-10 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border-4 border-white/20 flex items-center justify-center shadow-xl text-2xl font-bold">
            A
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

        <p className="text-brand-100 text-base mb-10 max-w-xl mx-auto">
          Priya helps you with flight status, bookings, special requests, and airport information
          — instantly, in your language.
        </p>

        {/* Contact channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-10">
          {/* Web chat */}
          <Link
            href="/chat"
            className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-2xl p-5 transition-all border border-white/20 text-left group hover:scale-105"
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

          {/* WhatsApp */}
          <a
            href={`https://wa.me/14155238886?text=${encodeURIComponent("Hello Priya, I need assistance at SSR Airport.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500/20 hover:bg-green-500/30 backdrop-blur rounded-2xl p-5 transition-all border border-green-400/30 text-left group hover:scale-105"
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
              <span className="text-xs font-semibold text-green-300 group-hover:underline">
                Open WhatsApp →
              </span>
            </div>
          </a>

          {/* Phone */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20 text-left">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center mb-3">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-sm mb-1">Phone</h3>
            <p className="text-brand-200 text-xs leading-relaxed">
              Call us and Priya will assist you over the phone, 24 hours a day.
            </p>
            <p className="mt-3 text-xs font-bold text-gold-400">+230 603 8000</p>
          </div>
        </div>

        {/* Language badges */}
        <div className="flex items-center gap-2 flex-wrap justify-center mb-10">
          <Globe className="w-4 h-4 text-brand-300" />
          <span className="text-brand-300 text-xs">Available in:</span>
          {["🇬🇧 English", "🇫🇷 Français", "🇲🇺 Kreol", "🇮🇳 हिन्दी"].map(lang => (
            <span key={lang} className="text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1 text-brand-100">
              {lang}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
          {[
            { value: "70%", label: "Automation Rate" },
            { value: "<5s", label: "Response Time" },
            { value: "4", label: "Languages" },
            { value: "24/7", label: "Availability" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-gold-400">{value}</div>
              <div className="text-brand-200 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer — staff access hidden, not highlighted */}
      <footer className="py-4 text-center">
        <p className="text-brand-400 text-xs">
          SSR International Airport · Mauritius
          <span className="mx-2">·</span>
          <a href="/login" className="hover:text-brand-300 transition-colors">Staff access</a>
        </p>
      </footer>
    </main>
  );
}
