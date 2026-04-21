"use client";

import { useState, useEffect } from "react";
import { Clock, Phone } from "lucide-react";

const MOCK_QUEUE = [
  {
    id: "eq-001",
    caller: "+230 5678 9012",
    reason: "Flight cancellation and refund request",
    priority: "high",
    waited: 180,
    status: "pending",
  },
  {
    id: "eq-002",
    caller: "+230 5823 4567",
    reason: "Booking modification — date change",
    priority: "normal",
    waited: 95,
    status: "pending",
  },
  {
    id: "eq-003",
    caller: "+230 5934 5678",
    reason: "Wheelchair assistance urgent",
    priority: "urgent",
    waited: 45,
    status: "assigned",
  },
];

const priorityStyles: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  normal: "bg-blue-100 text-blue-700",
  low: "bg-gray-100 text-gray-600",
};

function formatWait(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function LiveQueue() {
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [waited, setWaited] = useState(queue.map((q) => q.waited));

  useEffect(() => {
    const timer = setInterval(() => {
      setWaited((prev) => prev.map((w) => w + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (queue.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No pending escalations
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {queue.map((item, i) => (
        <div
          key={item.id}
          className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium text-sm text-gray-900">{item.caller}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyles[item.priority]}`}>
                {item.priority}
              </span>
              {item.status === "assigned" && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">assigned</span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{item.reason}</p>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <Clock className="w-3 h-3" />
            {formatWait(waited[i])}
          </div>

          <button className="text-xs text-brand-600 hover:text-brand-800 font-medium flex-shrink-0">
            Assign
          </button>
        </div>
      ))}
    </div>
  );
}
