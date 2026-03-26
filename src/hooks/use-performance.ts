"use client";

import { useSupabaseQuery } from "./use-supabase-query";
import type { WeeklyPerformance, DashboardStats } from "@/lib/types";
import {
  PERFORMANCE_WEEKLY,
  WIN_LOSS_DATA,
  SESSION_DATA,
  DAY_DATA,
} from "@/lib/mock-data";

// Build mock WeeklyPerformance rows from the flat mock data
const MOCK_WEEKS: WeeklyPerformance[] = PERFORMANCE_WEEKLY.map((w, i) => ({
  id: String(i),
  user_id: "",
  week_label: w.week,
  week_start: "",
  week_end: "",
  pnl: w.pnl,
  trades: w.trades,
  win_rate: w.winRate,
  r_value: w.rValue,
  wins: 0,
  losses: 0,
  breakeven: 0,
  session_data: SESSION_DATA,
  day_data: DAY_DATA,
}));

function computeStats(weeks: WeeklyPerformance[]): DashboardStats {
  const totalPnl = weeks.reduce((s, w) => s + w.pnl, 0);
  const totalTrades = weeks.reduce((s, w) => s + w.trades, 0);
  const avgWinRate =
    weeks.length > 0
      ? (weeks.reduce((s, w) => s + w.win_rate, 0) / weeks.length).toFixed(1)
      : "0";

  const cumPnl = weeks.reduce<{ week: string; pnl: number }[]>((acc, w, i) => {
    acc.push({
      week: w.week_label.split(" ")[0],
      pnl: (acc[i - 1]?.pnl || 0) + w.pnl,
    });
    return acc;
  }, []);

  // Aggregate win/loss/be across all weeks
  const totalWins = weeks.reduce((s, w) => s + w.wins, 0);
  const totalLosses = weeks.reduce((s, w) => s + w.losses, 0);
  const totalBE = weeks.reduce((s, w) => s + w.breakeven, 0);
  const hasWinLoss = totalWins + totalLosses + totalBE > 0;

  const winLossData = hasWinLoss
    ? [
        { name: "Wins", value: totalWins },
        { name: "Losses", value: totalLosses },
        { name: "BE", value: totalBE },
      ]
    : WIN_LOSS_DATA;

  return { totalPnl, totalTrades, avgWinRate, cumPnl, winLossData };
}

export function usePerformance() {
  const { data: weeks, loading } = useSupabaseQuery<WeeklyPerformance[]>(
    async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: null };
      const { data, error } = await supabase
        .from("trading_performance")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start");
      return { data: data as WeeklyPerformance[] | null, error };
    },
    MOCK_WEEKS,
  );

  const stats = computeStats(weeks);

  // Use session/day data from the most recent week, or fallback
  const latest = weeks[weeks.length - 1];
  const sessionData =
    latest?.session_data?.length > 0 ? latest.session_data : SESSION_DATA;
  const dayData =
    latest?.day_data?.length > 0 ? latest.day_data : DAY_DATA;

  return { weeks, stats, sessionData, dayData, loading };
}
