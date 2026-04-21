"use client";

import Link from "next/link";
import { ArrowLeft, Phone } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";

const PHONE_TEL = "tel:+2306038000";

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-50 safe-top safe-bottom">
      <header className="bg-gradient-to-r from-brand-800 to-brand-700 text-white px-4 py-3 flex items-center gap-3 shadow-md flex-shrink-0">
        <Link
          href="/"
          className="p-1.5 rounded-lg hover:bg-brand-700 active:bg-brand-600 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Priya avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border-2 border-white/30 flex items-center justify-center font-bold text-sm shrink-0">
          P
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm">Priya</h1>
            <span className="text-xs bg-white/10 border border-white/20 rounded-full px-2 py-0.5 text-brand-100">
              Airport Assistant
            </span>
          </div>
          <p className="text-brand-200 text-xs">SSR Airport · Air Mauritius</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-300 font-medium">Online</span>
          </div>
          {/* Phone button — tapping on mobile opens native dialer */}
          <a
            href={PHONE_TEL}
            className="p-1.5 rounded-lg hover:bg-brand-700 active:bg-brand-600 transition-colors text-brand-200 hover:text-white"
            aria-label="Call +230 603 8000"
            title="+230 603 8000"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>
      </header>

      <ChatInterface />
    </div>
  );
}
