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
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 10, fill: "#64748b" }}
          tickFormatter={(v: number) => EMOTION_LABELS[v] || ""}
          width={70}
        />
        <ReferenceLine y={3} stroke="#475569" strokeDasharray="3 3" />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
          formatter={(value, name) => [EMOTION_LABELS[Number(value)] || value, name]}
        />
        <Line type="monotone" dataKey="before" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: "#8b5cf6" }} name="Before" />
        <Line type="monotone" dataKey="during" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: "#6366f1" }} name="During" />
        <Line type="monotone" dataKey="after" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: "#10b981" }} name="After" />
      </LineChart>
    </ResponsiveContainer>
  );
}
