"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function EffortScatterChart({
  data,
}: {
  data: { effort: number; pips: number; date: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="effort"
          type="number"
          domain={[0, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          name="Effort"
          label={{ value: "Effort Rating", position: "insideBottom", offset: -5, fill: "#64748b", fontSize: 10 }}
        />
        <YAxis
          dataKey="pips"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          name="Pips"
          label={{ value: "Pips", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 10 }}
        />
        <ReferenceLine y={0} stroke="#475569" />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
          formatter={(value, name) => [value, name]}
        />
        <Scatter data={data} fill="#6366f1" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
