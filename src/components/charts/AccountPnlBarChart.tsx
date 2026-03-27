"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Trade } from "@/lib/types";

const ACCOUNT_COLORS = ["#e98e97", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444"];

export default function AccountPnlBarChart({
  trades,
  periodKeyFn,
  labelFn,
}: {
  trades: Trade[];
  periodKeyFn: (dateStr: string) => string;
  labelFn: (key: string) => string;
}) {
  // Get all accounts
  const accountSet = new Set<string>();
  for (const t of trades) {
    if (t.account_name) accountSet.add(t.account_name);
  }
  const accounts = [...accountSet];

  if (accounts.length === 0) {
    // Fallback: single bar for all trades
    const groups = new Map<string, number>();
    for (const t of trades) {
      const k = periodKeyFn(t.trade_date);
      const v = parseFloat((t.dollar_result || "").replace(/[^0-9.\-]/g, ""));
      groups.set(k, (groups.get(k) || 0) + (isNaN(v) ? 0 : v));
    }
    const data = [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, pnl]) => ({ period: labelFn(key), "All Trades": Math.round(pnl * 100) / 100 }));

    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,114,182,0.15)" />
          <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#9ca3af" }} angle={-15} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v: number) => `$${v}`} />
          <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(244,114,182,0.2)", borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="All Trades" fill="#e98e97" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Group by period and account
  const periodMap = new Map<string, Record<string, number>>();
  for (const t of trades) {
    const k = periodKeyFn(t.trade_date);
    if (!periodMap.has(k)) periodMap.set(k, {});
    const record = periodMap.get(k)!;
    const acct = t.account_name || "Other";
    const v = parseFloat((t.dollar_result || "").replace(/[^0-9.\-]/g, ""));
    record[acct] = (record[acct] || 0) + (isNaN(v) ? 0 : v);
  }

  const data = [...periodMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, record]) => {
      const row: Record<string, string | number> = { period: labelFn(key) };
      for (const acct of accounts) {
        row[acct] = Math.round((record[acct] || 0) * 100) / 100;
      }
      return row;
    });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(244,114,182,0.15)" />
        <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#9ca3af" }} angle={-15} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v: number) => `$${v}`} />
        <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(244,114,182,0.2)", borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {accounts.map((acct, i) => (
          <Bar key={acct} dataKey={acct} fill={ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]} radius={[4, 4, 0, 0]} stackId="a" />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
