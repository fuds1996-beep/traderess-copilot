"use client";

import { TrendingUp } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import WeeklyPnlBarChart from "@/components/charts/WeeklyPnlBarChart";
import WinRateLineChart from "@/components/charts/WinRateLineChart";
import SessionBarChart from "@/components/charts/SessionBarChart";
import DayOfWeekBarChart from "@/components/charts/DayOfWeekBarChart";
import TradeLogTable from "@/components/performance/TradeLogTable";
import { usePerformance } from "@/hooks/use-performance";
import { useTrades } from "@/hooks/use-trades";

export default function PerformancePage() {
  const { weeks, sessionData, dayData, loading: perfLoading, hasData: hasPerfData } = usePerformance();
  const { trades, loading: tradesLoading, hasData: hasTradeData } = useTrades();

  if (perfLoading || tradesLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-56" />
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl h-64 border border-slate-700" />
          <div className="bg-slate-800 rounded-xl h-64 border border-slate-700" />
        </div>
      </div>
    );
  }

  if (!hasPerfData && !hasTradeData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Detailed breakdown of your trading metrics</p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <EmptyState
            icon={TrendingUp}
            title="No performance data yet"
            description="Connect your Google Sheet trading tracker to see weekly P/L charts, win rate trends, session breakdowns, and your full trade log."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Detailed breakdown of your trading metrics</p>
      </div>

      {/* Charts — only show sections that have data */}
      {hasPerfData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-4">Weekly P/L</h3>
              <WeeklyPnlBarChart data={weeks} />
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-4">Win Rate Trend</h3>
              <WinRateLineChart data={weeks} />
            </div>
          </div>

          {(sessionData.length > 0 || dayData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sessionData.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <h3 className="text-sm font-semibold text-white mb-4">Performance by Session</h3>
                  <SessionBarChart data={sessionData} />
                </div>
              )}
              {dayData.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <h3 className="text-sm font-semibold text-white mb-4">Trades by Day of Week</h3>
                  <DayOfWeekBarChart data={dayData} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Trade Log */}
      {hasTradeData && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Trade Log</h3>
          <TradeLogTable trades={trades} />
        </div>
      )}
    </div>
  );
}
