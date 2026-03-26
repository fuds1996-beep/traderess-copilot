"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { AccountBalance } from "@/lib/types";

const ACCOUNT_COLORS = ["#ec4899", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AccountBalanceLineChart({
  byAccount,
  accountNames,
}: {
  byAccount: Record<string, AccountBalance[]>;
  accountNames: string[];
}) {
  // Build unified data array: each point has week_start + one field per account
  const allWeeks = new Set<string>();
  for (const acct of accountNames) {
    for (const b of byAccount[acct]) {
      allWeeks.add(b.week_start);
    }
  }

  const sortedWeeks = [...allWeeks].sort();
  const chartData = sortedWeeks.map((week) => {
    const point: Record<string, string | number> = { week: week.slice(5) }; // MM-DD
    for (const acct of accountNames) {
      const entry = byAccount[acct]?.find((b) => b.week_start === week);
      point[acct] = entry?.balance_end || entry?.balance_start || 0;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,114,182,0.15)" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(244,114,182,0.2)", borderRadius: 8, fontSize: 12 }}
          formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {accountNames.map((acct, i) => (
          <Line
            key={acct}
            type="monotone"
            dataKey={acct}
            stroke={ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
