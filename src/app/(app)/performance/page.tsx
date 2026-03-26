"use client";

import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import WeeklyPnlBarChart from "@/components/charts/WeeklyPnlBarChart";
import WinRateLineChart from "@/components/charts/WinRateLineChart";
import SessionBarChart from "@/components/charts/SessionBarChart";
import DayOfWeekBarChart from "@/components/charts/DayOfWeekBarChart";
import AccountBalanceLineChart from "@/components/charts/AccountBalanceLineChart";
import PeriodSummary from "@/components/performance/PeriodSummary";
import GroupedTradeLog from "@/components/performance/GroupedTradeLog";
import { usePerformance } from "@/hooks/use-performance";
import { useTrades } from "@/hooks/use-trades";
import { useAccountBalances } from "@/hooks/use-account-balances";
import type { Trade } from "@/lib/types";

type PeriodView = "weekly" | "monthly" | "quarterly" | "all";

function getWeekStart(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  return mon.toISOString().split("T")[0];
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

function getQuarterKey(dateStr: string): string {
  const month = parseInt(dateStr.slice(5, 7));
  const q = Math.ceil(month / 3);
  return `${dateStr.slice(0, 4)}-Q${q}`;
}

function formatMonthLabel(key: string): string {
  const d = new Date(key + "-01");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatQuarterLabel(key: string): string {
  const [year, q] = key.split("-");
  return `${q} ${year}`;
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

function groupTrades(
  trades: Trade[],
  period: PeriodView,
): { key: string; label: string; trades: Trade[] }[] {
  if (period === "all") {
    return [{ key: "all", label: "All Time", trades }];
  }

  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const k =
      period === "weekly" ? getWeekStart(t.trade_date)
      : period === "monthly" ? getMonthKey(t.trade_date)
      : getQuarterKey(t.trade_date);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(t);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, trades]) => ({
      key,
      label:
        period === "weekly" ? formatWeekLabel(key)
        : period === "monthly" ? formatMonthLabel(key)
        : formatQuarterLabel(key),
      trades,
    }));
}

export default function PerformancePage() {
  const { weeks, sessionData, dayData, loading: perfLoading, hasData: hasPerfData } = usePerformance();
  const { trades, loading: tradesLoading, refresh: refreshTrades } = useTrades();
  const { byAccount, accountNames, hasData: hasBalances, loading: balLoading } = useAccountBalances();
  const [periodView, setPeriodView] = useState<PeriodView>("weekly");

  const loading = perfLoading || tradesLoading || balLoading;

  const periodGroups = useMemo(() => groupTrades(trades, periodView), [trades, periodView]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/50 rounded w-56" />
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl h-64 border border-pink-200/40" />
          <div className="glass rounded-2xl h-64 border border-pink-200/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed breakdown of your trading metrics</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/50 border border-pink-200/40 rounded-xl">
          {(["weekly", "monthly", "quarterly", "all"] as PeriodView[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodView(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                periodView === p
                  ? "bg-pink-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-pink-50"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Period summaries */}
      {periodGroups.map((group) => (
        <PeriodSummary
          key={group.key}
          label={`${periodView === "all" ? "All Time" : group.label} Performance`}
          trades={group.trades}
        />
      ))}

      {/* Charts — only show if there's performance data */}
      {hasPerfData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5 border border-pink-200/40">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Weekly P/L</h3>
              <WeeklyPnlBarChart data={weeks} />
            </div>
            <div className="glass rounded-2xl p-5 border border-pink-200/40">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Win Rate Trend</h3>
              <WinRateLineChart data={weeks} />
            </div>
          </div>

          {(sessionData.length > 0 || dayData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sessionData.length > 0 && (
                <div className="glass rounded-2xl p-5 border border-pink-200/40">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance by Session</h3>
                  <SessionBarChart data={sessionData} />
                </div>
              )}
              {dayData.length > 0 && (
                <div className="glass rounded-2xl p-5 border border-pink-200/40">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Trades by Day of Week</h3>
                  <DayOfWeekBarChart data={dayData} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Account Balances */}
      {hasBalances && (
        <div className="glass rounded-2xl p-5 border border-pink-200/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Account Balances Over Time</h3>
          <AccountBalanceLineChart byAccount={byAccount} accountNames={accountNames} />
        </div>
      )}

      {/* Trade Log — grouped by week */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-pink-500" />
          <h3 className="text-sm font-semibold text-gray-900">Trade Log</h3>
          <span className="text-[10px] text-gray-400">{trades.length} total trades</span>
        </div>
        <GroupedTradeLog trades={trades} onRefresh={refreshTrades} />
      </div>
    </div>
  );
}
