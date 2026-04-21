"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, MessageCircle, Minimize2, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import ChatInterface from "./ChatInterface";

// WhatsApp number for SSR Airport AI (Twilio sandbox or production)
const WHATSAPP_NUMBER = "14155238886"; // without +, used in wa.me link
const WHATSAPP_MSG = encodeURIComponent("Hello Priya, I need assistance at SSR Airport.");

function PriyaAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-lg" : "w-9 h-9 text-sm";
  return (
    <div className={clsx(
      "rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold shrink-0",
      sz
    )}>
      A
    </div>
  );
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "whatsapp">("chat");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Don't render on full chat page, login, or dashboard routes
  if (
    pathname.startsWith("/chat") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/calls") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  // Panel dimensions — full screen on mobile, fixed card on desktop
  const panelCls = isMobile
    ? "fixed inset-0 z-50 flex flex-col bg-white"
    : "w-[360px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden";

  return (
    <div className={clsx("z-50", isMobile ? "" : "fixed bottom-6 right-6 flex flex-col items-end gap-3")}>
      {/* Expanded panel */}
      {open && (
        <div className={panelCls}>
          {/* Panel header — with safe-area top on mobile */}
          <div className={clsx(
            "bg-gradient-to-r from-brand-700 to-brand-600 px-4 py-3 flex items-center gap-3 flex-shrink-0",
            isMobile && "safe-top"
          )}>
            <PriyaAvatar size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">Priya</p>
              <p className="text-brand-100 text-xs">SSR Airport Assistant</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-300 text-xs">Online</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {!isMobile && (
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-brand-600 transition-colors text-brand-100 hover:text-white"
                  title="Minimise"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-brand-600 transition-colors text-brand-100 hover:text-white"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() => setTab("chat")}
              className={clsx(
                "flex-1 py-2.5 text-xs font-medium transition-colors",
                tab === "chat"
                  ? "text-brand-600 border-b-2 border-brand-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              💬 Web Chat
            </button>
            <button
              onClick={() => setTab("whatsapp")}
              className={clsx(
                "flex-1 py-2.5 text-xs font-medium transition-colors",
                tab === "whatsapp"
                  ? "text-green-600 border-b-2 border-green-500"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <span className="flex items-center justify-center gap-1">
                <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
              </span>
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {tab === "chat" ? (
              <ChatInterface className="flex flex-col flex-1 min-h-0 overflow-hidden" />
            ) : (
              <WhatsAppTab />
            )}
          </div>

          {/* Safe area bottom spacer on mobile */}
          {isMobile && <div className="safe-bottom flex-shrink-0 bg-white" />}
        </div>
      )}

      {/* Floating button — hide when panel is open on mobile (panel is full screen) */}
      {(!open || !isMobile) && (
        <button
          onClick={() => setOpen(!open)}
          className={clsx(
            "group flex items-center gap-3 px-4 py-3 rounded-full shadow-xl transition-all duration-300",
            "bg-gradient-to-r from-brand-600 to-brand-700 text-white",
            "hover:from-brand-700 hover:to-brand-800 hover:shadow-2xl hover:scale-105 active:scale-95",
            isMobile ? "fixed bottom-5 right-5 z-50" : "",
            open && !isMobile && "opacity-0 pointer-events-none scale-90"
          )}
        >
          <PriyaAvatar size="sm" />
          <div className="text-left">
            <p className="text-xs font-bold leading-tight">Chat with Priya</p>
            <p className="text-brand-200 text-xs">Airport Assistant</p>
          </div>
          <MessageCircle className="w-4 h-4 text-brand-200 group-hover:text-white transition-colors" />
        </button>
      )}
    </div>
  );
}

// ── WhatsApp tab ──────────────────────────────────────────────────────────────

function WhatsAppTab() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-green-50">
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
        <WhatsAppIcon className="w-9 h-9 text-white" />
      </div>

      <h3 className="font-bold text-gray-900 text-base mb-1">Chat on WhatsApp</h3>
      <p className="text-sm text-gray-500 text-center mb-6 max-w-[240px]">
        Get instant help from Priya directly in WhatsApp — available 24/7 in English, Français, Kreol & हिन्दी.
      </p>

      {/* Steps */}
      <div className="w-full space-y-2 mb-6">
        {[
          { step: "1", text: "Tap the button below to open WhatsApp" },
          { step: "2", text: "Send the pre-filled greeting message" },
          { step: "3", text: "Priya will respond within seconds" },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-start gap-3 bg-white rounded-xl px-3 py-2 border border-green-100">
            <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {step}
            </span>
            <p className="text-xs text-gray-600">{text}</p>
          </div>
        ))}
      </div>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md"
      >
        <WhatsAppIcon className="w-5 h-5" />
        Open in WhatsApp
        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
      </a>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Free to use · No account needed · Reply anytime
      </p>
    </div>
  );
}

// ── WhatsApp SVG icon (official brand mark) ───────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
