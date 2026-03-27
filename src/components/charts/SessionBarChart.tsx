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

export default function SessionBarChart({
  data,
}: {
  data: { session: string; pips: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,114,182,0.15)" />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <YAxis
          dataKey="session"
          type="category"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          width={90}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(244,114,182,0.2)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="pips" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pips >= 0 ? "#e98e97" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
