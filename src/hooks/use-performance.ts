"use client";

import { useSupabaseQuery } from "./use-supabase-query";
import type { WeeklyPerformance, DashboardStats } from "@/lib/types";

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

function computeStats(weeks: WeeklyPerformance[]): DashboardStats {
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

  const winLossData = [
    { name: "Wins", value: totalWins },
    { name: "Losses", value: totalLosses },
    { name: "BE", value: totalBE },
  ];

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
    [],
  );

  const stats = computeStats(weeks);
  const hasData = weeks.length > 0;

  const latest = weeks[weeks.length - 1];
  const sessionData = latest?.session_data?.length > 0 ? latest.session_data : [];
  const dayData = latest?.day_data?.length > 0 ? latest.day_data : [];

  return { weeks, stats, sessionData, dayData, loading, hasData };
}
