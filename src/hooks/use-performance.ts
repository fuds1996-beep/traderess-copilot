"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Trade, WeeklyPerformance, DashboardStats } from "@/lib/types";

const EMPTY_STATS: DashboardStats = {
  totalPnl: 0,
  totalTrades: 0,
  avgWinRate: "0",
  cumPnl: [],
  winLossData: [
    { name: "Wins", value: 0 },
    { name: "Losses", value: 0 },
    { name: "BE", value: 0 },
  ],
};

/**
 * Compute dashboard stats from raw trades when no weekly aggregates exist.
 * Groups trades by ISO week and builds the same structure.
 */
function statsFromTrades(trades: Trade[]): DashboardStats {
  if (trades.length === 0) return EMPTY_STATS;

  const totalPnl = trades.reduce((s, t) => {
    const dollarVal = parseFloat((t.dollar_result || "").replace(/[^0-9.\-]/g, ""));
    return s + (isNaN(dollarVal) ? 0 : dollarVal);
  }, 0);

  const totalTrades = trades.length;

  const wins = trades.filter((t) => t.result === "Win").length;
  const losses = trades.filter((t) => t.result === "Loss").length;
  const be = trades.filter((t) => t.result === "BE").length;

  const avgWinRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0";

  // Group by trade_date to build a cumulative P/L curve
  const byDate = new Map<string, number>();
  for (const t of trades) {
    const date = t.trade_date || "unknown";
    const dollarVal = parseFloat((t.dollar_result || "").replace(/[^0-9.\-]/g, ""));
    byDate.set(date, (byDate.get(date) || 0) + (isNaN(dollarVal) ? 0 : dollarVal));
  }

  const sortedDates = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  let cumulative = 0;
  let lastYear = "";
  const cumPnl = sortedDates.map(([date, pnl]) => {
    cumulative += pnl;
    // Format as "MMM DD" — add year only when it changes
    const d = new Date(date);
    const year = date.slice(0, 4);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      + (year !== lastYear && lastYear !== "" ? ` '${year.slice(2)}` : "");
    lastYear = year;
    return { week: label, pnl: Math.round(cumulative * 100) / 100 };
  });

  // Session breakdown from trades
  const sessionMap = new Map<string, { trades: number; wins: number; pips: number }>();
  for (const t of trades) {
    const s = t.session || "Other";
    const existing = sessionMap.get(s) || { trades: 0, wins: 0, pips: 0 };
    existing.trades++;
    if (t.result === "Win") existing.wins++;
    existing.pips += t.overall_pips || t.pips || 0;
    sessionMap.set(s, existing);
  }
  const sessionData = [...sessionMap.entries()].map(([session, d]) => ({
    session,
    trades: d.trades,
    winRate: d.trades > 0 ? Math.round((d.wins / d.trades) * 100) : 0,
    pips: Math.round(d.pips * 10) / 10,
  }));

  // Day of week breakdown
  const dayMap = new Map<string, { trades: number; wins: number }>();
  for (const t of trades) {
    const dayName = t.day || getDayName(t.trade_date);
    if (!dayName) continue;
    const existing = dayMap.get(dayName) || { trades: 0, wins: 0 };
    existing.trades++;
    if (t.result === "Win") existing.wins++;
    dayMap.set(dayName, existing);
  }
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const dayData = dayOrder
    .filter((d) => dayMap.has(d))
    .map((d) => {
      const v = dayMap.get(d)!;
      return { day: d.slice(0, 3), trades: v.trades, winRate: v.trades > 0 ? Math.round((v.wins / v.trades) * 100) : 0 };
    });

  return {
    totalPnl: Math.round(totalPnl * 100) / 100,
    totalTrades,
    avgWinRate,
    cumPnl,
    winLossData: [
      { name: "Wins", value: wins },
      { name: "Losses", value: losses },
      { name: "BE", value: be },
    ],
    sessionData,
    dayData,
  };
}

function getDayName(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "long" });
  } catch {
    return "";
  }
}

function computeWeeklyStats(weeks: WeeklyPerformance[]): DashboardStats {
  if (weeks.length === 0) return EMPTY_STATS;

  const totalPnl = weeks.reduce((s, w) => s + w.pnl, 0);
  const totalTrades = weeks.reduce((s, w) => s + w.trades, 0);
  const avgWinRate = (
    weeks.reduce((s, w) => s + w.win_rate, 0) / weeks.length
  ).toFixed(1);

  const cumPnl = weeks.reduce<{ week: string; pnl: number }[]>((acc, w, i) => {
    acc.push({
      week: w.week_label.split(" ")[0],
      pnl: (acc[i - 1]?.pnl || 0) + w.pnl,
    });
    return acc;
  }, []);

  const totalWins = weeks.reduce((s, w) => s + w.wins, 0);
  const totalLosses = weeks.reduce((s, w) => s + w.losses, 0);
  const totalBE = weeks.reduce((s, w) => s + w.breakeven, 0);

  return {
    totalPnl,
    totalTrades,
    avgWinRate,
    cumPnl,
    winLossData: [
      { name: "Wins", value: totalWins },
      { name: "Losses", value: totalLosses },
      { name: "BE", value: totalBE },
    ],
  };
}

export function usePerformance() {
  const [weeks, setWeeks] = useState<WeeklyPerformance[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Fetch both in parallel
      const [weekRes, tradeRes] = await Promise.all([
        supabase
          .from("trading_performance")
          .select("*")
          .eq("user_id", user.id)
          .order("week_start"),
        supabase
          .from("trade_log")
          .select("*")
          .eq("user_id", user.id)
          .order("trade_date", { ascending: true }),
      ]);

      setWeeks((weekRes.data as WeeklyPerformance[]) || []);
      setTrades((tradeRes.data as Trade[]) || []);
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // trade_log is the source of truth — only show data if trades exist
  const hasTradeData = trades.length > 0;
  const hasWeeklyData = weeks.length > 0;
  const hasData = hasTradeData;

  // Always compute from trades (source of truth); fall back to weekly aggregates only if no trades
  const stats = hasTradeData
    ? statsFromTrades(trades)
    : hasWeeklyData
      ? computeWeeklyStats(weeks)
      : EMPTY_STATS;

  // Session and day data
  const tradeStats = statsFromTrades(trades);
  const sessionData = hasWeeklyData
    ? (weeks[weeks.length - 1]?.session_data?.length > 0
        ? weeks[weeks.length - 1].session_data
        : tradeStats.sessionData || [])
    : tradeStats.sessionData || [];
  const dayData = hasWeeklyData
    ? (weeks[weeks.length - 1]?.day_data?.length > 0
        ? weeks[weeks.length - 1].day_data
        : tradeStats.dayData || [])
    : tradeStats.dayData || [];

  return { weeks, stats, sessionData, dayData, loading, hasData };
}
