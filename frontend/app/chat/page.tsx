"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gradient-to-r from-brand-800 to-brand-700 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <Link href="/" className="p-1.5 rounded-lg hover:bg-brand-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Aida avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border-2 border-white/30 flex items-center justify-center font-bold text-sm shrink-0">
          A
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm">Aida</h1>
            <span className="text-xs bg-white/10 border border-white/20 rounded-full px-2 py-0.5 text-brand-100">
              AI Assistant
            </span>
          </div>
          <p className="text-brand-200 text-xs">SSR Airport · Air Mauritius</p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-300 font-medium">Online</span>
        </div>
      </header>

      <ChatInterface />
    </div>
  );
}
