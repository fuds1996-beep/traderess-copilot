"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { EmotionDataPoint } from "@/hooks/use-psychology";

const EMOTION_LABELS = ["", "Frustrated", "Stressed", "Neutral", "Focused", "Confident"];

export default function EmotionTimelineChart({
  data,
}: {
  data: EmotionDataPoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,114,182,0.15)" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 10, fill: "#d1d5db" }}
          tickFormatter={(v: number) => EMOTION_LABELS[v] || ""}
          width={70}
        />
        <ReferenceLine y={3} stroke="rgba(244,114,182,0.2)" strokeDasharray="3 3" />
        <Tooltip
          contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(244,114,182,0.2)", borderRadius: 8, fontSize: 12 }}
          formatter={(value, name) => [EMOTION_LABELS[Number(value)] || value, name]}
        />
        <Line type="monotone" dataKey="before" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: "#8b5cf6" }} name="Before" />
        <Line type="monotone" dataKey="during" stroke="#e98e97" strokeWidth={2} dot={{ r: 4, fill: "#e98e97" }} name="During" />
        <Line type="monotone" dataKey="after" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: "#10b981" }} name="After" />
      </LineChart>
    </ResponsiveContainer>
  );
}
