"use client";

import { TrendingUp, TrendingDown, Award, Flame } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import WeeklyPnlBarChart from "@/components/charts/WeeklyPnlBarChart";
import WinRateLineChart from "@/components/charts/WinRateLineChart";
import SessionBarChart from "@/components/charts/SessionBarChart";
import DayOfWeekBarChart from "@/components/charts/DayOfWeekBarChart";
import TradeLogTable from "@/components/performance/TradeLogTable";
import { usePerformance } from "@/hooks/use-performance";
import { useTrades } from "@/hooks/use-trades";

export default function PerformancePage() {
  const { weeks, sessionData, dayData, loading: perfLoading } = usePerformance();
  const { trades, loading: tradesLoading } = useTrades();

  if (perfLoading || tradesLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-56" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl h-24 border border-slate-700" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl h-64 border border-slate-700" />
          <div className="bg-slate-800 rounded-xl h-64 border border-slate-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Performance Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Detailed breakdown of your trading metrics — educational backtesting
          data
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Best Week"
          value="$670"
          sub="Feb 23–27 · 75% WR"
          color="text-emerald-400"
        />
        <StatCard
          icon={TrendingDown}
          label="Worst Week"
          value="-$180"
          sub="Jan 19–23 · 25% WR"
          color="text-red-400"
        />
        <StatCard
          icon={Award}
          label="Best Streak"
          value="5 Wins"
          sub="Mar 2–13 consecutive"
          color="text-amber-400"
        />
        <StatCard
          icon={Flame}
          label="Biggest Loss"
          value="-$520"
          sub="Phone trade from car"
          color="text-red-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Weekly P/L</h3>
          <WeeklyPnlBarChart data={weeks} />
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">
            Win Rate Trend
          </h3>
          <WinRateLineChart data={weeks} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">
            Performance by Session
          </h3>
          <SessionBarChart data={sessionData} />
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">
            Trades by Day of Week
          </h3>
          <DayOfWeekBarChart data={dayData} />
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-4">
          Recent Trade Log
        </h3>
        <TradeLogTable trades={trades} />
      </div>
    </div>
  );
}
