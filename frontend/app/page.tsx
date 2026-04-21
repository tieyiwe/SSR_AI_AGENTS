import Link from "next/link";
import { Plane, MessageCircle, BarChart3, Phone } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-800 to-brand-600 flex flex-col items-center justify-center p-8 text-white">
      <div className="max-w-4xl w-full text-center">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Plane className="w-10 h-10 text-gold-400" />
          <div>
            <h1 className="text-3xl font-bold">SSR Airport AI</h1>
            <p className="text-brand-100 text-sm">Air Mauritius Passenger Assistant</p>
          </div>
        </div>

        <p className="text-brand-100 text-lg mb-12 max-w-2xl mx-auto">
          AI-powered assistance for flight information, bookings, and airport services.
          Available 24/7 in English, French, Creole, and Hindi.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            href="/chat"
            className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl p-6 transition-all border border-white/20 text-left group"
          >
            <MessageCircle className="w-8 h-8 text-gold-400 mb-3 group-hover:scale-110 transition-transform" />
            <h2 className="text-lg font-semibold mb-1">Chat Assistant</h2>
            <p className="text-brand-100 text-sm">Get instant answers about flights, bookings, and airport info</p>
          </Link>

          <Link
            href="/dashboard"
            className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl p-6 transition-all border border-white/20 text-left group"
          >
            <BarChart3 className="w-8 h-8 text-gold-400 mb-3 group-hover:scale-110 transition-transform" />
            <h2 className="text-lg font-semibold mb-1">Operations Dashboard</h2>
            <p className="text-brand-100 text-sm">Real-time metrics, call logs, and performance analytics</p>
          </Link>

          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20 text-left">
            <Phone className="w-8 h-8 text-gold-400 mb-3" />
            <h2 className="text-lg font-semibold mb-1">Voice AI</h2>
            <p className="text-brand-100 text-sm">Call +230 603 800 for 24/7 AI-powered phone assistance</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { value: "70%", label: "Automation Rate" },
            { value: "<5s", label: "Response Time" },
            { value: "4", label: "Languages" },
            { value: "24/7", label: "Availability" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/5 rounded-lg p-4">
              <div className="text-2xl font-bold text-gold-400">{value}</div>
              <div className="text-brand-100 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
