"use client";

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
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PnlAreaChart from "@/components/charts/PnlAreaChart";
import WinLossPieChart from "@/components/charts/WinLossPieChart";
import { usePerformance } from "@/hooks/use-performance";
import { useBriefing } from "@/hooks/use-briefing";

const QUICK_ACTIONS = [
  { icon: Newspaper, label: "Run Daily Briefing", desc: "Fetch latest fundamentals" },
  { icon: Brain, label: "Psychology Check", desc: "Pre-session mindset review" },
  { icon: BarChart3, label: "Update Performance", desc: "Sync this week's data" },
  { icon: Target, label: "Weekly Plan", desc: "Map the week ahead" },
];

export default function DashboardPage() {
  const { stats, hasData, loading: perfLoading } = usePerformance();
  const { briefing, loading: briefLoading } = useBriefing();

  if (perfLoading || briefLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl h-24 border border-slate-700" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-slate-800 rounded-xl h-64 border border-slate-700" />
          <div className="bg-slate-800 rounded-xl h-64 border border-slate-700" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Your trading copilot overview</p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <EmptyState
            icon={LayoutDashboard}
            title="No trading data yet"
            description="Connect your Google Sheet trading tracker to see your performance dashboard with charts, stats, and insights."
          />
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">Copilot Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                className="flex flex-col items-start p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors text-left"
              >
                <a.icon size={16} className="text-indigo-400 mb-1.5" />
                <span className="text-xs font-medium text-white">{a.label}</span>
                <span className="text-[10px] text-slate-500">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Extract calendar events from briefing if available
  const highImpactEvents = briefing?.calendar_events?.filter((e) => e.impact === "high") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Your trading copilot overview</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors">
          <Play size={14} /> Run Briefing
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Cumulative P/L"
          value={`$${stats.totalPnl.toLocaleString()}`}
          color="text-emerald-400"
        />
        <StatCard
          icon={Hash}
          label="Total Trades"
          value={stats.totalTrades}
          sub={`Across ${stats.cumPnl.length} weeks`}
          color="text-blue-400"
        />
        <StatCard
          icon={Percent}
          label="Avg Win Rate"
          value={`${stats.avgWinRate}%`}
          sub="Target: 65%+"
          color="text-amber-400"
        />
        <StatCard
          icon={Target}
          label="Accounts Active"
          value="—"
          color="text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Cumulative P/L Curve</h3>
          {stats.cumPnl.length > 0 ? (
            <PnlAreaChart data={stats.cumPnl} />
          ) : (
            <p className="text-xs text-slate-500 py-16 text-center">No performance data yet</p>
          )}
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4">Win / Loss / BE</h3>
          {stats.winLossData.some((d) => d.value > 0) ? (
            <WinLossPieChart data={stats.winLossData} />
          ) : (
            <p className="text-xs text-slate-500 py-16 text-center">No trade results yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">
            This Week&apos;s High Impact Events
          </h3>
          {highImpactEvents.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {highImpactEvents.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-8">{e.day}</span>
                    <span className="text-xs text-slate-400 w-12">{e.time}</span>
                    <span className="text-sm text-slate-200">{e.event}</span>
                  </div>
                  <Badge variant="high">{e.currency}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No briefing data — run a weekly briefing to see events</p>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">Copilot Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                className="flex flex-col items-start p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors text-left"
              >
                <a.icon size={16} className="text-indigo-400 mb-1.5" />
                <span className="text-xs font-medium text-white">{a.label}</span>
                <span className="text-[10px] text-slate-500">{a.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
