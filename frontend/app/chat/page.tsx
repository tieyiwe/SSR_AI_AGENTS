import ChatInterface from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-brand-800 text-white px-6 py-4 flex items-center gap-3 shadow-md">
        <img src="/logo.png" alt="Air Mauritius" className="h-8 w-8 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div>
          <h1 className="font-semibold text-sm">SSR Airport AI Assistant</h1>
          <p className="text-brand-100 text-xs">Air Mauritius — Available 24/7</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-brand-100">Online</span>
        </div>
      </header>
      <ChatInterface />
    </div>
  );
}
