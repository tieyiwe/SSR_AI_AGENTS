"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Star, ThumbsUp, ThumbsDown } from "lucide-react";
import MessageBubble from "./MessageBubble";
import LanguageSelector from "./LanguageSelector";
import { clsx } from "clsx";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const SUGGESTIONS = [
  "What time does flight MK014 depart?",
  "I'd like to request a vegetarian meal",
  "Where is check-in for Air Mauritius?",
  "What's the baggage allowance in Business class?",
];

// ── Rating widget shown after ≥3 exchanges ────────────────────────────────────

function RatingWidget({
  conversationId,
  onDismiss,
}: {
  conversationId: string;
  onDismiss: () => void;
}) {
  const [grade, setGrade] = useState(0);
  const [hover, setHover] = useState(0);
  const [taskCompleted, setTaskCompleted] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!grade || taskCompleted === null) return;
    setSubmitting(true);
    try {
      await fetch("/api/backend/v1/admin/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          grade,
          task_completed: taskCompleted,
          feedback: feedback || null,
        }),
      });
      setSubmitted(true);
      setTimeout(onDismiss, 2500);
    } finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="mx-4 mb-3 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p className="text-sm font-semibold text-green-700">Thank you for your feedback! 🙏</p>
        <p className="text-xs text-green-600 mt-0.5">Your rating helps us improve Aida.</p>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 bg-brand-50 border border-brand-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">How did Aida do?</p>

      {/* Star rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setGrade(n)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={clsx(
                "w-6 h-6 transition-colors",
                (hover || grade) >= n ? "text-amber-400 fill-amber-400" : "text-gray-300"
              )}
            />
          </button>
        ))}
        {grade > 0 && (
          <span className="text-xs text-gray-500 ml-2">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][grade]}
          </span>
        )}
      </div>

      {/* Task completed? */}
      <div>
        <p className="text-xs text-gray-600 mb-1.5">Was your request resolved?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setTaskCompleted(true)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              taskCompleted === true
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
            )}
          >
            <ThumbsUp className="w-3.5 h-3.5" /> Yes, resolved
          </button>
          <button
            onClick={() => setTaskCompleted(false)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              taskCompleted === false
                ? "bg-red-100 text-red-700 border-red-300"
                : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
            )}
          >
            <ThumbsDown className="w-3.5 h-3.5" /> Not resolved
          </button>
        </div>
      </div>

      {/* Optional feedback */}
      <input
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
        placeholder="Any comments? (optional)"
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
      />

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={!grade || taskCompleted === null || submitting}
          className="flex-1 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-brand-700 transition-colors"
        >
          {submitting ? "Submitting…" : "Submit Feedback"}
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}


// ── Main chat component ───────────────────────────────────────────────────────

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm **Aida**, your SSR Airport AI assistant. I can help you with flight status, bookings, special requests, and airport information. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState("en");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState(SUGGESTIONS);
  const [showRating, setShowRating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const userMessageCount = messages.filter(m => m.role === "user").length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Show rating prompt after 3 exchanges
  useEffect(() => {
    if (userMessageCount === 3 && conversationId && !showRating) {
      setShowRating(true);
    }
  }, [userMessageCount, conversationId, showRating]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setSuggestions([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: text,
          language,
          channel: "web",
        }),
      });

      const data = await response.json();
      if (data.conversation_id) setConversationId(data.conversation_id);

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response || "I apologize, I could not process your request. Please try again.",
          timestamp: new Date(),
        },
      ]);

      if (data.suggestions?.length) setSuggestions(data.suggestions.slice(0, 3));
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I'm sorry, I'm having trouble connecting. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-h-[calc(100vh-72px)]">
      {/* Language bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-2 flex items-center gap-3">
        <span className="text-xs text-gray-500">Language:</span>
        <LanguageSelector value={language} onChange={setLanguage} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <div className="flex gap-2 items-end">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              AI
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full"
                    style={{ animationDelay: `${i * -0.16}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Rating widget */}
      {showRating && conversationId && (
        <RatingWidget
          conversationId={conversationId}
          onDismiss={() => setShowRating(false)}
        />
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && userMessageCount < 2 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full transition-colors border border-brand-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question… (Enter to send)"
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 max-h-32"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 text-white rounded-xl p-3 transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
