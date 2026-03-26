"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { ChartTimeEntry } from "@/lib/types";

export default function ChartTimeBarChart({
  data,
}: {
  data: ChartTimeEntry[];
}) {
  const chartData = data.map((d) => ({
    day: d.log_date.slice(5), // MM-DD
    minutes: d.total_minutes,
    hours: Math.round(d.total_minutes / 6) / 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickFormatter={(v: number) => `${v}m`}
        />
        <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1} label={{ value: "60m target", position: "insideTopRight", fill: "#f59e0b", fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
          formatter={(value) => [`${value} min`, "Chart Time"]}
        />
        <Bar dataKey="minutes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
