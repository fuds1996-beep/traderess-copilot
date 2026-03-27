"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Calendar, Eye, EyeOff } from "lucide-react";
import TradeLogTable from "./TradeLogTable";
import type { Trade } from "@/lib/types";
import {
  getWeekStart,
  getMonthKey,
  getQuarterKey,
  formatWeekRange,
  formatMonthLabel,
  formatQuarterLabel,
} from "@/lib/date-utils";

type GroupMode = "week" | "month" | "quarter";

function computeGroupStats(trades: Trade[]) {
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

const DEFAULT_VISIBLE = new Set([
  "account_name", "day", "trade_date", "pair", "session",
  "entry_price", "sl_price", "tp_price", "direction",
  "result", "overall_pips", "rs_gained", "risk_reward",
  "dollar_result", "percent_risked", "trade_quality",
]);

export default function GroupedTradeLog({
  trades,
  onRefresh,
}: {
  trades: Trade[];
  onRefresh: () => void;
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupMode, setGroupMode] = useState<GroupMode>("week");
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(DEFAULT_VISIBLE);

  // Sort trades chronologically
  const sortedTrades = useMemo(() =>
    [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date)),
    [trades],
  );

  // Group by selected mode
  const groups = useMemo(() => {
    const keyFn = groupMode === "quarter" ? getQuarterKey : groupMode === "month" ? getMonthKey : getWeekStart;
    const labelFn = groupMode === "quarter" ? formatQuarterLabel : groupMode === "month" ? formatMonthLabel : formatWeekRange;

    const map = new Map<string, Trade[]>();
    for (const t of sortedTrades) {
      const k = keyFn(t.trade_date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, grpTrades]) => ({ key, label: labelFn(key), trades: grpTrades }));
  }, [sortedTrades, groupMode]);

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleColumn(col: string) {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col); else next.add(col);
      return next;
    });
  }

  if (groups.length === 0) {
    return <TradeLogTable trades={[]} onRefresh={onRefresh} />;
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-0.5 bg-white/50 border border-pink-200/40 rounded-lg">
          {(["week", "month", "quarter"] as GroupMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setGroupMode(m)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                groupMode === m ? "bg-pink-500 text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m === "week" ? "Weekly" : m === "month" ? "Monthly" : "Quarterly"}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-gray-500 bg-white/50 border border-pink-200/40 rounded-lg hover:bg-white/70 transition-colors"
          >
            {showColumnPicker ? <EyeOff size={11} /> : <Eye size={11} />}
            Columns ({visibleColumns.size})
          </button>

          {showColumnPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowColumnPicker(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-56 max-h-80 overflow-y-auto bg-white/95 backdrop-blur-xl border border-pink-200/40 rounded-xl shadow-lg p-2">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <span className="text-[10px] text-gray-400">Toggle columns</span>
                  <button onClick={() => setVisibleColumns(DEFAULT_VISIBLE)} className="text-[9px] text-pink-500 hover:text-pink-600">Reset</button>
                </div>
                {ALL_COLUMN_LABELS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 px-2 py-1 text-[10px] text-gray-600 hover:bg-pink-50/50 rounded cursor-pointer">
                    <input type="checkbox" checked={visibleColumns.has(key)} onChange={() => toggleColumn(key)} className="accent-pink-500 w-3 h-3" />
                    {label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Groups */}
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.key);
        const stats = computeGroupStats(group.trades);
        return (
          <div key={group.key} className="glass rounded-2xl border border-pink-200/40 overflow-hidden">
            <button onClick={() => toggleGroup(group.key)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-pink-50/40 transition-colors">
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-pink-500" />
                <span className="text-sm font-semibold text-gray-900">{group.label}</span>
                <span className="text-[10px] text-gray-400">{group.trades.length} trades</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 text-[11px]">
                  <span className="text-emerald-500 font-medium">{stats.wins}W</span>
                  <span className="text-red-500 font-medium">{stats.losses}L</span>
                  <span className={`font-medium ${stats.dollars >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {stats.dollars >= 0 ? "+" : ""}${Math.abs(stats.dollars).toLocaleString()}
                  </span>
                  <span className="text-gray-400">{stats.winRate}% WR</span>
                </div>
                <div className="hidden md:flex w-20 h-2 rounded-full overflow-hidden bg-gray-100">
                  {stats.wins > 0 && <div className="bg-emerald-400" style={{ width: `${(stats.wins / group.trades.length) * 100}%` }} />}
                  {stats.losses > 0 && <div className="bg-red-400" style={{ width: `${(stats.losses / group.trades.length) * 100}%` }} />}
                </div>
                {isCollapsed ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
              </div>
            </button>
            {!isCollapsed && (
              <div className="px-5 pb-4 border-t border-pink-200/30">
                <TradeLogTable trades={group.trades} onRefresh={onRefresh} visibleColumns={visibleColumns} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const ALL_COLUMN_LABELS = [
  { key: "account_name", label: "Account" },
  { key: "day", label: "Day" },
  { key: "trade_date", label: "Date" },
  { key: "scenario", label: "Scenario" },
  { key: "pair", label: "Pair" },
  { key: "session", label: "Session" },
  { key: "time_of_entry", label: "Entry Time" },
  { key: "time_of_exit", label: "Exit Time" },
  { key: "entry_price", label: "Entry Price" },
  { key: "sl_price", label: "SL Price" },
  { key: "tp_price", label: "TP Price" },
  { key: "direction", label: "Direction" },
  { key: "entry_strategy", label: "Entry Strategy" },
  { key: "sl_strategy", label: "SL Strategy" },
  { key: "tp_strategy", label: "TP Strategy" },
  { key: "entry_conf_1", label: "Confirmation 1" },
  { key: "entry_conf_2", label: "Confirmation 2" },
  { key: "entry_conf_3", label: "Confirmation 3" },
  { key: "fundamental_check", label: "Fundamental?" },
  { key: "event_within_2h", label: "Event 2h?" },
  { key: "safe_window", label: "Safe Window?" },
  { key: "result", label: "Result" },
  { key: "overall_pips", label: "Pips" },
  { key: "rs_gained", label: "R's Gained" },
  { key: "risk_reward", label: "R2R" },
  { key: "dollar_result", label: "$ Result" },
  { key: "percent_risked", label: "% Risked" },
  { key: "before_picture", label: "Before Pic" },
  { key: "after_picture", label: "After Pic" },
  { key: "trade_quality", label: "Quality" },
  { key: "forecasted", label: "Forecasted?" },
  { key: "trade_evaluation", label: "Evaluation" },
];
