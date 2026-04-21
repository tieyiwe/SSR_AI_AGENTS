import MetricsCard from "@/components/dashboard/MetricsCard";
import CallsChart from "@/components/dashboard/CallsChart";
import LiveQueue from "@/components/dashboard/LiveQueue";

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time AI performance metrics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricsCard
          title="Total Conversations"
          value="2,347"
          change="+8.2%"
          positive
          subtitle="Today"
        />
        <MetricsCard
          title="Automation Rate"
          value="69.9%"
          change="+2.1%"
          positive
          subtitle="Target: 70%"
        />
        <MetricsCard
          title="Avg Response Time"
          value="4.2s"
          change="-0.3s"
          positive
          subtitle="Target: <5s"
        />
        <MetricsCard
          title="Cost Today"
          value="$845"
          change="-12%"
          positive
          subtitle="vs yesterday"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Conversations (7 days)</h2>
          <CallsChart />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Channel Breakdown</h2>
          <div className="space-y-3">
            {[
              { channel: "Phone", count: 1850, pct: 78.8, ai: 73 },
              { channel: "WhatsApp", count: 320, pct: 13.6, ai: 81 },
              { channel: "Web Chat", count: 177, pct: 7.5, ai: 55 },
            ].map(({ channel, count, pct, ai }) => (
              <div key={channel}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{channel}</span>
                  <span className="text-gray-500">{count.toLocaleString()} · {ai}% AI</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="font-medium text-gray-700 text-sm mb-3">Language Distribution</h3>
            <div className="space-y-2">
              {[
                { lang: "English", pct: 45 },
                { lang: "French", pct: 30 },
                { lang: "Creole", pct: 20 },
                { lang: "Hindi", pct: 5 },
              ].map(({ lang, pct }) => (
                <div key={lang} className="flex items-center gap-2 text-sm">
                  <span className="w-20 text-gray-600">{lang}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full bg-gold-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-gray-400 w-8 text-right">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live queue */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Live Escalation Queue</h2>
        <LiveQueue />
      </div>
    </div>
  );
}
