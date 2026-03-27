"use client";

import { useMemo, useState } from "react";
import {
  DollarSign,
  Hash,
  Percent,
  Target,
  Play,
  Newspaper,
  Brain,
  BarChart3,
  LayoutDashboard,
  Clock,
  Shield,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Loader2,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { LazyPnlAreaChart as PnlAreaChart, LazyWinLossPieChart as WinLossPieChart } from "@/components/charts/lazy";
import AccountDashboard from "@/components/accounts/AccountDashboard";
import { usePerformance } from "@/hooks/use-performance";
import { useBriefing } from "@/hooks/use-briefing";
import { useTraderProfile } from "@/hooks/use-trader-profile";
import { useChartTime } from "@/hooks/use-chart-time";
import { useJournals } from "@/hooks/use-journals";
import { useTrades } from "@/hooks/use-trades";
import { useDiscipline } from "@/hooks/use-discipline";
import { useMissedTrades } from "@/hooks/use-missed-trades";
import { computeInsights } from "@/lib/compute-insights";
import { getWeekStart } from "@/lib/date-utils";
import type { Trade } from "@/lib/types";

const QUICK_ACTIONS = [
  { icon: Newspaper, label: "Run Daily Briefing", desc: "Fetch latest fundamentals" },
  { icon: Brain, label: "Psychology Check", desc: "Pre-session mindset review" },
  { icon: BarChart3, label: "Update Performance", desc: "Sync this week's data" },
  { icon: Target, label: "Weekly Plan", desc: "Map the week ahead" },
];

function getGreeting(): { text: string; icon: typeof Sun } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", icon: Sun };
  if (h < 18) return { text: "Good afternoon", icon: Sunset };
  return { text: "Good evening", icon: Moon };
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Group trades by ISO week and compute weekly values for sparklines + trends */
function computeWeeklyHistory(trades: Trade[]) {
  const weekMap = new Map<string, { pnl: number; trades: number; wins: number; total: number }>();

  for (const t of trades) {
    const ws = getWeekStart(t.trade_date);
    const d = weekMap.get(ws) || { pnl: 0, trades: 0, wins: 0, total: 0 };
    d.trades++;
    d.total++;
    if (t.result === "Win") d.wins++;
    const dollarVal = parseFloat((t.dollar_result || "").replace(/[^0-9.\-]/g, ""));
    d.pnl += isNaN(dollarVal) ? 0 : dollarVal;
    weekMap.set(ws, d);
  }

  const sorted = [...weekMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([, d]) => ({
    pnl: Math.round(d.pnl),
    trades: d.trades,
    winRate: d.total > 0 ? Math.round((d.wins / d.total) * 100) : 0,
  }));
}

const INSIGHT_STYLES = {
  positive: "bg-emerald-50/60 border-emerald-200/40",
  neutral: "bg-amber-50/60 border-amber-200/40",
  warning: "bg-red-50/60 border-red-200/40",
};
const INSIGHT_ICON_COLORS = {
  positive: "text-emerald-500",
  neutral: "text-amber-500",
  warning: "text-red-500",
};

export default function DashboardPage() {
  const { stats, hasData, loading: perfLoading } = usePerformance();
  const { briefing, loading: briefLoading } = useBriefing();
  const { profile, propAccounts, loading: profileLoading } = useTraderProfile();
  const { totalHours, loading: ctLoading } = useChartTime();
  const { journals, loading: jLoading } = useJournals();
  const { trades, loading: tLoading } = useTrades();
  const { trades: missedTrades } = useMissedTrades();
  const { scores } = useDiscipline(trades, journals, [], missedTrades);

  const insights = useMemo(() => computeInsights(trades), [trades]);
  const weeklyHistory = useMemo(() => computeWeeklyHistory(trades), [trades]);

  const loading = perfLoading || briefLoading || profileLoading || ctLoading || jLoading || tLoading;
  const [genBriefing, setGenBriefing] = useState(false);

  // Compute account count from trades
  const accountNames = useMemo(() => [...new Set(trades.map((t) => t.account_name).filter(Boolean))], [trades]);

  // Compute trends: compare last week vs previous week
  const trends = useMemo(() => {
    if (weeklyHistory.length < 2) return null;
    const curr = weeklyHistory[weeklyHistory.length - 1];
    const prev = weeklyHistory[weeklyHistory.length - 2];
    return {
      pnl: { delta: `$${Math.abs(curr.pnl - prev.pnl)}`, positive: curr.pnl >= prev.pnl },
      trades: { delta: `${Math.abs(curr.trades - prev.trades)}`, positive: curr.trades >= prev.trades },
      winRate: { delta: `${Math.abs(curr.winRate - prev.winRate)}%`, positive: curr.winRate >= prev.winRate },
    };
  }, [weeklyHistory]);

  const greeting = getGreeting();
  const firstName = profile.full_name?.split(" ")[0] || "";
  const GreetingIcon = greeting.icon;

  if (loading) return <DashboardSkeleton />;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GreetingIcon size={20} className="text-amber-400" />
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting.text}{firstName ? `, ${firstName}` : ""}
            </h1>
          </div>
          <p className="text-sm text-gray-500">{formatToday()}</p>
        </div>
        <div className="glass rounded-2xl border border-brand-light/40">
          <EmptyState
            icon={LayoutDashboard}
            title="No trading data yet"
            description="Connect your Google Sheet trading tracker to see your performance dashboard with charts, stats, and insights."
          />
        </div>
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Copilot Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => (
              <button key={a.label} className="flex flex-col items-start p-3 bg-brand-light/60 rounded-lg hover:bg-brand-light/60 transition-colors text-left">
                <a.icon size={16} className="text-brand mb-1.5" />
                <span className="text-xs font-medium text-gray-900">{a.label}</span>
                <span className="text-[10px] text-gray-400">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const highImpactEvents = briefing?.calendar_events?.filter((e) => e.impact === "high") || [];

  // Sparkline data (last 4 weeks)
  const last4 = weeklyHistory.slice(-4);
  const pnlSparkline = last4.map((w) => w.pnl);
  const tradeSparkline = last4.map((w) => w.trades);
  const wrSparkline = last4.map((w) => w.winRate);

  return (
    <div className="space-y-6">
      {/* Personalized Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GreetingIcon size={20} className="text-amber-400" />
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting.text}{firstName ? `, ${firstName}` : ""}
            </h1>
          </div>
          <p className="text-sm text-gray-500">{formatToday()}</p>
        </div>
        <button
          onClick={async () => {
            setGenBriefing(true);
            try {
              const ws = getWeekStart(new Date().toISOString().split("T")[0]);
              await fetch("/api/briefing/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekStart: ws }) });
            } catch { /* silent */ }
            finally { setGenBriefing(false); }
          }}
          disabled={genBriefing}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors shadow-md shadow-brand/20"
        >
          {genBriefing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {genBriefing ? "Generating..." : "Run Briefing"}
        </button>
      </div>

      {/* Stat Cards — 6 columns with trends + sparklines */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={DollarSign}
          label="Cumulative P/L"
          value={`$${stats.totalPnl.toLocaleString()}`}
          color="text-emerald-500"
          trend={trends?.pnl}
          sparkline={pnlSparkline}
        />
        <StatCard
          icon={Hash}
          label="Total Trades"
          value={stats.totalTrades}
          color="text-blue-500"
          trend={trends?.trades}
          sparkline={tradeSparkline}
        />
        <StatCard
          icon={Percent}
          label="Win Rate"
          value={`${stats.avgWinRate}%`}
          color="text-amber-500"
          trend={trends?.winRate}
          sparkline={wrSparkline}
        />
        <StatCard
          icon={Target}
          label="Accounts"
          value={accountNames.length || "—"}
          color="text-purple-500"
          id="accounts-card"
          onClick={accountNames.length > 0 ? () => document.getElementById("account-section")?.scrollIntoView({ behavior: "smooth" }) : undefined}
          sub={accountNames.length > 0 ? "Click to view" : undefined}
        />
        <StatCard
          icon={Clock}
          label="Chart Time"
          value={totalHours > 0 ? `${totalHours}h` : "—"}
          color="text-brand"
        />
        <StatCard
          icon={Shield}
          label="Discipline"
          value={scores.overall > 0 ? scores.overall : "—"}
          color={scores.overall >= 80 ? "text-emerald-500" : scores.overall >= 60 ? "text-amber-500" : "text-gray-400"}
        />
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-brand" />
            <h3 className="text-sm font-semibold text-gray-900">AI Insights</h3>
            <span className="text-[10px] text-gray-400">Computed from your trade data</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${INSIGHT_STYLES[insight.variant]}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <insight.icon size={14} className={INSIGHT_ICON_COLORS[insight.variant]} />
                  <span className="text-xs font-semibold text-gray-900">{insight.headline}</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{insight.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Cumulative P/L Curve</h3>
          {stats.cumPnl.length > 0 ? (
            <PnlAreaChart data={stats.cumPnl} />
          ) : (
            <p className="text-xs text-gray-400 py-16 text-center">No performance data yet</p>
          )}
        </div>
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Win / Loss / BE</h3>
          {stats.winLossData.some((d) => d.value > 0) ? (
            <WinLossPieChart data={stats.winLossData} />
          ) : (
            <p className="text-xs text-gray-400 py-16 text-center">No trade results yet</p>
          )}
        </div>
      </div>

      {/* Trading Accounts — auto-computed from trade data */}
      {trades.length > 0 && (
        <div id="account-section" className="glass rounded-2xl p-5 border border-brand-light/40">
          <AccountDashboard trades={trades} />
        </div>
      )}

      {/* Events + Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            This Week&apos;s High Impact Events
          </h3>
          {highImpactEvents.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {highImpactEvents.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-brand-light/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-8">{e.day}</span>
                    <span className="text-xs text-gray-500 w-12">{e.time}</span>
                    <span className="text-sm text-gray-700">{e.event}</span>
                  </div>
                  <Badge variant="high">{e.currency}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-6 text-center">No briefing data — run a weekly briefing to see events</p>
          )}
        </div>

        <div className="glass rounded-2xl p-5 border border-brand-light/40">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Copilot Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => (
              <button key={a.label} className="flex flex-col items-start p-3 bg-brand-light/60 rounded-xl hover:bg-brand-light/60 transition-colors text-left">
                <a.icon size={16} className="text-brand mb-1.5" />
                <span className="text-xs font-medium text-gray-900">{a.label}</span>
                <span className="text-[10px] text-gray-400">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
