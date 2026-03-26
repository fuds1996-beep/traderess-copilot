"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function CorrelationDualAxisChart({
  data,
}: {
  data: { date: string; minutes: number; pips: number }[];
}) {
  const chartData = data.map((d) => ({
    ...d,
    day: d.date.slice(5), // MM-DD
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,114,182,0.15)" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickFormatter={(v: number) => `${v}m`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickFormatter={(v: number) => `${v}p`}
        />
        <Tooltip
          contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(244,114,182,0.2)", borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar yAxisId="left" dataKey="minutes" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Chart Time (min)" opacity={0.7} />
        <Line yAxisId="right" type="monotone" dataKey="pips" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: "#10b981" }} name="Pips" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
