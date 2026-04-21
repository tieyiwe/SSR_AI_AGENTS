"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", ai: 1550, human: 620 },
  { day: "Tue", ai: 1680, human: 580 },
  { day: "Wed", day_label: "Wed", ai: 1420, human: 710 },
  { day: "Thu", ai: 1740, human: 550 },
  { day: "Fri", ai: 1890, human: 490 },
  { day: "Sat", ai: 1200, human: 400 },
  { day: "Sun", ai: 1641, human: 706 },
];

export default function CallsChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="ai" name="AI Resolved" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="human" name="Human Handled" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
