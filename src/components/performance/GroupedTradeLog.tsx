"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Calendar } from "lucide-react";
import TradeLogTable from "./TradeLogTable";
import type { Trade } from "@/lib/types";

function getWeekStart(dateStr: string): string {
  if (!dateStr) return "unknown";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "unknown";
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

function formatWeekRange(weekStart: string): string {
  if (weekStart === "unknown") return "Unknown dates";
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}, ${start.getFullYear()}`;
}

function computeWeekStats(trades: Trade[]) {
  const wins = trades.filter((t) => t.result === "Win").length;
  const losses = trades.filter((t) => t.result === "Loss").length;
  const pips = trades.reduce((s, t) => s + (t.overall_pips || t.pips || 0), 0);
  const dollars = trades.reduce((s, t) => {
    const v = parseFloat((t.dollar_result || "").replace(/[^0-9.\-]/g, ""));
    return s + (isNaN(v) ? 0 : v);
  }, 0);
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
  return { wins, losses, pips: Math.round(pips * 10) / 10, dollars: Math.round(dollars * 100) / 100, winRate };
}

export default function GroupedTradeLog({
  trades,
  onRefresh,
}: {
  trades: Trade[];
  onRefresh: () => void;
}) {
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set());

  // Group by week, sort weeks descending
  const weekGroups = useMemo(() => {
    const groups = new Map<string, Trade[]>();
    for (const t of trades) {
      const ws = getWeekStart(t.trade_date);
      if (!groups.has(ws)) groups.set(ws, []);
      groups.get(ws)!.push(t);
    }
    return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [trades]);

  function toggleWeek(ws: string) {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(ws)) next.delete(ws); else next.add(ws);
      return next;
    });
  }

  if (weekGroups.length === 0) {
    return <TradeLogTable trades={[]} onRefresh={onRefresh} />;
  }

  return (
    <div className="space-y-4">
      {/* Add trade is in the first (most recent) week's table */}
      {weekGroups.map(([weekStart, weekTrades], idx) => {
        const isCollapsed = collapsedWeeks.has(weekStart);
        const stats = computeWeekStats(weekTrades);

        return (
          <div key={weekStart} className="glass rounded-2xl border border-pink-200/40 overflow-hidden">
            {/* Week header */}
            <button
              onClick={() => toggleWeek(weekStart)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-pink-50/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-pink-500" />
                <span className="text-sm font-semibold text-gray-900">
                  {formatWeekRange(weekStart)}
                </span>
                <span className="text-[10px] text-gray-400">
                  {weekTrades.length} trades
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Quick stats */}
                <div className="hidden sm:flex items-center gap-3 text-[11px]">
                  <span className="text-emerald-500 font-medium">{stats.wins}W</span>
                  <span className="text-red-500 font-medium">{stats.losses}L</span>
                  <span className={`font-medium ${stats.pips >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {stats.pips > 0 ? "+" : ""}{stats.pips}p
                  </span>
                  <span className={`font-medium ${stats.dollars >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {stats.dollars >= 0 ? "+" : ""}${Math.abs(stats.dollars).toLocaleString()}
                  </span>
                  <span className="text-gray-400">{stats.winRate}% WR</span>
                </div>

                {/* Win/loss mini bar */}
                <div className="hidden md:flex w-20 h-2 rounded-full overflow-hidden bg-gray-100">
                  {stats.wins > 0 && (
                    <div className="bg-emerald-400" style={{ width: `${(stats.wins / weekTrades.length) * 100}%` }} />
                  )}
                  {stats.losses > 0 && (
                    <div className="bg-red-400" style={{ width: `${(stats.losses / weekTrades.length) * 100}%` }} />
                  )}
                </div>

                {isCollapsed ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
              </div>
            </button>

            {/* Table content */}
            {!isCollapsed && (
              <div className="px-5 pb-4 border-t border-pink-200/30">
                <TradeLogTable
                  trades={weekTrades}
                  onRefresh={onRefresh}
                  compact={idx > 0}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
