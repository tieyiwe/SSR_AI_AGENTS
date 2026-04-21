import { format } from "date-fns";
import { clsx } from "clsx";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={clsx("message-bubble flex gap-2 items-end", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={clsx(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
          isUser ? "bg-gray-300 text-gray-600" : "bg-brand-600 text-white"
        )}
      >
        {isUser ? "You" : "AI"}
      </div>

      {/* Bubble */}
      <div className={clsx("max-w-[75%]", isUser ? "items-end" : "items-start")}>
        <div
          className={clsx(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-brand-600 text-white rounded-br-sm"
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
