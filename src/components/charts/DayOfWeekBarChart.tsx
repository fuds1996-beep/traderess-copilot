"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DayOfWeekBarChart({
  data,
}: {
  data: { day: string; trades: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,114,182,0.15)" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <Tooltip
          contentStyle={{
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(244,114,182,0.2)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="trades" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
