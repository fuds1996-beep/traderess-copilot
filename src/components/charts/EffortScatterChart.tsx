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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,114,182,0.15)" />
        <XAxis
          dataKey="effort"
          type="number"
          domain={[0, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          name="Effort"
          label={{ value: "Effort Rating", position: "insideBottom", offset: -5, fill: "#d1d5db", fontSize: 10 }}
        />
        <YAxis
          dataKey="pips"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          name="Pips"
          label={{ value: "Pips", angle: -90, position: "insideLeft", fill: "#d1d5db", fontSize: 10 }}
        />
        <ReferenceLine y={0} stroke="rgba(244,114,182,0.2)" />
        <Tooltip
          contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(244,114,182,0.2)", borderRadius: 8, fontSize: 12 }}
          formatter={(value, name) => [value, name]}
        />
        <Scatter data={data} fill="#ec4899" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
