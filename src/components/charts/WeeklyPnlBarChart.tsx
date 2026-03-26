"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

export default function WeeklyPnlBarChart({
  data,
}: {
  data: { week_label: string; pnl: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,114,182,0.15)" />
        <XAxis
          dataKey="week_label"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickFormatter={(v: number) => `$${v}`}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(244,114,182,0.2)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pnl >= 0 ? "#10b981" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
