"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

export default function WinRateLineChart({
  data,
}: {
  data: { week_label: string; win_rate: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
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
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(244,114,182,0.2)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <ReferenceLine
          y={65}
          stroke="#f59e0b"
          strokeDasharray="5 5"
          strokeWidth={1}
          label={{
            value: "65% Target",
            position: "insideTopRight",
            fill: "#f59e0b",
            fontSize: 10,
          }}
        />
        <Line
          type="monotone"
          dataKey="win_rate"
          stroke="#e98e97"
          strokeWidth={2}
          dot={{ fill: "#e98e97", r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
