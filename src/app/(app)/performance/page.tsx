"use client";

import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { PerformanceSkeleton } from "@/components/ui/Skeleton";
import {
  LazyAccountPnlBarChart as AccountPnlBarChart,
  LazyWinRateLineChart as WinRateLineChart,
  LazySessionBarChart as SessionBarChart,
  LazyDayOfWeekBarChart as DayOfWeekBarChart,
  LazyAccountBalanceLineChart as AccountBalanceLineChart,
  LazyEmotionTimelineChart as EmotionTimelineChart,
} from "@/components/charts/lazy";
import PeriodSummary from "@/components/performance/PeriodSummary";
import GroupedTradeLog from "@/components/performance/GroupedTradeLog";
import { usePerformance } from "@/hooks/use-performance";
import { useTrades } from "@/hooks/use-trades";
import { useAccountBalances } from "@/hooks/use-account-balances";
import { useJournals } from "@/hooks/use-journals";
import { usePsychology } from "@/hooks/use-psychology";
import type { Trade, DailyJournal } from "@/lib/types";
import {
  getWeekStart,
  getMonthKey,
  getQuarterKey,
  formatMonthLabel,
  formatQuarterLabel,
  formatWeekLabel,
} from "@/lib/date-utils";

type PeriodView = "weekly" | "monthly" | "quarterly" | "all";

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

/** Compute win rate line chart data from trades grouped by period */
function computeWinRateData(trades: Trade[], period: PeriodView) {
  const keyFn = period === "quarterly" ? getQuarterKey
    : period === "monthly" ? getMonthKey
    : getWeekStart;
  const labelFn = (k: string) =>
    period === "quarterly" ? formatQuarterLabel(k)
    : period === "monthly" ? formatMonthLabel(k)
    : formatWeekLabel(k);

  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const k = keyFn(t.trade_date);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(t);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, grp]) => ({
      week_label: labelFn(key),
      win_rate: grp.length > 0 ? Math.round((grp.filter((t) => t.result === "Win").length / grp.length) * 100 * 10) / 10 : 0,
    }));
}

/** Get period key/label functions for the AccountPnlBarChart */
function getPeriodFns(period: PeriodView) {
  const keyFn = period === "quarterly" ? getQuarterKey
    : period === "monthly" ? getMonthKey
    : getWeekStart;
  const labelFn = (k: string) =>
    period === "quarterly" ? formatQuarterLabel(k)
    : period === "monthly" ? formatMonthLabel(k)
    : formatWeekLabel(k);
  return { keyFn, labelFn };
}

const PERIOD_LABELS: Record<PeriodView, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  all: "All Time",
};

export default function PerformancePage() {
  const { sessionData, dayData, loading: perfLoading } = usePerformance();
  const { trades, loading: tradesLoading, refresh: refreshTrades } = useTrades();
  const { byAccount, accountNames, hasData: hasBalances, loading: balLoading } = useAccountBalances();
  const { journals, loading: jLoading, refresh: refreshJournals } = useJournals();
  const psych = usePsychology(journals, trades);
  const [periodView, setPeriodView] = useState<PeriodView>("weekly");

  const loading = perfLoading || tradesLoading || balLoading || jLoading;

  const periodGroups = useMemo(() => groupTrades(trades, periodView), [trades, periodView]);
  const chartPeriod = periodView === "all" ? "monthly" : periodView;
  const winRateData = useMemo(() => computeWinRateData(trades, chartPeriod), [trades, chartPeriod]);
  const { keyFn, labelFn } = useMemo(() => getPeriodFns(chartPeriod), [chartPeriod]);

  if (loading) return <PerformanceSkeleton />;

  const chartPeriodLabel = periodView === "all" ? "Monthly" : PERIOD_LABELS[periodView];

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed breakdown of your trading metrics</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/50 border border-brand-light/40 rounded-xl">
          {(["weekly", "monthly", "quarterly", "all"] as PeriodView[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodView(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                periodView === p
                  ? "bg-brand text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-brand-light"
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

      {/* P/L by Account + Win Rate Charts */}
      {trades.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5 border border-brand-light/40">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{chartPeriodLabel} P/L by Account</h3>
            <AccountPnlBarChart trades={trades} periodKeyFn={keyFn} labelFn={labelFn} />
          </div>
          <div className="glass rounded-2xl p-5 border border-brand-light/40">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{chartPeriodLabel} Win Rate</h3>
            <WinRateLineChart data={winRateData} />
          </div>
        </div>
      )}

      {/* Session + Day charts */}
      {(sessionData.length > 0 || dayData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sessionData.length > 0 && (
            <div className="glass rounded-2xl p-5 border border-brand-light/40">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance by Session</h3>
              <SessionBarChart data={sessionData} />
            </div>
          )}
          {dayData.length > 0 && (
            <div className="glass rounded-2xl p-5 border border-brand-light/40">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Trades by Day of Week</h3>
              <DayOfWeekBarChart data={dayData} />
            </div>
          )}
        </div>
      )}

      {/* Account Balances */}
      {hasBalances && trades.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Account Balances Over Time</h3>
          <AccountBalanceLineChart byAccount={byAccount} accountNames={accountNames} />
        </div>
      )}

      {/* Psychology & Emotion Timeline */}
      {psych.emotionTimeline.length > 0 && (
        <div id="journal" className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Emotion & Psychology Timeline</h3>
          <EmotionTimelineChart data={psych.emotionTimeline} />
          <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Before</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand" /> During</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> After</span>
          </div>
          {psych.emotionPnlCorrelation.length > 0 && (
            <div className="mt-4 pt-4 border-t border-brand-light/30">
              <h4 className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Emotion vs Performance</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {psych.emotionPnlCorrelation.map((e) => (
                  <div key={e.emotion} className="p-2.5 bg-brand-light/60 rounded-lg text-center">
                    <div className="text-[11px] text-gray-500 mb-0.5">{e.emotion}</div>
                    <div className={`text-sm font-bold ${e.avgPips >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {e.avgPips > 0 ? "+" : ""}{e.avgPips}p
                    </div>
                    <div className="text-[9px] text-gray-400">{e.count} days</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trade Log + Journals — grouped by week */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-brand" />
          <h3 className="text-sm font-semibold text-gray-900">Trade Log & Journal</h3>
          <span className="text-[10px] text-gray-400">{trades.length} trades · {journals.length} journal entries</span>
        </div>
        <GroupedTradeLog trades={trades} journals={journals} onRefresh={() => { refreshTrades(); refreshJournals(); }} />
      </div>
    </div>
  );
}
