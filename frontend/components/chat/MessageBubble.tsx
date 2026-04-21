import { format } from "date-fns";
import { clsx } from "clsx";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isHumanAgent?: boolean;
};

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isHuman = message.isHumanAgent;

  return (
    <div className={clsx("message-bubble flex gap-2 items-end", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={clsx(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
          isUser ? "bg-gray-300 text-gray-600"
            : isHuman ? "bg-green-500 text-white"
            : "bg-brand-600 text-white"
        )}
      >
        {isUser ? "You" : isHuman ? "H" : "AI"}
      </div>

      {/* Bubble */}
      <div className={clsx("max-w-[75%]", isUser ? "items-end" : "items-start")}>
        {isHuman && (
          <p className="text-xs text-green-600 font-medium mb-0.5 px-1">Human Agent</p>
        )}
        <div
          className={clsx(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-brand-600 text-white rounded-br-sm"
              : isHuman
              ? "bg-green-50 text-green-900 border border-green-200 rounded-bl-sm"
              : "bg-gray-100 text-gray-800 rounded-bl-sm"
          )}
        >
          {message.content}
        </div>
        <p className={clsx("text-xs text-gray-400 mt-1 px-1", isUser && "text-right")}>
          {format(message.timestamp, "HH:mm")}
        </p>
      </div>
    </div>
  );
}
